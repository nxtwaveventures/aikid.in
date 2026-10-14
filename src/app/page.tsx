import LegacyHashRedirect from "@/components/LegacyHashRedirect";
import { Card } from "@/components/ui";
import { impact, inr, partyPriceLabel, site } from "@/lib/site";

export default function Home() {
  const moms = impact[0];
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
      <LegacyHashRedirect />
      <h1 className="font-display text-5xl font-medium leading-tight sm:text-6xl">Story Lab</h1>
      <p className="mt-5 max-w-xl text-xl leading-relaxed text-ink-soft">
        Live storytelling for kids aged 3–10, in English &amp; Hindi. {site.tagline}.
      </p>

      <div className="mt-14 grid gap-5 sm:grid-cols-2">
        <Card
          href="/parties"
          tint="bg-peach"
          title="Birthday Story Parties"
          body="A live story show starring the birthday child — at your home or venue."
          meta={partyPriceLabel}
        />
        <Card
          href="/online"
          tint="bg-mint"
          title="Story Lab Online"
          body={`${site.online.sessions} live sessions where kids learn to tell their own story.`}
          meta={inr(site.online.price)}
        />
      </div>

      {moms && (
        <p className="mt-14 text-ink-soft">
          <span className="font-bold text-ink">{moms.value} {moms.label.toLowerCase()}</span> and counting.
        </p>
      )}
    </div>
  );
}
