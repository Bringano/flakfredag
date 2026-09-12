type Tab = "leaderboard" | "history" | "stats" | "new" | "gatherings";

interface NavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "leaderboard", label: "Topplista", icon: "🏆" },
  { id: "history", label: "Historik", icon: "📜" },
  { id: "stats", label: "Personstatistik", icon: "📊" },
  { id: "new", label: "Ny provning", icon: "➕" },
  { id: "gatherings", label: "Loggbok", icon: "📖" }
];

export default function Nav({ active, onChange }: NavProps) {
  return (
    <nav className="flex flex-wrap gap-2 sm:gap-3 justify-center">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2.5 rounded-full text-sm sm:text-base font-medium transition-all duration-200 border ${
              isActive
                ? "bg-amber-500 text-[#1c1410] border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.35)]"
                : "bg-white/5 text-amber-50/80 border-white/10 hover:bg-white/10 hover:border-white/20"
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export type { Tab };
