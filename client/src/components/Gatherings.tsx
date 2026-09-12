import { useEffect, useRef, useState } from "react";
import { api, gatheringPhotoUrl } from "../api";
import { AuthRequiredError } from "../auth";
import type { Gathering } from "../types";
import { compressImage } from "../imageResize";
import AuthImage from "./AuthImage";

interface GatheringsProps {
  onAuthError: () => void;
}

interface FilePreview {
  file: File;
  url: string;
}

const MAX_PHOTOS = 12;

function todayLocalIsoDate(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatDate(isoDate: string) {
  // isoDate är "YYYY-MM-DD" — lägg på en lokal tid så den inte tolkas som UTC
  // midnatt och hoppar en dag bakåt i västligare tidszoner.
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" });
}

export default function Gatherings({ onAuthError }: GatheringsProps) {
  const [gatherings, setGatherings] = useState<Gathering[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(todayLocalIsoDate);
  const [description, setDescription] = useState("");
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Alltid uppdaterad kopia av previews, så unmount-cleanupen (som bara körs
  // en gång) kan städa vilka object-URL:er som än fanns kvar just då.
  const previewsRef = useRef(previews);
  previewsRef.current = previews;
  useEffect(() => {
    return () => {
      previewsRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

  async function load() {
    setLoadError(null);
    try {
      setGatherings(await api.getGatherings());
    } catch (err) {
      if (err instanceof AuthRequiredError) {
        onAuthError();
        return;
      }
      setLoadError(err instanceof Error ? err.message : "Kunde inte hämta loggboken.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleFilesChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(e.target.files ?? []);
    const withPreviews = chosen.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPreviews((prev) => [...prev, ...withPreviews].slice(0, MAX_PHOTOS));
    e.target.value = "";
  }

  function removeFile(index: number) {
    setPreviews((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
  }

  function resetForm() {
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setPreviews([]);
    setDate(todayLocalIsoDate());
    setDescription("");
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!date) {
      setFormError("Ange ett datum.");
      return;
    }

    setSubmitting(true);
    try {
      const compressed = await Promise.all(previews.map((p) => compressImage(p.file)));
      await api.createGathering(date, description.trim(), compressed);
      resetForm();
      setShowForm(false);
      await load();
    } catch (err) {
      if (err instanceof AuthRequiredError) {
        onAuthError();
        return;
      }
      setFormError(err instanceof Error ? err.message : "Något gick fel.");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete(id: number) {
    setDeletingId(id);
    try {
      await api.deleteGathering(id);
      await load();
    } catch (err) {
      if (err instanceof AuthRequiredError) {
        onAuthError();
        return;
      }
      setLoadError(err instanceof Error ? err.message : "Kunde inte ta bort kvällen.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  if (loading) {
    return <p className="text-center text-amber-50/60 animate-fade-in-up">Laddar loggbok…</p>;
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {loadError && (
        <p className="text-center text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {loadError}
        </p>
      )}

      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-xl border border-dashed border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors font-medium"
        >
          + Lägg till en kväll
        </button>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"
        >
          <div>
            <label className="block text-sm text-amber-50/60 mb-2">Datum</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm text-amber-50/60 mb-2">Kort beskrivning (valfritt)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Vad hände den kvällen?"
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-amber-50 placeholder:text-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-amber-50/60 mb-2">Bilder (valfritt)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChosen}
              className="w-full text-sm text-amber-50/70 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-amber-500 file:text-[#1c1410] file:font-semibold file:cursor-pointer"
            />

            {previews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {previews.map((p, i) => (
                  <div key={p.url} className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
                    <img src={p.url} alt={p.file.name} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center"
                      aria-label={`Ta bort ${p.file.name}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formError && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{formError}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-white/10 bg-white/5 text-amber-50/70 hover:bg-white/10 transition-colors"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-[#1c1410] font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {submitting ? "Sparar…" : "Spara kväll"}
            </button>
          </div>
        </form>
      )}

      {gatherings.length === 0 && !showForm && (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📖</p>
          <p className="text-amber-50/70">Ingen kväll loggad än — lägg till er första!</p>
        </div>
      )}

      <div className="space-y-4">
        {gatherings.map((g) => (
          <div key={g.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="font-display text-lg capitalize">{formatDate(g.occurredOn)}</p>

              {confirmDeleteId === g.id ? (
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => confirmDelete(g.id)}
                    disabled={deletingId === g.id}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    {deletingId === g.id ? "…" : "Ja"}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 text-amber-50/60 hover:bg-white/10 transition-colors"
                  >
                    Avbryt
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(g.id)}
                  aria-label={`Ta bort kvällen ${formatDate(g.occurredOn)}`}
                  title="Ta bort"
                  className="p-1.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors text-base leading-none shrink-0"
                >
                  ✕
                </button>
              )}
            </div>

            {g.description && <p className="mt-1.5 text-sm text-amber-50/70">{g.description}</p>}

            {g.photoIds.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {g.photoIds.map((photoId) => (
                  <AuthImage
                    key={photoId}
                    src={gatheringPhotoUrl(g.id, photoId)}
                    alt={`Bild från ${formatDate(g.occurredOn)}`}
                    className="aspect-square w-full rounded-lg object-cover border border-white/10"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
