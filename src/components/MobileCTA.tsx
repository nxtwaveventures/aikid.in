// Sticky bottom bar on phones so both bookings are always one tap away.
import { inr, site } from "@/lib/site";

export default function MobileCTA() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_-15px_rgba(31,37,71,0.3)] backdrop-blur md:hidden">
      <div className="grid grid-cols-2 gap-2">
        <a
          href={site.forms.party}
          target="_blank"
          rel="noopener"
          className="rounded-full bg-coral px-3 py-3 text-center text-sm font-extrabold text-white shadow-[0_4px_0_#b9442f]"
        >
          {site.party.showPrice ? "🎂 Book a party" : "🎂 Party quote"}
        </a>
        <a
          href={site.forms.online}
          target="_blank"
          rel="noopener"
          className="rounded-full bg-saffron px-3 py-3 text-center text-sm font-extrabold text-ink shadow-[0_4px_0_#b77612]"
        >
          {site.online.seatsLeft > 0 ? `💻 ${site.online.seatsLeft} seats · ${inr(site.online.price)}` : "💻 Join waitlist"}
        </a>
      </div>
    </div>
  );
}
