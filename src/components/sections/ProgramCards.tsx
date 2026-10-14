import Link from "next/link";
import SectionLabel from "@/components/SectionLabel";
import { onlineLine, partyLine } from "@/components/Availability";
import { inr, partyPriceLabel, site } from "@/lib/site";

const d = (ms: number) => ({ ["--d" as string]: `${ms}ms` }) as React.CSSProperties;

const programs = [
  {
    href: "/parties",
    emoji: "🎂",
    title: "Birthday Story Parties",
    body: `A live story show starring the birthday child · ${site.party.ages}`,
    meta: partyPriceLabel,
    note: partyLine,
    card: "bg-coral text-white shadow-[0_8px_0_#b9442f]",
  },
  {
    href: "/online",
    emoji: "💻",
    title: "Story Lab Online",
    body: `${site.online.sessions} live sessions — kids learn to tell their own story · ${site.online.ages}`,
    meta: inr(site.online.price),
    note: onlineLine,
    card: "bg-saffron text-ink shadow-[0_8px_0_#b77612]",
  },
];

export default function ProgramCards() {
  return (
    <section id="programs" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-32 sm:px-6 sm:py-40">
      <SectionLabel n="02" center>Our programs</SectionLabel>
      <h2 className="reveal mt-5 text-center font-display text-4xl font-semibold sm:text-6xl">Pick a story path</h2>
      <div className="mt-16 grid gap-6 md:grid-cols-2">
        {programs.map((p, i) => (
          <Link
            key={p.href}
            href={p.href}
            className={`reveal reveal-pop hover-wiggle group flex flex-col rounded-[2rem] p-8 transition duration-300 hover:-translate-y-2 ${p.card}`}
            style={d(i * 130)}
          >
            <span className="wiggle-target inline-block text-5xl" aria-hidden>{p.emoji}</span>
            <h3 className="mt-6 font-display text-3xl font-semibold">{p.title}</h3>
            <p className="mt-2 flex-1 opacity-80">{p.body}</p>
            <p className="mt-5 rounded-xl bg-white/25 px-3 py-2 text-sm font-extrabold">🔥 {p.note}</p>
            <span className="mt-8 flex items-center justify-between font-extrabold">
              <span>{p.meta}</span>
              <span>See details <span className="inline-block transition group-hover:translate-x-1">→</span></span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
