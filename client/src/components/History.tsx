import { PERSONS } from "../types";
import type { Tasting } from "../types";

interface HistoryProps {
  tastings: Tasting[];
  loading: boolean;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric" });
}

export default function History({ tastings, loading }: HistoryProps) {
  if (loading) {
    return <p className="text-center text-amber-50/60 animate-fade-in-up">Laddar historik…</p>;
  }

  if (tastings.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in-up">
        <p className="text-5xl mb-4">📜</p>
        <p className="text-amber-50/70">Ingen historik än. Registrera er första provning!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 animate-fade-in-up">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="bg-white/5 text-amber-50/60 text-left uppercase text-xs tracking-wide">
            <th className="px-4 py-3 font-medium">Datum</th>
            <th className="px-4 py-3 font-medium">Öl</th>
            <th className="px-4 py-3 font-medium">Mat</th>
            {PERSONS.map((p) => (
              <th key={p} className="px-4 py-3 font-medium text-center">
                {p}
              </th>
            ))}
            <th className="px-4 py-3 font-medium text-center">Snitt</th>
          </tr>
        </thead>
        <tbody>
          {tastings.map((t, i) => (
            <tr
              key={t.id}
              className={`border-t border-white/5 ${i % 2 === 0 ? "bg-white/[0.02]" : ""} hover:bg-white/[0.06] transition-colors`}
            >
              <td className="px-4 py-3 text-amber-50/60 whitespace-nowrap">{formatDate(t.createdAt)}</td>
              <td className="px-4 py-3">
                <span className="font-medium">{t.beerName}</span>
                {t.brewery && <span className="text-amber-50/40"> · {t.brewery}</span>}
              </td>
              <td className="px-4 py-3 text-amber-50/70">{t.food ?? "—"}</td>
              {PERSONS.map((p) => {
                const rating = t.ratings.find((r) => r.person === p);
                return (
                  <td key={p} className="px-4 py-3 text-center tabular-nums">
                    {rating ? rating.score.toFixed(1) : "—"}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-center font-display text-amber-400 tabular-nums">
                {t.avgScore.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
