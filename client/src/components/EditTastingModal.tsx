import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PERSONS } from "../types";
import type { Person, Tasting } from "../types";
import { api } from "../api";
import RatingSliders from "./RatingSliders";

interface EditTastingModalProps {
  tasting: Tasting;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditTastingModal({ tasting, onClose, onSaved }: EditTastingModalProps) {
  const [beerName, setBeerName] = useState(tasting.beerName);
  const [brewery, setBrewery] = useState(tasting.brewery ?? "");
  const [food, setFood] = useState(tasting.food ?? "");
  const [scores, setScores] = useState<Record<Person, number>>(() => {
    const initial = {} as Record<Person, number>;
    for (const person of PERSONS) {
      initial[person] = tasting.ratings.find((r) => r.person === person)?.score ?? 7;
    }
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const updateScore = (person: Person, value: number) => {
    setScores((prev) => ({ ...prev, [person]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (beerName.trim() === "") {
      setError("Ange ölens namn.");
      return;
    }

    if (food.trim() === "") {
      setError("Ange vilken mat som åts till.");
      return;
    }

    setSubmitting(true);
    try {
      await api.updateTasting(tasting.id, {
        food: food.trim(),
        scores,
        beerName: beerName.trim(),
        brewery: brewery.trim() || undefined
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel.");
    } finally {
      setSubmitting(false);
    }
  }

  // Porta till document.body: annars hamnar modalen som barn av historikens
  // .animate-fade-in-up-container, vars transform (från animationen) gör den
  // till referenspunkt för "fixed" istället för viewporten — modalen centreras
  // då mitt i hela tabellens höjd, inte mitt på skärmen.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-full overflow-y-auto rounded-2xl border border-white/10 bg-[#15100c] p-5 sm:p-6 space-y-5 animate-fade-in-up"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-xl">Redigera provning</p>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-amber-50/50 hover:text-amber-50 text-xl leading-none"
            aria-label="Stäng"
          >
            ✕
          </button>
        </div>

        <div>
          <label className="block text-sm text-amber-50/60 mb-2">Namn på öl</label>
          <input
            type="text"
            value={beerName}
            onChange={(e) => setBeerName(e.target.value)}
            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-amber-50 placeholder:text-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <p className="mt-1.5 text-xs text-amber-50/40">
            Ändras här ändras namnet på alla provningar av samma öl.
          </p>
        </div>

        <div>
          <label className="block text-sm text-amber-50/60 mb-2">Bryggeri (valfritt)</label>
          <input
            type="text"
            value={brewery}
            onChange={(e) => setBrewery(e.target.value)}
            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-amber-50 placeholder:text-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm text-amber-50/60 mb-2">Mat</label>
          <input
            type="text"
            value={food}
            onChange={(e) => setFood(e.target.value)}
            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-amber-50 placeholder:text-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <RatingSliders scores={scores} onChange={updateScore} />

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-white/10 bg-white/5 text-amber-50/70 hover:bg-white/10 transition-colors"
          >
            Avbryt
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 text-[#1c1410] font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            {submitting ? "Sparar…" : "Spara"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
