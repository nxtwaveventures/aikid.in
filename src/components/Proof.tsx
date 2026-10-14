// "Sessions we've run" + "What parents say" + feedback call-to-action.
import SectionLabel from "@/components/SectionLabel";
import ShareButton from "@/components/ShareButton";
import { site, visibleReviews, visibleSessions } from "@/lib/site";

const d = (ms: number) => ({ ["--d" as string]: `${ms}ms` }) as React.CSSProperties;

function SampleBadge() {
  return (
    <span className="absolute right-4 top-4 rounded-full bg-ink px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-paper">
      Sample · dev only
    </span>
  );
}

export default function Proof() {
  return (
    <section id="reviews" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-32 sm:px-6 sm:py-40">
        {/* Sessions organised */}
        {visibleSessions.length > 0 && (
          <>
            <p className="reveal text-center font-extrabold uppercase tracking-widest text-coral">Real rooms, real kids</p>
            <h2 className="reveal mt-4 text-center font-display text-4xl font-semibold sm:text-6xl" style={d(100)}>
              Sessions we&apos;ve run
            </h2>
            <ul className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {visibleSessions.map((s, i) => (
                <li
                  key={s.title}
                  className="reveal reveal-pop hover-wiggle relative rounded-[2rem] bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-lg"
                  style={d(i * 110)}
                >
                  {s.sample && <SampleBadge />}
                  <span className="wiggle-target inline-block text-5xl" aria-hidden>
                    {s.emoji}
                  </span>
                  <p
                    className={`mt-5 inline-block rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${
                      s.kind === "party" ? "bg-coral/15 text-coral" : "bg-saffron/25 text-ink"
                    }`}
                  >
                    {s.kind === "party" ? "Birthday party" : "Story Lab Online"}
                  </p>
                  <h3 className="mt-3 font-display text-xl font-semibold leading-snug">{s.title}</h3>
                  <p className="mt-3 text-sm font-bold text-ink-soft">
                    {s.when} · {s.where}
                  </p>
                  <p className="mt-1 text-sm font-bold text-ink-soft">{s.kids} kids</p>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Parent reviews */}
        <div className={visibleSessions.length > 0 ? "mt-36" : ""}>
          <SectionLabel n="03" center>Parent feedback</SectionLabel>
          <h2 className="reveal mt-4 text-center font-display text-4xl font-semibold sm:text-6xl" style={d(100)}>
            What parents say
          </h2>

          {visibleReviews.length > 0 ? (
            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {visibleReviews.map((r, i) => (
                <figure
                  key={i}
                  className={`reveal relative flex flex-col rounded-[2rem] p-8 transition duration-300 hover:-translate-y-2 ${
                    i % 3 === 1 ? "bg-ink text-paper md:translate-y-8 md:hover:translate-y-6" : "bg-white shadow-sm"
                  }`}
                  style={d(i * 140)}
                >
                  {r.sample && <SampleBadge />}
                  <div className="flex gap-1 text-saffron" aria-label="5 out of 5 stars">
                    {"★★★★★".split("").map((s, k) => (
                      <span key={k}>{s}</span>
                    ))}
                  </div>
                  <blockquote className="mt-5 flex-1 font-display text-xl leading-relaxed">
                    &ldquo;{r.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-6">
                    <p className="font-extrabold">{r.name}</p>
                    <p className={`text-sm ${i % 3 === 1 ? "text-paper/70" : "text-ink-soft"}`}>{r.detail}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="reveal mx-auto mt-10 max-w-xl text-center text-lg text-ink-soft">
              Our first families are sharing their stories right now. Been to a session? Yours could
              be the first one here.
            </p>
          )}

          <div className="reveal mt-24 flex flex-col items-center gap-4 text-center">
            <p className="text-lg font-semibold text-ink-soft">Attended a Story Lab session?</p>
            <a
              href={site.forms.feedback}
              target="_blank"
              rel="noopener"
              className="rounded-full bg-leaf px-8 py-4 text-lg font-extrabold text-white shadow-[0_6px_0_#2b6a4e] transition hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_#2b6a4e]"
            >
              Share your feedback →
            </a>
            <ShareButton
              label="Loved it? Tell a parent friend"
              className="mt-2 inline-flex items-center gap-2 font-extrabold text-leaf underline-offset-4 hover:underline"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
