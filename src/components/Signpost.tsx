import Bunting from "@/components/Bunting";

// "Come, visit Story Lab" — wooden signpost where each sign points to an offering.

type Dir = "plank" | "right" | "left";

const shapes: Record<Dir, string> = {
  plank: "M14 6 H386 Q396 6 396 18 V92 Q396 104 384 104 H16 Q4 104 4 92 V18 Q4 6 14 6Z",
  right: "M10 14 H310 V2 L396 58 L310 114 V102 H10 Q2 102 2 92 V24 Q2 14 10 14Z",
  left: "M390 14 H90 V2 L4 58 L90 114 V102 H390 Q398 102 398 92 V24 Q398 14 390 14Z",
};

function Sign({
  dir,
  title,
  sub,
  href,
  rotate,
  external,
  delay,
  tag,
}: {
  dir: Dir;
  title: string;
  sub: string;
  href: string;
  rotate: string;
  external?: boolean;
  delay: string;
  tag?: string;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}
      className="group relative block w-full max-w-[420px] focus:outline-none"
      style={{ ["--d" as string]: delay }}
    >
      <div
        className="origin-[50%_10%] transition-transform duration-500 ease-[cubic-bezier(.3,1.6,.5,1)] group-hover:rotate-0 group-hover:scale-105 group-focus-visible:scale-105"
        style={{ rotate }}
      >
        <svg viewBox="0 0 400 118" className="w-full drop-shadow-[0_8px_0_rgba(0,0,0,0.18)]" aria-hidden>
          <path d={shapes[dir]} transform="translate(0 6)" fill="#7d5c47" />
          <path d={shapes[dir]} fill="#a8846c" />
          {[30, 50, 68, 86].map((y, i) => (
            <path
              key={y}
              d={`M${40 + i * 18} ${y} h${180 - i * 25} M${250 - i * 10} ${y + 6} h${70 + i * 8}`}
              stroke="#8f6e58"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.5"
            />
          ))}
        </svg>
        {tag && (
          <span className="absolute -right-2 -top-4 z-10 rotate-6 animate-bob rounded-lg bg-coral px-3 py-1 font-sign text-sm text-white shadow-[0_3px_0_#b9442f] sm:text-base">
            {tag}
          </span>
        )}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center pb-2 text-center ${
            dir === "right" ? "pr-12" : dir === "left" ? "pl-12" : ""
          }`}
        >
          <span className="font-sign text-2xl leading-none text-[#3a2216] sm:text-3xl">{title}</span>
          <span className="mt-1 text-xs font-extrabold uppercase tracking-wider text-[#3a2216]/70 sm:text-sm">
            {sub}
          </span>
        </div>
      </div>
    </a>
  );
}

function Bushes() {
  return (
    <svg
      viewBox="0 0 1440 400"
      preserveAspectRatio="none"
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] w-full"
    >
      <path
        className="animate-bob"
        d="M0 160 Q80 60 200 120 Q300 20 420 110 Q520 50 600 130 Q720 40 860 120 Q960 60 1060 110 Q1180 10 1300 100 Q1380 60 1440 90 V400 H0Z"
        fill="#2b5c48"
      />
      <path
        d="M0 260 Q120 180 240 240 Q360 170 480 250 Q620 190 760 250 Q900 180 1040 240 Q1180 190 1300 250 Q1390 220 1440 240 V400 H0Z"
        fill="#24503f"
      />
      <path d="M0 330 Q360 290 720 330 T1440 320 V400 H0Z" fill="#1e4536" />
    </svg>
  );
}

export default function Signpost({
  hiringUrl,
  partyHref,
  onlineHref,
  tagline,
  partyTag,
  onlineTag,
  onlinePrice,
  partyPrice,
}: {
  hiringUrl: string;
  partyHref: string;
  onlineHref: string;
  tagline: string;
  partyTag: string;
  onlineTag: string;
  onlinePrice: string;
  partyPrice: string;
}) {
  return (
    <section className="relative flex min-h-[calc(100svh-6.5rem)] flex-col overflow-hidden bg-[#3f9469] pt-16 pb-36 sm:pt-20">
      <Bushes />
      {/* fireflies */}
      {[
        "left-[10%] top-[60%]",
        "left-[22%] top-[78%]",
        "right-[12%] top-[66%]",
        "right-[25%] top-[85%]",
        "left-[45%] top-[90%]",
      ].map((pos, i) => (
        <span
          key={pos}
          aria-hidden
          className={`absolute h-2 w-2 animate-float rounded-full bg-saffron shadow-[0_0_12px_4px_rgba(242,165,49,0.7)] ${pos}`}
          style={{ animationDelay: `${-i * 1.3}s`, animationDuration: `${5 + i}s` }}
        />
      ))}

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Bunting className="mx-auto -mt-6 mb-6" />
        <h1 className="text-center font-sign text-5xl text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.12)] sm:text-7xl">
          Come, visit Story Lab
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-center text-lg font-semibold text-white/80" style={{ ["--d" as string]: "120ms" }}>
          {tagline}. Storytelling for kids aged 3–10 — pick a path, every one ends in a story.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ ["--d" as string]: "200ms" }}>
          <a
            href={partyHref}
            target="_blank"
            rel="noopener"
            className="w-full max-w-xs rounded-full bg-coral px-7 py-4 text-center text-lg font-extrabold text-white shadow-[0_6px_0_#b9442f] transition hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_#b9442f] sm:w-auto"
          >
            🎂 Get a party quote
          </a>
          <a
            href={onlineHref}
            target="_blank"
            rel="noopener"
            className="w-full max-w-xs rounded-full bg-saffron px-7 py-4 text-center text-lg font-extrabold text-ink shadow-[0_6px_0_#b77612] transition hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_#b77612] sm:w-auto"
          >
            💻 Book online · {onlinePrice}
          </a>
        </div>

        <div className="relative mx-auto mt-14 flex max-w-[440px] flex-col items-center gap-10">
          {/* the post */}
          <div aria-hidden className="absolute -bottom-40 top-[-28px] left-1/2 w-6 -translate-x-1/2 rounded-t-full bg-[#1c1028]" />
          <Sign dir="plank" title="Birthday Story Parties" sub={partyPrice === "Free quote" ? "Free quote · at your party venue" : `${partyPrice} · at your party venue`} href="/parties" rotate="1deg" delay="150ms" tag={partyTag} />
          <Sign dir="right" title="Story Lab Online" sub={`5 live sessions · ${onlinePrice}`} href="/online" rotate="6deg" delay="300ms" tag={onlineTag} />
          <Sign dir="left" title="Storyteller? Join us" sub="We're hiring storytellers" href={hiringUrl} external rotate="-7deg" delay="450ms" tag="Hiring!" />
        </div>
      </div>

      <a
        href="#programs"
        className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 animate-bob flex-col items-center gap-1 text-sm font-extrabold text-white/80 hover:text-white"
      >
        Explore Story Lab
        <span aria-hidden className="text-2xl">↓</span>
      </a>
    </section>
  );
}
