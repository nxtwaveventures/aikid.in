import { PartyBadge, partyLine } from "@/components/Availability";
import SectionLabel from "@/components/SectionLabel";
import Star from "@/components/Star";
import BookingCard from "@/components/sections/BookingCard";
import { inr, site } from "@/lib/site";

const partyIncludes = [
  "A trained storyteller, live at your venue",
  "An original story starring the birthday child",
  "Props, puppets and sound effects kids get to handle",
  "Act-it-out segment where every child gets a role",
  "Story-themed craft or colouring take-home",
  "Personalised story card for the birthday child",
];

const partySteps = [
  ["Tell us about your child", "Name, age, favourite things, party theme."],
  ["We write their story", "An original tale where they're the hero, ready 3 days before."],
  ["Showtime", "We arrive 30 min early, set up, and run the show end to end."],
];

const d = (ms: number) => ({ ["--d" as string]: `${ms}ms` }) as React.CSSProperties;

export default function PartiesSection({ n }: { n: string }) {
  return (
    <>
      <section id="parties" className="scroll-mt-24">
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 py-32 sm:px-6 sm:py-40 lg:grid-cols-[1.1fr_1fr] lg:gap-24">
          <div>
            <SectionLabel n={n}>Birthday Story Parties</SectionLabel>
            <h2 className="reveal mt-4 font-display text-4xl font-semibold leading-tight sm:text-6xl" style={d(100)}>
              The part of the party kids talk about on the way home.
            </h2>
            <p className="reveal mt-8 text-lg leading-relaxed text-ink-soft" style={d(200)}>
              Forget the bouncy castle meltdown. A Story Lab show gathers every child into one story
              — they shout answers, become characters and help the hero win. Parents get to sit
              down for an hour.
            </p>
            <ol className="mt-14 space-y-10">
              {partySteps.map(([title, body], i) => (
                <li key={title} className="reveal flex gap-5" style={d(i * 150)}>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-coral font-display text-xl font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-semibold">{title}</h3>
                    <p className="mt-1 text-ink-soft">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="reveal reveal-pop relative rounded-[2.5rem] bg-white p-10 shadow-[0_30px_60px_-20px_rgba(31,37,71,0.25)]" style={d(200)}>
            <Star className="animate-spin-slow absolute -right-8 -top-8 h-20 w-20 text-saffron" />
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-2xl font-semibold">Party package</h3>
              {site.party.showPrice ? (
                <p className="font-display text-5xl font-bold text-coral">{inr(site.party.price)}</p>
              ) : (
                <p className="rounded-full bg-coral/10 px-4 py-1.5 text-sm font-extrabold text-coral">Priced per party</p>
              )}
            </div>
            <dl className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
              {[
                ["Show", site.party.duration],
                ["Group", site.party.kids],
                ["Ages", site.party.ages],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-paper-deep p-3">
                  <dt className="font-bold text-ink-soft">{k}</dt>
                  <dd className="font-extrabold">{v}</dd>
                </div>
              ))}
            </dl>
            <ul className="mt-8 space-y-4">
              {partyIncludes.map((item) => (
                <li key={item} className="flex gap-3">
                  <Star className="mt-1 h-4 w-4 shrink-0 text-saffron" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <PartyBadge className="mt-8" />
            <a
              href={site.forms.party}
              target="_blank"
              rel="noopener"
              className="mt-5 block rounded-full bg-coral px-6 py-4 text-center text-lg font-extrabold text-white shadow-[0_6px_0_#b9442f] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_#b9442f]"
            >
              {site.party.showPrice ? "Book your party" : "Get my free quote"}
            </a>
            <p className="mt-4 text-center text-sm text-ink-soft">
              {site.party.showPrice ? "₹2,000 advance confirms the date" : "Free, no-obligation quote within a few hours"}
            </p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-saffron">
        <span aria-hidden className="animate-float absolute -left-6 top-10 text-8xl opacity-30">🎁</span>
        <span aria-hidden className="animate-float absolute -right-4 bottom-8 text-8xl opacity-30" style={{ animationDelay: "-3s" }}>
          📖
        </span>
        <div className="relative mx-auto max-w-4xl px-4 py-28 text-center sm:px-6 sm:py-32">
          <p className="reveal font-extrabold uppercase tracking-widest text-ink/70">Rethink the return gift</p>
          <h2 className="reveal mt-5 font-sign text-5xl leading-[1.05] text-ink sm:text-7xl" style={d(100)}>
            No return gift is better than a better child.
          </h2>
          <p className="reveal mx-auto mt-8 max-w-2xl text-lg font-semibold leading-relaxed text-ink/80" style={d(200)}>
            Skip the plastic goodie bags. Every little guest goes home a bit more confident,
            curious and kind — carrying a story they&apos;ll retell for weeks.
          </p>
          <a
            href={site.forms.party}
            target="_blank"
            rel="noopener"
            className="reveal mt-10 inline-block rounded-full bg-ink px-8 py-4 text-lg font-extrabold text-paper shadow-[0_6px_0_#0d1028] transition hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_#0d1028]"
            style={d(300)}
          >
            {site.party.showPrice ? "🎂 Book the story party" : "🎂 Get a free party quote"}
          </a>
        </div>
      </section>

      <div id="book" className="mx-auto max-w-md scroll-mt-24 px-4 py-24 sm:px-6">
        <BookingCard
          emoji="🎂"
          title={site.party.showPrice ? "Book a birthday party" : "Get a party quote"}
          body={
            site.party.showPrice
              ? `Pick your date and tell us about the birthday child. ${inr(site.party.price)} per party.`
              : "Tell us your date, venue and number of kids — we'll send you a free quote on WhatsApp within a few hours."
          }
          note={partyLine}
          href={site.forms.party}
          card="bg-coral text-white shadow-[0_8px_0_#b9442f]"
        />
      </div>
    </>
  );
}
