import type { Metadata } from "next";
import { Bullets, Button, Facts, Page, Section, Steps } from "@/components/ui";
import { partyIncludes, partySteps } from "@/lib/content";
import { inr, partyPriceLabel, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Birthday Story Parties",
  description: "A live storyteller at your child's birthday — an original story starring the birthday child, props, puppets and act-it-out fun for ages 3–10.",
};

export default function PartiesPage() {
  return (
    <Page
      title="Birthday Story Parties"
      lead="A live story show where every child joins in — they shout answers, become characters and help the hero win. Parents get to sit back and enjoy it."
    >
      <div className="mt-10">
        <Facts items={[["Show", site.party.duration], ["Group", site.party.kids], ["Ages", site.party.ages]]} />
      </div>

      <Section title="How it works">
        <Steps items={partySteps} />
      </Section>

      <Section title="What's included">
        <Bullets items={partyIncludes} />
      </Section>

      <Section id="book" title={site.party.showPrice ? inr(site.party.price) : partyPriceLabel}>
        <p className="text-ink-soft">
          {site.party.showPrice
            ? "₹2,000 advance confirms the date."
            : "Tell us your date, venue and number of kids — we'll send a free quote on WhatsApp within a few hours."}
        </p>
        <p className="mt-2 text-sm text-ink-soft">{site.party.status}.</p>
        <div className="mt-6">
          <Button href={site.forms.party}>{site.party.showPrice ? "Book a party" : "Get a free quote"}</Button>
        </div>
      </Section>
    </Page>
  );
}
