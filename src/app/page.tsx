import { PartyBadge, SeatsMeter, onlineLine, partyLine } from "@/components/Availability";
import Founders from "@/components/Founders";
import Impact from "@/components/Impact";
import MobileCTA from "@/components/MobileCTA";
import Nav from "@/components/Nav";
import SectionLabel from "@/components/SectionLabel";
import ShareButton from "@/components/ShareButton";
import ScrollReveal from "@/components/ScrollReveal";
import Proof from "@/components/Proof";
import Signpost from "@/components/Signpost";
import { inr, partyPriceLabel, site } from "@/lib/site";

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

const onlineSessions = [
  ["The Spark", "Where do stories come from? Kids collect ideas from their own world."],
  ["Heroes & Helpers", "Inventing a character with a want, a fear and a funny habit."],
  ["Trouble Ahead", "Every good story needs a problem. Building the twist."],
  ["Say It Out Loud", "Voices, pauses and expressions — telling, not just reading."],
  ["Story Day", "Your child tells their finished story to the group. Recording shared with you."],
];

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

function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 2l2.6 6.6L21.5 9l-5.3 4.5L18 20.5 12 16.8 6 20.5l1.8-7L2.5 9l6.9-.4z" />
    </svg>
  );
}

const bookingForms = [
  {
    emoji: "🎂",
    title: site.party.showPrice ? "Book a birthday party" : "Get a party quote",
    body: site.party.showPrice
      ? `Pick your date and tell us about the birthday child. ${inr(site.party.price)} per party.`
      : "Tell us your date, venue and number of kids — we'll send you a free quote on WhatsApp within a few hours.",
    note: partyLine,
    href: site.forms.party,
    card: "bg-coral text-white shadow-[0_8px_0_#b9442f]",
  },
  {
    emoji: "💻",
    title: "Book Story Lab Online",
    body: `Reserve a spot in the next batch — ${site.online.sessions} live sessions for ${inr(site.online.price)}.`,
    note: onlineLine,
    href: site.forms.online,
    card: "bg-saffron text-ink shadow-[0_8px_0_#b77612]",
  },
  {
    emoji: "💌",
    title: "Share your feedback",
    body: "Been to a session? Tell us what your child loved and what we can do better.",
    note: "",
    href: site.forms.feedback,
    card: "bg-leaf text-white shadow-[0_8px_0_#2b6a4e]",
  },
];

const d = (ms: number) => ({ ["--d" as string]: `${ms}ms` }) as React.CSSProperties;

export default function Home() {
  return (
    <main className="overflow-x-clip">
      <ScrollReveal />

      <Nav />

      {/* Landing: signpost */}
      <Signpost
        hiringUrl={site.forms.hiring}
        partyHref={site.forms.party}
        onlineHref={site.forms.online}
        tagline={site.tagline}
        partyTag={site.party.slotsLeftThisMonth > 0 ? "Almost full!" : "Fully booked"}
        onlineTag={site.online.seatsLeft > 0 ? `${site.online.seatsLeft} seats left` : "Waitlist"}
        onlinePrice={inr(site.online.price)} partyPrice={partyPriceLabel} />

      {/* Second section: impact */}
      <Impact />

      <Founders />

      {/* Age bands */}
      <section id="ages" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-32 sm:px-6 sm:py-40">
        <SectionLabel n="03" center>Every age, every stage</SectionLabel>
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

      {/* Parties */}
      <section id="parties" className="scroll-mt-24">
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 py-32 sm:px-6 sm:py-40 lg:grid-cols-[1.1fr_1fr] lg:gap-24">
          <div>
            <SectionLabel n="04">Birthday Story Parties</SectionLabel>
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

      {/* Return-gift band */}
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

      {/* Online */}
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
              <SectionLabel n="05" dark>Story Lab Online</SectionLabel>
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

      <Proof />

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24">
        <div className="mx-auto max-w-3xl px-4 py-32 sm:px-6 sm:py-40">
          <SectionLabel n="07" center>Good to know</SectionLabel>
          <h2 className="reveal mt-5 text-center font-display text-4xl font-semibold sm:text-5xl">Questions parents ask</h2>
          <div className="mt-16 space-y-4">
            {faqs.map(([q, a], i) => (
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

      {/* Book */}
      <section id="book" className="scroll-mt-24 bg-paper-deep/60">
        <div className="mx-auto max-w-6xl px-4 pt-28 sm:px-6 sm:pt-36">
          <SectionLabel n="08" center>Book &amp; feedback</SectionLabel>
          <h2 className="reveal mt-5 text-center font-display text-4xl font-semibold leading-tight sm:text-6xl">
            Let&apos;s start a story.
          </h2>
          <p className="reveal mx-auto mt-6 max-w-xl text-center text-lg text-ink-soft" style={d(120)}>
            Pick a form — it takes two minutes, and a real person from our team reads every one.
          </p>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {bookingForms.map((f, i) => (
              <a
                key={f.title}
                href={f.href}
                target="_blank"
                rel="noopener"
                className={`reveal reveal-pop hover-wiggle group flex flex-col rounded-[2rem] p-8 transition duration-300 hover:-translate-y-2 ${f.card}`}
                style={d(i * 130)}
              >
                <span className="wiggle-target inline-block text-5xl" aria-hidden>
                  {f.emoji}
                </span>
                <h3 className="mt-6 font-display text-2xl font-semibold">{f.title}</h3>
                <p className="mt-2 flex-1 opacity-80">{f.body}</p>
                {f.note && (
                  <p className="mt-5 rounded-xl bg-white/25 px-3 py-2 text-sm font-extrabold">🔥 {f.note}</p>
                )}
                <span className="mt-8 font-extrabold">
                  Open the form <span className="inline-block transition group-hover:translate-x-1">→</span>
                </span>
              </a>
            ))}
          </div>
        </div>
        <div className="reveal flex flex-col items-center gap-3 px-4 py-24 text-center">
          <p className="font-semibold text-ink-soft">Know a parent who&apos;d love this?</p>
          <ShareButton className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-7 py-3.5 font-extrabold text-white shadow-[0_6px_0_#1a9e4b] transition hover:-translate-y-1" />
        </div>
      </section>

      <footer className="bg-night py-14 pb-28 text-paper/60 md:pb-14">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm sm:flex-row sm:px-6">
          <p className="hover-wiggle flex items-center gap-2 font-display text-lg text-paper">
            <Star className="wiggle-target h-5 w-5 text-saffron" /> Story Lab
          </p>
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <p className="flex flex-wrap justify-center gap-x-5 gap-y-1 font-bold text-paper/80">
              {site.instagram && (
                <a href={`https://www.instagram.com/${site.instagram}/`} target="_blank" rel="noopener" className="hover:text-saffron">
                  📸 @{site.instagram}
                </a>
              )}
              <a href={site.forms.hiring} target="_blank" rel="noopener" className="hover:text-saffron">
                🎙️ We&apos;re hiring storytellers
              </a>
              <a href={site.forms.survey} target="_blank" rel="noopener" className="hover:text-saffron">
                📋 Parents: 2-minute survey
              </a>
            </p>
            <p>© 2026 Story Lab · Women-founded by Neha &amp; Anamika · Made for curious kids.</p>
          </div>
        </div>
      </footer>
      <MobileCTA />
    </main>
  );
}
