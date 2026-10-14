import { site } from "@/lib/site";

export default function Footer() {
  const links = [
    site.instagram && { href: `https://www.instagram.com/${site.instagram}/`, label: `Instagram @${site.instagram}` },
    { href: site.forms.survey, label: "Parent survey" },
    { href: site.forms.hiring, label: "We're hiring storytellers" },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-10 text-sm text-ink-soft sm:flex-row sm:justify-between sm:px-6">
        <p>© 2026 Story Lab · Founded by Neha &amp; Anamika</p>
        <p className="flex flex-wrap gap-x-5 gap-y-1">
          {links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener" className="hover:text-ink">
              {l.label}
            </a>
          ))}
        </p>
      </div>
    </footer>
  );
}
