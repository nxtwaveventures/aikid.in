// Paper bunting: pastel triangle flags hanging from a thread, gently swaying.
const colors = ["#f9c6c9", "#fcd9b8", "#fff0b3", "#cdebc5", "#c8e1f5", "#d9ccf2"];

const W = 1200;
const TOP = 14; // where the thread is pinned
const SAG = 46; // how far each swag dips
const SWAGS = 2;
const PER_SWAG = 8;
const FLAG_W = 46;
const FLAG_H = 58;

// point and slope on one swag (quadratic curve) at t ∈ [0, 1]
function onSwag(i: number, t: number) {
  const x0 = (W / SWAGS) * i;
  const x1 = x0 + W / SWAGS;
  const xc = (x0 + x1) / 2;
  const yc = TOP + SAG * 2;
  const x = (1 - t) ** 2 * x0 + 2 * t * (1 - t) * xc + t ** 2 * x1;
  const y = (1 - t) ** 2 * TOP + 2 * t * (1 - t) * yc + t ** 2 * TOP;
  const dx = 2 * (1 - t) * (xc - x0) + 2 * t * (x1 - xc);
  const dy = 2 * (1 - t) * (yc - TOP) + 2 * t * (TOP - yc);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

const flags = Array.from({ length: SWAGS }, (_, i) =>
  Array.from({ length: PER_SWAG }, (_, k) => ({ ...onSwag(i, (k + 0.5) / PER_SWAG), n: i * PER_SWAG + k })),
).flat();

const thread = Array.from({ length: SWAGS }, (_, i) => {
  const x0 = (W / SWAGS) * i;
  return `M${x0} ${TOP} Q${x0 + W / SWAGS / 2} ${TOP + SAG * 2} ${x0 + W / SWAGS} ${TOP}`;
}).join(" ");

export default function Bunting() {
  return (
    <svg viewBox={`0 0 ${W} ${TOP + SAG + FLAG_H + 12}`} className="block w-full" aria-hidden>
      <path d={thread} fill="none" stroke="#c9bfb2" strokeWidth="1.5" />
      {flags.map((f) => (
        <g key={f.n} transform={`translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${f.angle.toFixed(1)})`}>
          <g className="bunting-flag" style={{ animationDelay: `${(f.n % 5) * -0.7}s` }}>
            <polygon points={`${-FLAG_W / 2},0 ${FLAG_W / 2},0 0,${FLAG_H}`} fill={colors[f.n % colors.length]} />
            {/* paper fold: right half a touch darker, crease down the middle */}
            <polygon points={`0,0 ${FLAG_W / 2},0 0,${FLAG_H}`} fill="#2e3142" opacity="0.05" />
            <line x1="0" y1="0" x2="0" y2={FLAG_H} stroke="#fff" strokeOpacity="0.5" strokeWidth="1" />
            <rect x={-FLAG_W / 2} y="-2" width={FLAG_W} height="4" rx="2" fill="#fffdf9" opacity="0.6" />
          </g>
        </g>
      ))}
    </svg>
  );
}
