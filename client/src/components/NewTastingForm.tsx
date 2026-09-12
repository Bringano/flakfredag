import { useState } from "react";
import type { Beer, Person } from "../types";
import { api } from "../api";
import RatingSliders from "./RatingSliders";

interface NewTastingFormProps {
  beers: Beer[];
  onCreated: () => void;
}

type BeerMode = "existing" | "new";

const DEFAULT_SCORES: Record<Person, number> = { Adam: 7, Emil: 7, Victor: 7 };

export default function NewTastingForm({ beers, onCreated }: NewTastingFormProps) {
  const [mode, setMode] = useState<BeerMode>(beers.length > 0 ? "existing" : "new");
  const [existingBeerId, setExistingBeerId] = useState<number | "">(beers[0]?.id ?? "");
  const [beerName, setBeerName] = useState("");
  const [brewery, setBrewery] = useState("");
  const [food, setFood] = useState("");
  const [scores, setScores] = useState<Record<Person, number>>(DEFAULT_SCORES);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateScore = (person: Person, value: number) => {
    setScores((prev) => ({ ...prev, [person]: value }));
  };

  const reset = (keepBeerChoice: boolean) => {
    setFood("");
    setScores(DEFAULT_SCORES);
    if (!keepBeerChoice) {
      setBeerName("");
      setBrewery("");
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (mode === "existing" && existingBeerId === "") {
      setError("Välj en öl.");
      return;
    }
    if (mode === "new" && beerName.trim() === "") {
      setError("Ange namn på ölen.");
      return;
    }
    if (food.trim() === "") {
      setError("Ange vilken mat som åts till.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createTasting({
        beerId: mode === "existing" ? Number(existingBeerId) : undefined,
        beerName: mode === "new" ? beerName.trim() : undefined,
        brewery: mode === "new" && brewery.trim() ? brewery.trim() : undefined,
        food: food.trim(),
        scores
      });
      setSuccess(true);
      reset(true);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto space-y-6 animate-fade-in-up rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"
    >
      <div>
        <label className="block text-sm text-amber-50/60 mb-2">Öl</label>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setMode("existing")}
            disabled={beers.length === 0}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors disabled:opacity-30 ${
              mode === "existing"
                ? "bg-amber-500 text-[#1c1410] border-amber-500"
                : "bg-white/5 border-white/10 text-amber-50/70"
            }`}
          >
            Befintlig öl
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              mode === "new"
                ? "bg-amber-500 text-[#1c1410] border-amber-500"
                : "bg-white/5 border-white/10 text-amber-50/70"
            }`}
          >
            Ny öl
          </button>
        </div>

        {mode === "existing" ? (
          <select
            value={existingBeerId}
            onChange={(e) => setExistingBeerId(e.target.value ? Number(e.target.value) : "")}
            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Välj öl…</option>
            {beers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
                {b.brewery ? ` (${b.brewery})` : ""}
              </option>
            ))}
          </select>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Ölens namn"
              value={beerName}
              onChange={(e) => setBeerName(e.target.value)}
              className="rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-amber-50 placeholder:text-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="text"
              placeholder="Bryggeri (valfritt)"
              value={brewery}
              onChange={(e) => setBrewery(e.target.value)}
              className="rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-amber-50 placeholder:text-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm text-amber-50/60 mb-2">Mat</label>
        <input
          type="text"
          placeholder="Vad åt ni till?"
          value={food}
          onChange={(e) => setFood(e.target.value)}
          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-amber-50 placeholder:text-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <RatingSliders scores={scores} onChange={updateScore} />

      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
      {success && (
        <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
          Provning registrerad! 🍻
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-xl bg-amber-500 text-[#1c1410] font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
      >
        {submitting ? "Sparar…" : "Registrera provning"}
      </button>
    </form>
  );
}
