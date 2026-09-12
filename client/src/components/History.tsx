import { useState } from "react";
import { PERSONS } from "../types";
import type { Tasting } from "../types";
import { api } from "../api";
import EditTastingModal from "./EditTastingModal";
import TastingRowActions from "./TastingRowActions";

interface HistoryProps {
  tastings: Tasting[];
  loading: boolean;
  onChanged: () => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric" });
}

export default function History({ tastings, loading, onChanged }: HistoryProps) {
  const [editing, setEditing] = useState<Tasting | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete(t: Tasting) {
    setError(null);
    setDeletingId(t.id);
    try {
      await api.deleteTasting(t.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte ta bort provningen.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

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
    <div className="animate-fade-in-up space-y-4">
      {error && (
        <p className="text-center text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Mobile: stacked cards (avoids cramped horizontal-scroll tables on small screens) */}
      <div className="space-y-3 sm:hidden">
        {tastings.map((t) => (
          <div key={t.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-lg truncate">{t.beerName}</p>
                {t.brewery && <p className="text-sm text-amber-50/40 truncate">{t.brewery}</p>}
              </div>
              <p className="font-display text-2xl text-amber-400 shrink-0 tabular-nums">
                {t.avgScore.toFixed(1)}
              </p>
            </div>
            <p className="mt-1 text-xs text-amber-50/50">{formatDate(t.createdAt)}</p>
            <p className="mt-2 text-sm text-amber-50/70">🍽️ {t.food ?? "—"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
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
            <div className="mt-3 border-t border-white/5 pt-2">
              <TastingRowActions
                beerName={t.beerName}
                confirming={confirmDeleteId === t.id}
                deleting={deletingId === t.id}
                onEdit={() => setEditing(t)}
                onRequestDelete={() => setConfirmDeleteId(t.id)}
                onConfirmDelete={() => confirmDelete(t)}
                onCancelDelete={() => setConfirmDeleteId(null)}
                align={confirmDeleteId === t.id ? "start" : "end"}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop/tablet: full table */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-sm min-w-[720px]">
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
              <th className="px-4 py-3 font-medium text-right">
                <span className="sr-only">Åtgärder</span>
              </th>
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
                <td className="px-4 py-3 min-w-[120px]">
                  <TastingRowActions
                    beerName={t.beerName}
                    confirming={confirmDeleteId === t.id}
                    deleting={deletingId === t.id}
                    onEdit={() => setEditing(t)}
                    onRequestDelete={() => setConfirmDeleteId(t.id)}
                    onConfirmDelete={() => confirmDelete(t)}
                    onCancelDelete={() => setConfirmDeleteId(null)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditTastingModal
          tasting={editing}
          onClose={() => setEditing(null)}
          onSaved={onChanged}
        />
      )}
    </div>
  );
}
