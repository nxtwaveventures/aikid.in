import type { Metadata } from "next";
import Founders from "@/components/Founders";
import Proof from "@/components/Proof";
import AgeBands from "@/components/sections/AgeBands";

export const metadata: Metadata = {
  title: "About us",
  description: "Women-founded by Neha & Anamika, guided by our mentors. Stories matched to every age, and what parents say.",
};

export default function AboutPage() {
  return (
    <>
      <Founders />
      <AgeBands n="02" />
      <Proof />
    </>
  );
}
