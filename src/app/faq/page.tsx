import type { Metadata } from "next";
import FaqSection from "@/components/sections/FaqSection";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Questions parents ask about Story Lab parties and online sessions.",
};

export default function FaqPage() {
  return <FaqSection n="01" />;
}
