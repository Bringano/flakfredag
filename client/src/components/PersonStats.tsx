import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { PersonStat } from "../types";

interface PersonStatsProps {
  stats: PersonStat[];
  loading: boolean;
}

const COLORS = ["#f59e0b", "#fbbf24", "#fde68a"];

export default function PersonStats({ stats, loading }: PersonStatsProps) {
  if (loading) {
    return <p className="text-center text-amber-50/60 animate-fade-in-up">Laddar statistik…</p>;
  }

  if (stats.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in-up">
        <p className="text-5xl mb-4">📊</p>
        <p className="text-amber-50/70">Ingen statistik än — registrera er första provning!</p>
      </div>
    );
  }

  const sorted = [...stats].sort((a, b) => b.avgScore - a.avgScore);
  const leader = sorted[0];
  const chartData = sorted.map((s) => ({ name: s.person, snitt: Number(s.avgScore.toFixed(2)) }));

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center rounded-2xl border border-amber-500/30 bg-amber-500/10 py-5 px-4">
        <p className="text-sm text-amber-50/60 mb-1">Snällast betygsättare (högst snitt)</p>
        <p className="font-display text-3xl text-amber-400">
          {leader.person} — {leader.avgScore.toFixed(2)}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <XAxis dataKey="name" stroke="#f5ede0aa" tickLine={false} axisLine={false} />
            <YAxis domain={[0, 10]} stroke="#f5ede0aa" tickLine={false} axisLine={false} width={28} />
            <Tooltip
              contentStyle={{
                background: "#1c1410",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "#f5ede0"
              }}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <Bar dataKey="snitt" radius={[8, 8, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sorted.map((s) => (
          <div key={s.person} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
            <p className="font-display text-xl mb-1">{s.person}</p>
            <p className="text-2xl font-semibold text-amber-400">{s.avgScore.toFixed(2)}</p>
            <p className="text-xs text-amber-50/50 mt-1">
              {s.count} {s.count === 1 ? "betyg givet" : "betyg givna"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
