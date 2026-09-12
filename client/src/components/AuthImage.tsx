import { useEffect, useState } from "react";
import { fetchAuthedBlob } from "../api";

interface AuthImageProps {
  src: string;
  alt: string;
  className?: string;
}

// En vanlig <img src="/api/..."> skulle skicka en request utan vår
// Authorization-header (det är inget cookie-baserat login) — servern svarar
// 401 med WWW-Authenticate, och webbläsaren visar då sin egen fula
// inloggningsruta igen, precis det PasswordModal ersatte. Så vi hämtar
// bilden själva via fetch (med header) och visar den som en blob-URL istället.
export default function AuthImage({ src, alt, className }: AuthImageProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    fetchAuthedBlob(src)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        // Visar bara platshållaren om bilden inte kunde hämtas.
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!url) {
    return <div className={`${className ?? ""} bg-white/5 animate-pulse`} role="img" aria-label={alt} />;
  }

  return <img src={url} alt={alt} className={className} />;
}
