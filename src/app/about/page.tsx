import type { Metadata } from "next";
import Image from "next/image";
import { Page, Section } from "@/components/ui";
import { ageBands } from "@/lib/content";
import { founders, mentors, site, visibleReviews } from "@/lib/site";

export const metadata: Metadata = {
  title: "About us",
  description: "Founded by Neha & Anamika, guided by our mentors. Live storytelling matched to every age.",
};

const tints = ["bg-peach", "bg-mint", "bg-lavender", "bg-butter"];

function Avatar({ name, photo, tint }: { name: string; photo?: string; tint: string }) {
  return (
    <span className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full font-display text-xl ${tint}`}>
      {photo ? <Image src={photo} alt={name} fill sizes="56px" className="object-cover" /> : name.replace("Dr. ", "")[0]}
    </span>
  );
}

export default function AboutPage() {
  return (
    <Page
      title="Hi, we're Neha & Anamika."
      lead="Two friends who started Story Lab because every child deserves a real person telling them a story — someone who sees their face light up and lets them become part of the tale."
    >
      <ul className="mt-10 space-y-4">
        {founders.map((f, i) => (
          <li key={f.name} className="flex items-center gap-4">
            <Avatar name={f.name} photo={f.photo} tint={tints[i % tints.length]} />
            <span>
              <span className="block font-bold">{f.name}</span>
              <span className="text-sm text-ink-soft">{f.role}</span>
            </span>
          </li>
        ))}
      </ul>

      <Section id="mentors" title="Guided by our mentors">
        <ul className="space-y-6">
          {mentors.map((m, i) => (
            <li key={m.name} className="flex gap-4">
              <Avatar name={m.name} photo={m.photo} tint={tints[(i + 2) % tints.length]} />
              <span>
                <span className="block font-bold">{m.name}</span>
                <span className="text-sm text-ink-soft">{m.role}</span>
                <span className="mt-2 block leading-relaxed text-ink-soft">{m.bio}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="ages" title="A story for every age">
        <ul className="space-y-4">
          {ageBands.map(([title, body]) => (
            <li key={title}>
              <span className="block font-bold">{title}</span>
              <span className="text-ink-soft">{body}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="reviews" title="What parents say">
        {visibleReviews.length > 0 && (
          <ul className="mb-6 space-y-6">
            {visibleReviews.map((r) => (
              <li key={r.quote} className="rounded-3xl bg-butter p-6">
                <p className="leading-relaxed">“{r.quote}”</p>
                <p className="mt-3 text-sm text-ink-soft">
                  {r.name} · {r.detail}
                  {r.sample && " · SAMPLE (dev only)"}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="text-ink-soft">
          Been to a session?{" "}
          <a href={site.forms.feedback} target="_blank" rel="noopener" className="font-bold text-ink underline underline-offset-4">
            Share your feedback
          </a>
          .
        </p>
      </Section>
    </Page>
  );
}
