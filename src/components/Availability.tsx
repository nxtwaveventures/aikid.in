// Live-availability badges and the top announcement bar. All numbers come from site.ts.
import { site } from "@/lib/site";

const { party, online } = site;

export const partyLine =
  party.slotsLeftThisMonth === 0
    ? "Fully booked this month — book ahead for next month"
    : `${party.status} · only ${party.slotsLeftThisMonth} date${party.slotsLeftThisMonth === 1 ? "" : "s"} left this month`;

export const onlineLine =
  online.seatsLeft === 0
    ? `Batch starting ${online.nextBatch} is full — join the waitlist`
    : `Only ${online.seatsLeft} of ${online.seatsTotal} seats left · batch starts ${online.nextBatch}`;

function LiveDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-70 ${color}`} />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  );
}

export function AnnouncementBar() {
  const items = [
    ["🎂", partyLine],
    ["💻", onlineLine],
  ];
  return (
    <div className="overflow-hidden bg-ink py-2 text-sm font-bold text-paper" role="status">
      <div className="flex w-max animate-marquee gap-16 [animation-duration:40s]">
        {[0, 1, 2, 3].flatMap((k) =>
          items.map(([icon, text]) => (
            <span key={`${k}-${text}`} className="flex items-center gap-2" aria-hidden={k > 0}>
              <LiveDot color="bg-coral" />
              {icon} {text}
            </span>
          )),
        )}
      </div>
    </div>
  );
}

export function PartyBadge({ className = "" }: { className?: string }) {
  return (
    <p className={`inline-flex items-center gap-2 rounded-full bg-coral/10 px-4 py-2 text-sm font-extrabold text-coral ${className}`}>
      <LiveDot color="bg-coral" />
      {partyLine}
    </p>
  );
}

export function SeatsMeter({ dark = false }: { dark?: boolean }) {
  const taken = online.seatsTotal - online.seatsLeft;
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-extrabold">
        <LiveDot color="bg-coral" />
        <span className={dark ? "text-paper" : "text-coral"}>{onlineLine}</span>
      </div>
      <div className="mt-3 flex gap-1.5" aria-label={`${taken} of ${online.seatsTotal} seats taken`}>
        {Array.from({ length: online.seatsTotal }, (_, i) => (
          <span
            key={i}
            className={`h-3 flex-1 rounded-full ${i < taken ? "bg-coral" : dark ? "bg-paper/20" : "bg-ink/10"}`}
          />
        ))}
      </div>
    </div>
  );
}
