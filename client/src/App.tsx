import { useCallback, useEffect, useState } from "react";
import Nav from "./components/Nav";
import type { Tab } from "./components/Nav";
import Leaderboard from "./components/Leaderboard";
import History from "./components/History";
import PersonStats from "./components/PersonStats";
import NewTastingForm from "./components/NewTastingForm";
import { api } from "./api";
import type { Beer, Tasting, PersonStat } from "./types";

interface AppProps {
  onBack: () => void;
}

export default function App({ onBack }: AppProps) {
  const [tab, setTab] = useState<Tab>("leaderboard");
  const [beers, setBeers] = useState<Beer[]>([]);
  const [tastings, setTastings] = useState<Tasting[]>([]);
  const [personStats, setPersonStats] = useState<PersonStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      const [beersData, tastingsData, statsData] = await Promise.all([
        api.getBeers(),
        api.getTastings(),
        api.getPersonStats()
      ]);
      setBeers(beersData);
      setTastings(tastingsData);
      setPersonStats(statsData);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Kunde inte hämta data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const topBeer = [...beers].filter((b) => b.ratingCount > 0).sort((a, b) => b.avgScore - a.avgScore)[0];

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <button
          onClick={onBack}
          className="group sticky top-[max(0.5rem,env(safe-area-inset-top))] z-10 inline-flex items-center gap-1.5 text-sm text-amber-50/60 hover:text-amber-50 transition-colors"
        >
          <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">
            ←
          </span>
          Tillbaka till startsidan
        </button>

        <header className="text-center space-y-2">
          <p className="text-4xl">🍺</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">Ölprovning</h1>
          <p className="text-amber-50/50 text-sm sm:text-base">Adam · Emil · Victor</p>
          {topBeer && (
            <p className="text-sm text-amber-400/90 pt-1">
              👑 {topBeer.name} leder med {topBeer.avgScore.toFixed(1)} i snitt
            </p>
          )}
        </header>

        <Nav active={tab} onChange={setTab} />

        {loadError && (
          <p className="text-center text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 max-w-md mx-auto">
            {loadError}
          </p>
        )}

        <main>
          {tab === "leaderboard" && <Leaderboard beers={beers} tastings={tastings} loading={loading} />}
          {tab === "history" && <History tastings={tastings} loading={loading} onChanged={loadAll} />}
          {tab === "stats" && <PersonStats stats={personStats} loading={loading} />}
          {tab === "new" && <NewTastingForm beers={beers} onCreated={loadAll} />}
        </main>
      </div>
    </div>
  );
}
