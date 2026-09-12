import type {
  Beer,
  Tasting,
  PersonStat,
  Gathering,
  NewTastingPayload,
  UpdateTastingPayload
} from "./types";
import { getAuthHeader, clearAuth, AuthRequiredError } from "./auth";

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    clearAuth();
    throw new AuthRequiredError();
  }
  if (!res.ok) {
    let message = `Fel (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore, use default message
    }
    throw new Error(message);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const authHeader = getAuthHeader();
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {})
    },
    ...options
  });
  return handleResponse<T>(res);
}

// Som request(), men skickar FormData (multipart) istället för JSON — så
// browsern sätter rätt Content-Type/boundary själv. Används för loggbokens
// bilduppladdning.
async function requestForm<T>(url: string, formData: FormData): Promise<T> {
  const authHeader = getAuthHeader();
  const res = await fetch(url, {
    method: "POST",
    headers: authHeader ? { Authorization: authHeader } : {},
    body: formData
  });
  return handleResponse<T>(res);
}

// Hämtar en skyddad resurs (t.ex. en bild) som Blob istället för JSON. Kan
// inte länkas direkt i en <img src>, eftersom lösenordsskyddet är ett
// Authorization-header (inte webbläsarens inbyggda Basic Auth) — se AuthImage.
export async function fetchAuthedBlob(url: string): Promise<Blob> {
  const authHeader = getAuthHeader();
  const res = await fetch(url, {
    headers: authHeader ? { Authorization: authHeader } : {}
  });
  if (res.status === 401) {
    clearAuth();
    throw new AuthRequiredError();
  }
  if (!res.ok) {
    throw new Error(`Fel (${res.status})`);
  }
  return res.blob();
}

export function gatheringPhotoUrl(gatheringId: number, photoId: number): string {
  return `/api/gatherings/${gatheringId}/photos/${photoId}`;
}

export const api = {
  getBeers: () => request<Beer[]>("/api/beers"),
  getTastings: () => request<Tasting[]>("/api/tastings"),
  getPersonStats: () => request<PersonStat[]>("/api/stats/persons"),
  createTasting: (payload: NewTastingPayload) =>
    request<Tasting>("/api/tastings", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateTasting: (id: number, payload: UpdateTastingPayload) =>
    request<Tasting>(`/api/tastings/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteTasting: (id: number) => request<void>(`/api/tastings/${id}`, { method: "DELETE" }),

  getGatherings: () => request<Gathering[]>("/api/gatherings"),
  createGathering: (occurredOn: string, description: string, photos: File[]) => {
    const form = new FormData();
    form.set("occurredOn", occurredOn);
    form.set("description", description);
    photos.forEach((photo) => form.append("photos", photo, photo.name));
    return requestForm<Gathering>("/api/gatherings", form);
  },
  deleteGathering: (id: number) => request<void>(`/api/gatherings/${id}`, { method: "DELETE" })
};
