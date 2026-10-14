import { onlineLine, partyLine } from "@/components/Availability";
import Founders from "@/components/Founders";
import Impact from "@/components/Impact";
import AgeBands from "@/components/sections/AgeBands";
import FaqSection from "@/components/sections/FaqSection";
import OnlineSection from "@/components/sections/OnlineSection";
import PartiesSection from "@/components/sections/PartiesSection";
import SectionLabel from "@/components/SectionLabel";
import ShareButton from "@/components/ShareButton";
import Proof from "@/components/Proof";
import Signpost from "@/components/Signpost";
import { inr, partyPriceLabel, site } from "@/lib/site";


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
    <>
      {/* Landing: signpost */}
      <Signpost
        hiringUrl={site.forms.hiring}
        partyHref={site.forms.party}
        onlineHref={site.forms.online}
        tagline={site.tagline}
        partyTag={site.party.slotsLeftThisMonth === 0 ? "Fully booked" : "Now booking"}
        onlineTag={site.online.seatsLeft > 0 ? "First batch" : "Waitlist"}
        onlinePrice={inr(site.online.price)} partyPrice={partyPriceLabel} />

      {/* Second section: impact */}
      <Impact />

      <Founders />

      <AgeBands n="03" />

      <PartiesSection n="04" />

      <OnlineSection n="05" />

      <Proof />

      <FaqSection n="07" />

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


    </>
  );
}
