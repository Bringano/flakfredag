import { useState } from "react";
import type { Beer, Tasting } from "../types";
import BeerDetailModal from "./BeerDetailModal";

interface LeaderboardProps {
  beers: Beer[];
  tastings: Tasting[];
  loading: boolean;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ beers, tastings, loading }: LeaderboardProps) {
  const [selectedBeer, setSelectedBeer] = useState<Beer | null>(null);

  const ranked = [...beers].sort((a, b) => b.avgScore - a.avgScore);
  const maxScore = ranked[0]?.avgScore ?? 10;

  if (loading) {
    return <p className="text-center text-amber-50/60 animate-fade-in-up">Laddar topplista…</p>;
  }

  if (beers.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in-up">
        <p className="text-5xl mb-4">🍻</p>
        <p className="text-amber-50/70">Inga öl registrerade än. Lägg till er första provning!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in-up">
      {ranked.map((beer, i) => (
        <button
          key={beer.id}
          type="button"
          onClick={() => setSelectedBeer(beer)}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-sm w-full text-left transition-colors hover:bg-white/[0.07] hover:border-white/20"
        >
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500/25 to-transparent"
            style={{ width: `${Math.max(6, (beer.avgScore / maxScore) * 100)}%` }}
          />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl w-9 text-center shrink-0">
                {MEDALS[i] ?? `#${i + 1}`}
              </span>
              <div className="min-w-0">
                <p className="font-display text-lg sm:text-xl truncate">{beer.name}</p>
                {beer.brewery && (
                  <p className="text-sm text-amber-50/50 truncate">{beer.brewery}</p>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-display text-2xl sm:text-3xl text-amber-400">
                {beer.avgScore.toFixed(1)}
              </p>
              <p className="text-xs text-amber-50/50">
                {beer.ratingCount} {beer.ratingCount === 1 ? "röst" : "röster"}
              </p>
            </div>
          </div>
        </button>
      ))}

      {selectedBeer && (
        <BeerDetailModal beer={selectedBeer} tastings={tastings} onClose={() => setSelectedBeer(null)} />
      )}
    </div>
  );
}
