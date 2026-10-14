import type { Metadata } from "next";
import PartiesSection from "@/components/sections/PartiesSection";

export const metadata: Metadata = {
  title: "Birthday Story Parties",
  description: "A live storyteller at your child's birthday — an original story starring the birthday child, props, puppets and act-it-out fun for ages 3–10.",
};

export default function PartiesPage() {
  return <PartiesSection n="01" />;
}
