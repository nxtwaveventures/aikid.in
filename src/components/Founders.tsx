// "Meet the founders" — women-founded, two co-founders.
import Image from "next/image";
import SectionLabel from "@/components/SectionLabel";
import { founders } from "@/lib/site";

const d = (ms: number) => ({ ["--d" as string]: `${ms}ms` }) as React.CSSProperties;

const looks = [
  { bg: "bg-coral", ring: "ring-coral/30", tilt: "-rotate-3" },
  { bg: "bg-leaf", ring: "ring-leaf/30", tilt: "rotate-3" },
];

export default function Founders() {
  return (
    <section id="founders" className="relative scroll-mt-24 overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-20 px-4 py-32 sm:px-6 sm:py-40 lg:grid-cols-2">
        {/* portraits */}
        <div className="relative mx-auto flex items-end justify-center gap-6 sm:gap-10">
          {founders.map((f, i) => {
            const look = looks[i % looks.length];
            return (
              <figure
                key={f.name}
                className={`reveal reveal-pop group text-center ${i === 1 ? "mb-12" : ""}`}
                style={d(i * 180)}
              >
                <div
                  className={`relative h-44 w-36 overflow-hidden rounded-[2.5rem] ring-8 transition duration-500 group-hover:rotate-0 group-hover:scale-105 sm:h-60 sm:w-48 ${look.bg} ${look.ring} ${look.tilt}`}
                >
                  {f.photo ? (
                    <Image src={f.photo} alt={f.name} fill sizes="200px" className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-sign text-8xl text-white/90" aria-hidden>
                      {f.name[0]}
                    </span>
                  )}
                </div>
                <figcaption className="mt-5">
                  <p className="font-sign text-3xl">{f.name}</p>
                  <p className="text-sm font-bold text-ink-soft">{f.role}</p>
                </figcaption>
              </figure>
            );
          })}
          <span aria-hidden className="animate-float absolute -top-10 left-1/2 -translate-x-1/2 text-5xl">
            💛
          </span>
        </div>

        {/* story */}
        <div>
          <SectionLabel n="02">Meet the founders</SectionLabel>
          <p className="reveal mt-5 inline-flex items-center gap-2 rounded-full bg-coral/10 px-4 py-2 text-sm font-extrabold text-coral">
            👩‍👩 Women-founded · run with love
          </p>
          <h2 className="reveal mt-6 font-display text-4xl font-semibold leading-tight sm:text-6xl" style={d(100)}>
            Hi, we&apos;re Neha &amp; Anamika.
          </h2>
          <div className="reveal mt-8 space-y-5 text-lg leading-relaxed text-ink-soft" style={d(200)}>
            <p>
              Two friends, two co-founders, and one shared obsession: kids, stories and the wild
              creativity that happens when the two meet.
            </p>
            <p>
              We started Story Lab because we believe every child deserves a real person telling
              them a story — someone who sees their face light up, hears their ideas, and lets
              them become part of the tale.
            </p>
            <p className="font-display text-2xl font-semibold text-ink">
              A human touch in the world of AI. That&apos;s our promise to your child.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
