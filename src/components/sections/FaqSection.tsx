import SectionLabel from "@/components/SectionLabel";
import { site } from "@/lib/site";

const faqs = [
  [
    "How many kids can join a party?",
    `A standard party covers ${site.party.kids}. For bigger groups we bring a second storyteller — your quote will include it.`,
  ],
  [
    "Which languages do you tell stories in?",
    "Hindi and English — or a natural mix of both, the way most families speak at home. Tell us your preference when you book.",
  ],
  [
    "Do you travel to our venue?",
    `Yes — homes, clubhouses, cafés and party venues across ${site.city}. Travel outside city limits is quoted separately.`,
  ],
  [
    "How do online sessions work?",
    `Small live groups on video, ${site.online.perSession} each. You pick a weekly slot after buying; your child keeps the same group and storyteller for all ${site.online.sessions} sessions.`,
  ],
];

const d = (ms: number) => ({ ["--d" as string]: `${ms}ms` }) as React.CSSProperties;

export default function FaqSection({ n, extra = [] }: { n: string; extra?: [string, string][] }) {
  const items = [...faqs, ...extra];
  return (
    <section id="faq" className="scroll-mt-24">
      <div className="mx-auto max-w-3xl px-4 py-32 sm:px-6 sm:py-40">
        <SectionLabel n={n} center>Good to know</SectionLabel>
        <h2 className="reveal mt-5 text-center font-display text-4xl font-semibold sm:text-5xl">Questions parents ask</h2>
        <div className="mt-16 space-y-4">
          {items.map(([q, a], i) => (
            <details
              key={q}
              className="reveal group rounded-2xl bg-white px-6 py-5 shadow-sm transition open:shadow-md"
              style={d(i * 80)}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-xl font-semibold">
                {q}
                <span className="text-2xl text-coral transition duration-300 group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 leading-relaxed text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
