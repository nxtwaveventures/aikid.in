// Numbered section label ("01 · THE STORY LAB EFFECT") so visitors always know where they are.
export default function SectionLabel({
  n,
  children,
  center = false,
  dark = false,
  className = "",
}: {
  n: string;
  children: React.ReactNode;
  center?: boolean;
  dark?: boolean;
  className?: string;
}) {
  return (
    <p className={`reveal flex items-center gap-3 ${center ? "justify-center" : ""} ${className}`}>
      <span className="rounded-md bg-saffron px-2 py-0.5 font-display text-sm font-bold text-ink">{n}</span>
      <span className={`text-sm font-extrabold uppercase tracking-[0.2em] ${dark ? "text-paper/70" : "text-ink-soft"}`}>
        {children}
      </span>
    </p>
  );
}
