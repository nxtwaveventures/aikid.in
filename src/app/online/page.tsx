import type { Metadata } from "next";
import { Button, Facts, Page, Section, Steps } from "@/components/ui";
import { onlineSessions } from "@/lib/content";
import { inr, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Story Lab Online",
  description: `${site.online.sessions} live storytelling sessions in small groups for ages 3–10 — ${inr(site.online.price)}.`,
};

const { online } = site;
const batchLine =
  online.seatsLeft === 0
    ? `The batch starting ${online.nextBatch} is full — join the waitlist.`
    : `Next batch starts ${online.nextBatch} · ${online.seatsLeft} of ${online.seatsTotal} seats open.`;

export default function OnlinePage() {
  return (
    <Page
      title="Story Lab Online"
      lead={`Live sessions in small groups of up to ${online.seatsTotal} kids. Each week builds one piece of your child's own story — by session five, they perform it.`}
    >
      <div className="mt-10">
        <Facts items={[["Sessions", `${online.sessions} live`], ["Each", online.perSession], ["Ages", online.ages]]} />
      </div>

      <Section title="The five sessions">
        <Steps items={onlineSessions} />
      </Section>

      <Section title={`${inr(online.price)} for all ${online.sessions} sessions`}>
        <p className="text-ink-soft">{batchLine}</p>
        <div className="mt-6">
          <Button href={site.forms.online}>{online.seatsLeft > 0 ? "Book a seat" : "Join the waitlist"}</Button>
        </div>
      </Section>
    </Page>
  );
}
