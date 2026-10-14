import type { Metadata } from "next";
import { Page } from "@/components/ui";
import { faqs } from "@/lib/content";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Questions parents ask about Story Lab parties and online sessions.",
};

export default function FaqPage() {
  return (
    <Page title="Questions parents ask">
      <div className="mt-10 divide-y divide-line border-y border-line">
        {faqs.map(([q, a]) => (
          <details key={q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
              {q}
              <span aria-hidden className="text-xl text-ink-soft transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 leading-relaxed text-ink-soft">{a}</p>
          </details>
        ))}
      </div>
    </Page>
  );
}
