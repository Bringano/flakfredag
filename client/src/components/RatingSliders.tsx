import { PERSONS } from "../types";
import type { Person } from "../types";

interface RatingSlidersProps {
  scores: Record<Person, number>;
  onChange: (person: Person, value: number) => void;
}

export default function RatingSliders({ scores, onChange }: RatingSlidersProps) {
  return (
    <div className="space-y-4">
      <label className="block text-sm text-amber-50/60">Betyg (1–10)</label>
      {PERSONS.map((person) => (
        <div key={person} className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          <div className="flex items-center justify-between sm:contents">
            <span className="font-medium sm:order-1 sm:w-16 sm:shrink-0">{person}</span>
            <input
              type="number"
              min={1}
              max={10}
              step={0.1}
              value={scores[person]}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isNaN(v)) onChange(person, Math.min(10, Math.max(1, v)));
              }}
              className="sm:order-3 w-16 shrink-0 text-center rounded-lg bg-black/30 border border-white/10 py-1.5 text-amber-400 font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={0.1}
            value={scores[person]}
            onChange={(e) => onChange(person, Number(e.target.value))}
            className="sm:order-2 w-full sm:flex-1 accent-amber-500"
          />
        </div>
      ))}
    </div>
  );
}
