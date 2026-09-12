// Rent visuellt "ambient" lager bakom hela appen (alla sidor/flikar) — egna
// linjeikoner i öltema (mugg, flaska, humlekotte, vetestrå) plus stigande
// bubblor. Medvetet INTE riktiga bryggerilogotyper: de är varumärkesskyddade
// och appen kan nås publikt (Render), så vi ritar eget istället.
//
// Rendera EN gång högt upp i trädet (se Root.tsx) — inte inne i något som
// har en animate-fade-in-up-förälder, då "fixed" annars slutar positioneras
// mot viewporten (se BeerDetailModal/EditTastingModal för samma fälla).
// z-index är negativt så den alltid hamnar bakom sidans vanliga innehåll,
// oavsett var i DOM-trädet den monteras.

function HopCone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path
        d="M32 12c2 2 3 4 3 4a16 16 0 0 1 9 15c0 10-5.4 19-12 23-6.6-4-12-13-12-23a16 16 0 0 1 9-15s1-2 3-4Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M23 27c4 2 14 2 18 0M22 34c5 2.5 15 2.5 20 0M23 41c4 2 14 2 18 0" stroke="currentColor" strokeWidth="1.5" />
      <path d="M32 12c-2-4-6-6-10-5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function BeerMug({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <rect x="14" y="18" width="28" height="34" rx="3" stroke="currentColor" strokeWidth="2.5" />
      <path d="M14 27h28" stroke="currentColor" strokeWidth="2" />
      <path d="M42 24h6a7 7 0 0 1 0 14h-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18 18c0-3 2-6 2-8M26 18c0-4 3-7 3-10M34 18c0-3-2-6-2-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BeerBottle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path
        d="M28 6h8v9l5 7v33a4 4 0 0 1-4 4H27a4 4 0 0 1-4-4V22l5-7V6Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M24 32h16" stroke="currentColor" strokeWidth="2" />
      <path d="M27 6h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function WheatStalk({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path d="M32 8v48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {[14, 22, 30, 38].map((y) => (
        <g key={y}>
          <ellipse cx={32 - 7} cy={y} rx="6" ry="3" transform={`rotate(-30 ${32 - 7} ${y})`} stroke="currentColor" strokeWidth="1.5" />
          <ellipse cx={32 + 7} cy={y + 4} rx="6" ry="3" transform={`rotate(30 ${32 + 7} ${y + 4})`} stroke="currentColor" strokeWidth="1.5" />
        </g>
      ))}
    </svg>
  );
}

interface Piece {
  Icon: (props: { className?: string }) => JSX.Element;
  className: string;
  style?: React.CSSProperties;
}

const PIECES: Piece[] = [
  { Icon: HopCone, className: "hidden lg:block absolute top-[8%] left-[4%] h-24 w-24 -rotate-12 text-amber-400" },
  { Icon: BeerMug, className: "hidden sm:block absolute top-[20%] right-[6%] h-20 w-20 rotate-6 text-amber-500" },
  { Icon: WheatStalk, className: "hidden lg:block absolute top-[48%] left-[8%] h-28 w-28 rotate-6 text-amber-300" },
  { Icon: BeerBottle, className: "hidden sm:block absolute bottom-[16%] right-[10%] h-24 w-24 rotate-12 text-amber-400" },
  { Icon: HopCone, className: "hidden lg:block absolute bottom-[6%] left-[14%] h-16 w-16 rotate-45 text-amber-500" },
  { Icon: BeerMug, className: "hidden xl:block absolute top-[70%] right-[20%] h-16 w-16 -rotate-6 text-amber-300" }
];

const BUBBLES = [
  { left: "12%", size: 10, delay: "0s", duration: "9s" },
  { left: "22%", size: 6, delay: "2.4s", duration: "7s" },
  { left: "48%", size: 8, delay: "1.1s", duration: "10s" },
  { left: "63%", size: 5, delay: "3.6s", duration: "8s" },
  { left: "78%", size: 9, delay: "0.6s", duration: "11s" },
  { left: "88%", size: 6, delay: "4.5s", duration: "8.5s" }
];

export default function BackgroundDecor() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {PIECES.map(({ Icon, className }, i) => (
        <Icon key={i} className={`${className} opacity-[0.07]`} />
      ))}

      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="absolute bottom-0 rounded-full bg-amber-400/10 border border-amber-300/10 animate-bubble-rise"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            animationDelay: b.delay,
            animationDuration: b.duration
          }}
        />
      ))}
    </div>
  );
}
