import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { verifyPassword } from "../auth";

interface PasswordModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function PasswordModal({ onSuccess, onClose }: PasswordModalProps) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;

    setSubmitting(true);
    setError(null);
    try {
      const ok = await verifyPassword(password);
      if (ok) {
        onSuccess();
      } else {
        setError("Fel lösenord. Försök igen.");
      }
    } catch {
      setError("Kunde inte kontrollera lösenordet just nu. Försök igen.");
    } finally {
      setSubmitting(false);
    }
  }

  // Porta till document.body så positioneringen alltid är konsekvent, samma
  // som övriga modaler (se BeerDetailModal/EditTastingModal).
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#15100c] p-6 sm:p-8 space-y-5 text-center animate-fade-in-up"
      >
        <p className="text-4xl">🔒</p>
        <div>
          <p className="font-display text-xl">Lösenord krävs</p>
          <p className="text-sm text-amber-50/50 mt-1">Fråga Adam, Emil eller Victor om du inte har det.</p>
        </div>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Lösenord"
          className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-center text-amber-50 placeholder:text-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !password}
          className="w-full py-3 rounded-xl bg-amber-500 text-[#1c1410] font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          {submitting ? "Kontrollerar…" : "Fortsätt"}
        </button>
      </form>
    </div>,
    document.body
  );
}
