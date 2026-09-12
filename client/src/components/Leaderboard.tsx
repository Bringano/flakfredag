import type { Beer } from "../types";

interface LeaderboardProps {
  beers: Beer[];
  loading: boolean;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ beers, loading }: LeaderboardProps) {
  const ranked = [...beers]
    .filter((b) => b.ratingCount > 0)
    .sort((a, b) => b.avgScore - a.avgScore);

  const unrated = beers.filter((b) => b.ratingCount === 0);
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
        <div
          key={beer.id}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-sm"
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
        </div>
      ))}

      {unrated.length > 0 && (
        <div className="pt-4">
          <p className="text-xs uppercase tracking-wide text-amber-50/40 mb-2">
            Tillagda men inte betygsatta än
          </p>
          <div className="flex flex-wrap gap-2">
            {unrated.map((b) => (
              <span
                key={b.id}
                className="text-sm px-3 py-1 rounded-full bg-white/5 border border-white/10 text-amber-50/60"
              >
                {b.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
