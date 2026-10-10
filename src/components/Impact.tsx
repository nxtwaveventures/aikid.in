// Second section: how one story ripples out — stories → kids → parents → relatives.
import CountUp from "@/components/CountUp";
import SectionLabel from "@/components/SectionLabel";
import ShareButton from "@/components/ShareButton";
import { impact } from "@/lib/site";

const d = (ms: number) => ({ ["--d" as string]: `${ms}ms` }) as React.CSSProperties;

const tones = [
  "bg-white text-ink",
  "bg-saffron text-ink",
  "bg-coral text-white",
  "bg-leaf text-white",
  "bg-ink text-paper",
];

export default function Impact() {
  const [first, ...rest] = impact;

  return (
    <section id="about" className="relative scroll-mt-24 overflow-hidden bg-paper py-32 sm:py-40">
      {/* ripples */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="animate-ripple absolute left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-saffron/40"
            style={{ animationDelay: `${i * 1.5}s` }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionLabel n="01" center>The Story Lab effect</SectionLabel>
        <h2 className="reveal mx-auto mt-4 max-w-3xl text-center font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl" style={d(100)}>
          One story. <span className="wavy">A thousand</span> smiles.
        </h2>
        <p className="reveal mx-auto mt-8 max-w-xl text-center text-lg text-ink-soft" style={d(200)}>
          Stories don&apos;t stay in the room. Kids carry them home — to parents at dinner, to
          grandparents on the phone, to cousins at the next family function.
        </p>

        <div className="mt-20 grid grid-cols-2 gap-5 lg:grid-cols-4 lg:grid-rows-2">
          {/* hero stat */}
          <Stat item={first} tone={tones[0]} big index={0} className="col-span-2 lg:row-span-2" />
          {rest.map((item, i) => (
            <Stat key={item.label} item={item} tone={tones[i + 1]} index={i + 1} />
          ))}
        </div>

        <p className="reveal mt-14 text-center font-sign text-2xl text-ink/80 sm:text-3xl" style={d(300)}>
          …and counting. Your child could be next. ✨
        </p>
        <div className="reveal mt-8 flex justify-center" style={d(400)}>
          <ShareButton
            label="Spread the story on WhatsApp"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-7 py-3.5 font-extrabold text-white shadow-[0_6px_0_#1a9e4b] transition hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_#1a9e4b]"
          />
        </div>
      </div>
    </section>
  );
}

function Stat({
  item,
  tone,
  index,
  big = false,
  className = "",
}: {
  item: (typeof impact)[number];
  tone: string;
  index: number;
  big?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`reveal reveal-pop hover-wiggle group relative flex flex-col justify-between overflow-hidden rounded-[2rem] p-7 shadow-[0_20px_40px_-20px_rgba(31,37,71,0.35)] transition duration-300 hover:-translate-y-2 sm:p-9 ${tone} ${className}`}
      style={d(index * 120)}
    >
      <span className={`wiggle-target inline-block ${big ? "text-7xl" : "text-4xl"}`} aria-hidden>
        {item.emoji}
      </span>
      <div className={big ? "mt-16" : "mt-8"}>
        <p className={`font-display font-bold leading-none tracking-tight ${big ? "text-8xl sm:text-9xl" : "text-5xl sm:text-6xl"}`}>
          <CountUp to={item.value} suffix="+" />
        </p>
        <p className={`font-extrabold uppercase tracking-widest opacity-80 ${big ? "mt-4 text-base" : "mt-3 text-xs sm:text-sm"}`}>
          {item.label}
        </p>
      </div>
    </div>
  );
}
