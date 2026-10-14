// The few building blocks every page is made of.
import Link from "next/link";

export function Page({ title, lead, children }: { title: string; lead?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-display text-4xl font-medium leading-tight sm:text-5xl">{title}</h1>
      {lead && <p className="mt-5 text-lg leading-relaxed text-ink-soft">{lead}</p>}
      {children}
    </div>
  );
}

export function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-16 scroll-mt-24">
      <h2 className="font-display text-2xl font-medium">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Button({ href, children }: { href: string; children: React.ReactNode }) {
  const cls =
    "inline-block rounded-full bg-ink px-7 py-3.5 font-bold text-paper transition hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
  return href.startsWith("/") ? (
    <Link href={href} className={cls}>{children}</Link>
  ) : (
    <a href={href} target="_blank" rel="noopener" className={cls}>{children}</a>
  );
}

export function Card({ href, tint, title, body, meta }: { href: string; tint: string; title: string; body: string; meta: string }) {
  return (
    <Link href={href} className={`group block rounded-3xl p-7 transition hover:-translate-y-0.5 ${tint}`}>
      <h2 className="font-display text-2xl font-medium">{title}</h2>
      <p className="mt-2 leading-relaxed text-ink-soft">{body}</p>
      <p className="mt-6 flex items-center justify-between font-bold">
        <span>{meta}</span>
        <span>
          See details <span className="inline-block transition group-hover:translate-x-1">→</span>
        </span>
      </p>
    </Link>
  );
}

export function Steps({ items }: { items: string[][] }) {
  return (
    <ol className="space-y-5">
      {items.map(([title, body], i) => (
        <li key={title} className="flex gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-butter text-sm font-bold">{i + 1}</span>
          <p>
            <span className="font-bold">{title}</span>
            <span className="block text-ink-soft">{body}</span>
          </p>
        </li>
      ))}
    </ol>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-soft" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function Facts({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid grid-cols-3 gap-3 text-sm">
      {items.map(([k, v]) => (
        <div key={k} className="rounded-2xl border border-line p-3">
          <dt className="text-ink-soft">{k}</dt>
          <dd className="mt-0.5 font-bold">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
