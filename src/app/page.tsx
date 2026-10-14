import LegacyHashRedirect from "@/components/LegacyHashRedirect";
import Signpost from "@/components/Signpost";
import { Card } from "@/components/ui";
import { impact, inr, partyPriceLabel, site } from "@/lib/site";

export default function Home() {
  const moms = impact[0];
  return (
    <>
      <LegacyHashRedirect />
      <Signpost
        partyHref={site.forms.party}
        onlineHref={site.forms.online}
        partyTag={site.party.slotsLeftThisMonth === 0 ? "Fully booked" : "Now booking"}
        onlineTag={site.online.seatsLeft > 0 ? "First batch" : "Waitlist"}
        onlinePrice={inr(site.online.price)}
        partyPrice={partyPriceLabel}
        bookClubSub={`Ages 10+ · ₹${site.bookClub.price} a week`}
      />

      <div id="programs" className="mx-auto max-w-5xl scroll-mt-8 px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-5 md:grid-cols-3">
          <Card
            href="/parties"
            tint="bg-peach"
            title="Birthday Story Parties"
            body="A live story show starring the birthday child — at your party venue."
            meta={partyPriceLabel}
          />
          <Card
            href="/online"
            tint="bg-mint"
            title="Story Lab Online"
            body={`${site.online.sessions} live sessions where kids learn to tell their own story.`}
            meta={inr(site.online.price)}
          />
          <Card
            href="/book-club"
            tint="bg-lavender"
            title="Book Club 10+"
            body={`Families share novels; kids borrow one for a week. Owners earn ₹${site.bookClub.ownerShare} each time.`}
            meta={`₹${site.bookClub.price} / week`}
          />
        </div>

        {moms && (
          <p className="mt-14 text-ink-soft">
            <span className="font-bold text-ink">{moms.value} {moms.label.toLowerCase()}</span> and counting.
          </p>
        )}
      </div>
    </>
  );
}
