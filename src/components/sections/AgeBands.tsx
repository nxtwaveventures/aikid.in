import SectionLabel from "@/components/SectionLabel";

const ageBands = [
  {
    ages: "3–5 yrs",
    name: "Story Explorers",
    body: "Call-and-response stories, animal voices and act-it-out moments.",
    tint: "from-saffron/5 to-saffron/20",
    label: "text-[#b77612]",
    wave: "text-saffron",
    path: "M0 35 Q30 10 70 30 Q110 50 150 20 Q190 0 230 28 Q270 50 300 25 V60 H0Z",
  },
  {
    ages: "6–10 yrs",
    name: "Story Makers",
    body: "Plot twists, characters and kids inventing and telling their own stories.",
    tint: "from-coral/5 to-coral/15",
    label: "text-coral",
    wave: "text-coral",
    path: "M0 40 Q20 0 45 35 Q70 5 100 38 Q130 2 160 34 Q190 0 220 36 Q250 4 275 32 Q290 15 300 30 V60 H0Z",
  },
];

const d = (ms: number) => ({ ["--d" as string]: `${ms}ms` }) as React.CSSProperties;

export default function AgeBands({ n }: { n: string }) {
  return (
    <section id="ages" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-32 sm:px-6 sm:py-40">
      <SectionLabel n={n} center>Every age, every stage</SectionLabel>
      <h2 className="reveal mt-5 text-center font-display text-4xl font-semibold sm:text-6xl">A story for every age</h2>
      <p className="reveal mx-auto mt-6 max-w-2xl text-center text-lg text-ink-soft" style={d(120)}>
        From a three-year-old&apos;s first giggle to a ten-year-old&apos;s first plot twist, every story is
        matched to the stage your child is at.
      </p>
      <div className="mx-auto mt-20 grid max-w-4xl gap-6 md:grid-cols-2">
        {ageBands.map((b, i) => (
          <div
            key={b.name}
            className={`reveal group relative flex flex-col overflow-hidden rounded-[2rem] bg-gradient-to-b pb-24 transition duration-500 hover:-translate-y-2 ${b.tint}`}
            style={d(i * 150)}
          >
            <div className="px-8 pt-10">
              <p className={`text-sm font-extrabold uppercase tracking-widest ${b.label}`}>{b.ages}</p>
              <h3 className="mt-3 font-display text-3xl font-semibold">{b.name}</h3>
              <p className="mt-3 text-ink-soft">{b.body}</p>
            </div>
            <svg
              viewBox="0 0 300 60"
              preserveAspectRatio="none"
              aria-hidden
              className={`absolute inset-x-0 -bottom-1 h-16 w-full animate-bob ${b.wave}`}
              style={{ animationDelay: `${-i}s` }}
              fill="currentColor"
            >
              <path d={b.path} />
            </svg>
          </div>
        ))}
      </div>
    </section>
  );
}
