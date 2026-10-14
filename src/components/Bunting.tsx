// A small paper bunting: coloured card triangles hanging from jute twine, gently swaying.
const colors = ["#f2c84b", "#5fb87a", "#3f9bd1", "#d2559f", "#f08a4b", "#8f7ad8"];

const W = 420;
const TOP = 10; // where the twine is pinned at each end
const SAG = 34; // how far the middle dips
const FLAGS = 6;
const FLAG_W = 52;
const FLAG_H = 50;

// point and slope on the twine (quadratic curve) at t ∈ [0, 1]
function onTwine(t: number) {
  const xc = W / 2;
  const yc = TOP + SAG * 2;
  const x = 2 * t * (1 - t) * xc + t ** 2 * W;
  const y = (1 - t) ** 2 * TOP + 2 * t * (1 - t) * yc + t ** 2 * TOP;
  const dx = 2 * (1 - t) * xc + 2 * t * (W - xc);
  const dy = 2 * (1 - t) * (yc - TOP) + 2 * t * (TOP - yc);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

const flags = Array.from({ length: FLAGS }, (_, n) => ({ ...onTwine((n + 0.5) / FLAGS), n }));
const twine = `M0 ${TOP} Q${W / 2} ${TOP + SAG * 2} ${W} ${TOP}`;

export default function Bunting({ className = "" }: { className?: string }) {
  return (
    <svg viewBox={`-6 0 ${W + 12} ${TOP + SAG + FLAG_H + 10}`} className={`block w-full max-w-[420px] ${className}`} aria-hidden>
      <defs>
        <filter id="paper-shadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#2e3142" floodOpacity="0.18" />
        </filter>
      </defs>
      {/* jute twine: a solid cord with a darker twist pattern on top */}
      <path d={twine} fill="none" stroke="#c4a173" strokeWidth="3" strokeLinecap="round" />
      <path d={twine} fill="none" stroke="#8d6b44" strokeWidth="3" strokeDasharray="1.5 3" strokeLinecap="round" />
      {flags.map((f) => (
        <g key={f.n} transform={`translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${f.angle.toFixed(1)})`}>
          <g className="bunting-flag" style={{ animationDelay: `${f.n * -0.6}s` }} filter="url(#paper-shadow)">
            <polygon points={`${-FLAG_W / 2},0 ${FLAG_W / 2},0 0,${FLAG_H}`} fill={colors[f.n % colors.length]} />
            {/* card-paper sheen: a faint light edge on the left */}
            <polygon points={`${-FLAG_W / 2},0 ${-FLAG_W / 2 + 10},0 0,${FLAG_H}`} fill="#fff" opacity="0.14" />
          </g>
        </g>
      ))}
      {/* twine passes in front of the flag tops, like it's threaded through */}
      <path d={twine} fill="none" stroke="#c4a173" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}
