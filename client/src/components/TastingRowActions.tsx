interface TastingRowActionsProps {
  beerName: string;
  confirming: boolean;
  deleting: boolean;
  onEdit: () => void;
  onRequestDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  align?: "start" | "end";
}

export default function TastingRowActions({
  beerName,
  confirming,
  deleting,
  onEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
  align = "end"
}: TastingRowActionsProps) {
  if (confirming) {
    return (
      <div className={`flex items-center gap-2 ${align === "end" ? "justify-end" : "justify-between"}`}>
        <span className="text-xs text-amber-50/60">Ta bort?</span>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={onConfirmDelete}
            disabled={deleting}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            {deleting ? "…" : "Ja"}
          </button>
          <button
            onClick={onCancelDelete}
            disabled={deleting}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 text-amber-50/60 hover:bg-white/10 transition-colors"
          >
            Avbryt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${align === "end" ? "justify-end" : ""}`}>
      <button
        onClick={onEdit}
        aria-label={`Redigera provning av ${beerName}`}
        title="Redigera"
        className="p-1.5 rounded-lg text-amber-50/50 hover:text-amber-50 hover:bg-white/10 transition-colors leading-none"
      >
        ✏️
      </button>
      <button
        onClick={onRequestDelete}
        aria-label={`Ta bort provning av ${beerName}`}
        title="Ta bort"
        className="p-1.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors text-base leading-none"
      >
        ✕
      </button>
    </div>
  );
}
