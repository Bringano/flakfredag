export default function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-24 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl animate-glow-pulse" />
        <div
          className="absolute -bottom-40 -right-24 h-[26rem] w-[26rem] rounded-full bg-amber-600/15 blur-3xl animate-glow-pulse"
          style={{ animationDelay: "1.2s" }}
        />
        <div className="absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <div className="relative text-center animate-fade-in-up">
        <p className="text-6xl sm:text-7xl mb-6 drop-shadow-[0_0_25px_rgba(217,119,6,0.35)]">🍻</p>

        <h1 className="font-display text-5xl sm:text-7xl font-semibold tracking-tight bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 bg-clip-text text-transparent">
          Beer O&apos;Clock
        </h1>

        <p className="mt-4 text-amber-50/40 text-sm sm:text-base tracking-[0.2em] uppercase">
          Adam · Emil · Victor
        </p>

        <button
          onClick={onStart}
          className="group mt-12 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-base sm:text-lg font-semibold text-amber-950 shadow-[0_0_40px_-10px_rgba(217,119,6,0.8)] transition duration-300 hover:shadow-[0_0_55px_-6px_rgba(217,119,6,0.9)] hover:scale-105 active:scale-95"
        >
          Let&apos;s start Flak
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </button>
      </div>
    </div>
  );
}
