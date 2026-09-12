import { useEffect } from "react";
import { PERSONS } from "../types";
import type { Beer, Tasting } from "../types";

interface BeerDetailModalProps {
  beer: Beer;
  tastings: Tasting[];
  onClose: () => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric" });
}

export default function BeerDetailModal({ beer, tastings, onClose }: BeerDetailModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lås bakgrundssidan medan modalen är öppen, så det bara finns en
  // scrollbar (modalens egen) istället för att sidan och modalen scrollar var för sig.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const beerTastings = tastings
    .filter((t) => t.beerId === beer.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#15100c] p-5 sm:p-8 space-y-5 animate-fade-in-up"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-2xl truncate">{beer.name}</p>
            {beer.brewery && <p className="text-sm text-amber-50/40 truncate">{beer.brewery}</p>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-amber-50/50 hover:text-amber-50 text-xl leading-none"
            aria-label="Stäng"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <p className="font-display text-3xl text-amber-400 shrink-0">{beer.avgScore.toFixed(1)}</p>
          <p className="text-sm text-amber-50/60">
            snitt av {beer.ratingCount} {beer.ratingCount === 1 ? "betyg" : "betyg"} över{" "}
            {beerTastings.length} {beerTastings.length === 1 ? "provning" : "provningar"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {beerTastings.map((t) => (
            <div key={t.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-amber-50/50">{formatDate(t.createdAt)}</p>
                <p className="font-display text-lg text-amber-400 tabular-nums">{t.avgScore.toFixed(1)}</p>
              </div>
              <p className="mt-1 text-sm text-amber-50/70">🍽️ {t.food ?? "—"}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PERSONS.map((p) => {
                  const rating = t.ratings.find((r) => r.person === p);
                  return (
                    <span
                      key={p}
                      className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-amber-50/70 tabular-nums"
                    >
                      {p} {rating ? rating.score.toFixed(1) : "—"}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
