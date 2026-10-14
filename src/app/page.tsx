import Impact from "@/components/Impact";
import LegacyHashRedirect from "@/components/LegacyHashRedirect";
import ProgramCards from "@/components/sections/ProgramCards";
import ShareButton from "@/components/ShareButton";
import Signpost from "@/components/Signpost";
import { inr, partyPriceLabel, site } from "@/lib/site";

export default function Home() {
  return (
    <>
      <LegacyHashRedirect />
      <Signpost
        hiringUrl={site.forms.hiring}
        partyHref={site.forms.party}
        onlineHref={site.forms.online}
        tagline={site.tagline}
        partyTag={site.party.slotsLeftThisMonth === 0 ? "Fully booked" : "Now booking"}
        onlineTag={site.online.seatsLeft > 0 ? "First batch" : "Waitlist"}
        onlinePrice={inr(site.online.price)}
        partyPrice={partyPriceLabel}
      />
      <Impact />
      <ProgramCards />
      <div className="reveal flex flex-col items-center gap-3 px-4 pb-28 text-center">
        <p className="font-semibold text-ink-soft">Know a parent who&apos;d love this?</p>
        <ShareButton className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-7 py-3.5 font-extrabold text-white shadow-[0_6px_0_#1a9e4b] transition hover:-translate-y-1" />
        <a href={site.forms.feedback} target="_blank" rel="noopener" className="mt-4 font-bold text-ink-soft underline-offset-4 hover:text-coral hover:underline">
          💌 Been to a session? Share your feedback
        </a>
      </div>
    </>
  );
}
