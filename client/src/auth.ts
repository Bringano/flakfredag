const AUTH_STORAGE_KEY = "flakfredag-auth";

// Måste matcha APP_USERNAME på servern (server/Program.cs). Det enda som
// faktiskt är hemligt är lösenordet — användarnamnet är bara en teknisk
// detalj för att kunna återanvända HTTP Basic Auth på serversidan utan att
// visa webbläsarens egen inloggningsruta.
const SHARED_USERNAME = "flakfredag";

export class AuthRequiredError extends Error {
  constructor() {
    super("Fel lösenord, eller sessionen har gått ut.");
    this.name = "AuthRequiredError";
  }
}

// btoa() klarar bara Latin1 — kodar om till UTF-8-bytes först så att
// lösenord med å/ä/ö eller annat inte går sönder.
function toBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

export function getAuthHeader(): string | null {
  try {
    return sessionStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function hasStoredAuth(): boolean {
  return getAuthHeader() !== null;
}

export function clearAuth() {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// Provar lösenordet mot ett riktigt API-anrop (inget hemligt lösenord ligger
// inbakat i klientkoden). Sparas för resten av sessionen om det stämmer.
export async function verifyPassword(password: string): Promise<boolean> {
  const header = `Basic ${toBase64(`${SHARED_USERNAME}:${password}`)}`;
  const res = await fetch("/api/beers", { headers: { Authorization: header } });
  if (res.ok) {
    try {
      sessionStorage.setItem(AUTH_STORAGE_KEY, header);
    } catch {
      // ignore (t.ex. privat läge) — funkar ändå resten av sidladdningen
    }
    return true;
  }
  return false;
}
