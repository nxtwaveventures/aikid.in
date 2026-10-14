import { SeatsMeter, onlineLine } from "@/components/Availability";
import SectionLabel from "@/components/SectionLabel";
import Star from "@/components/Star";
import BookingCard from "@/components/sections/BookingCard";
import { inr, site } from "@/lib/site";

const onlineSessions = [
  ["The Spark", "Where do stories come from? Kids collect ideas from their own world."],
  ["Heroes & Helpers", "Inventing a character with a want, a fear and a funny habit."],
  ["Trouble Ahead", "Every good story needs a problem. Building the twist."],
  ["Say It Out Loud", "Voices, pauses and expressions — telling, not just reading."],
  ["Story Day", "Your child tells their finished story to the group. Recording shared with you."],
];

const d = (ms: number) => ({ ["--d" as string]: `${ms}ms` }) as React.CSSProperties;

export default function OnlineSection({ n }: { n: string }) {
  return (
    <>
      <section id="online" className="relative scroll-mt-24 overflow-hidden bg-night text-paper">
        {/* twinkling stars */}
        {["left-[8%] top-[12%]", "left-[30%] top-[6%]", "right-[10%] top-[18%]", "right-[35%] top-[9%]", "left-[55%] top-[22%]"].map((pos, i) => (
          <span key={pos} className={`animate-float absolute ${pos}`} style={{ animationDelay: `${-i * 1.4}s` }} aria-hidden>
            <Star className="h-3 w-3 text-saffron/60" />
          </span>
        ))}
        <div className="relative mx-auto max-w-6xl px-4 py-32 sm:px-6 sm:py-40">
          <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-24">
            <div>
              <SectionLabel n={n} dark>Story Lab Online</SectionLabel>
              <h2 className="reveal mt-4 font-display text-4xl font-semibold leading-tight sm:text-6xl" style={d(100)}>
                From listening to stories, to telling them.
              </h2>
              <p className="reveal mt-8 text-lg leading-relaxed text-paper/75" style={d(200)}>
                Live sessions in small groups of up to 6 kids. Each week builds one piece of your
                child&apos;s own story — by session five, they perform it. Confidence, imagination
                and speaking skills, without it feeling like a class.
              </p>
            </div>
            <div className="reveal reveal-pop rounded-[2.5rem] bg-paper p-10 text-ink" style={d(250)}>
              <p className="text-sm font-extrabold uppercase tracking-widest text-ink-soft">Starter pack</p>
              <p className="mt-2 font-display text-6xl font-bold">{inr(site.online.price)}</p>
              <p className="mt-2 font-bold text-ink-soft">
                {site.online.sessions} live sessions · {site.online.perSession} each · ages {site.online.ages}
              </p>
              <p className="mt-3 text-sm font-extrabold text-leaf">
                That&apos;s about {inr(Math.round(site.online.price / site.online.sessions))} a session
              </p>
              <div className="mt-6">
                <SeatsMeter />
              </div>
              <a
                href={site.forms.online}
                target="_blank"
                rel="noopener"
                className="mt-8 block rounded-full bg-saffron px-6 py-4 text-center text-lg font-extrabold text-ink shadow-[0_6px_0_#b77612] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_#b77612]"
              >
                {site.online.seatsLeft > 0 ? "Grab a seat" : "Join the waitlist"}
              </a>
            </div>
          </div>

          {/* session path */}
          <ol className="relative mt-28 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <div aria-hidden className="absolute left-0 right-0 top-6 hidden border-t-2 border-dashed border-paper/20 lg:block" />
            {onlineSessions.map(([title, body], i) => (
              <li key={title} className="reveal relative" style={d(i * 140)}>
                <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-saffron font-display text-xl font-bold text-ink transition hover:scale-110">
                  {i + 1}
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/70">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="mx-auto max-w-md px-4 py-24 sm:px-6">
        <BookingCard
          emoji="💻"
          title="Book Story Lab Online"
          body={`Reserve a spot in the next batch — ${site.online.sessions} live sessions for ${inr(site.online.price)}.`}
          note={onlineLine}
          href={site.forms.online}
          card="bg-saffron text-ink shadow-[0_8px_0_#b77612]"
        />
      </div>
    </>
  );
}
