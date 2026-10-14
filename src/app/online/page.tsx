import type { Metadata } from "next";
import OnlineSection from "@/components/sections/OnlineSection";
import { inr, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Story Lab Online",
  description: `${site.online.sessions} live storytelling sessions in small groups for ages 3–10 — ${inr(site.online.price)}.`,
};

export default function OnlinePage() {
  return <OnlineSection n="01" />;
}
