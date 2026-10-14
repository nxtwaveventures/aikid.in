export default function BookingCard({ emoji, title, body, note, href, card }: {
  emoji: string;
  title: string;
  body: string;
  note?: string;
  href: string;
  card: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={`reveal reveal-pop hover-wiggle group flex flex-col rounded-[2rem] p-8 transition duration-300 hover:-translate-y-2 ${card}`}
    >
      <span className="wiggle-target inline-block text-5xl" aria-hidden>{emoji}</span>
      <h3 className="mt-6 font-display text-2xl font-semibold">{title}</h3>
      <p className="mt-2 flex-1 opacity-80">{body}</p>
      {note && <p className="mt-5 rounded-xl bg-white/25 px-3 py-2 text-sm font-extrabold">🔥 {note}</p>}
      <span className="mt-8 font-extrabold">
        Open the form <span className="inline-block transition group-hover:translate-x-1">→</span>
      </span>
    </a>
  );
}
