"use client";

import { useEffect, useState } from "react";
import { AnnouncementBar } from "@/components/Availability";
import { inr, site } from "@/lib/site";

export const sections = [
  { id: "about", n: "01", label: "Our impact" },
  { id: "founders", n: "02", label: "About us" },
  { id: "ages", n: "03", label: "Ages" },
  { id: "parties", n: "04", label: "Birthday parties" },
  { id: "online", n: "05", label: "Online sessions" },
  { id: "reviews", n: "06", label: "Reviews" },
  { id: "faq", n: "07", label: "FAQ" },
];

const desktopLinks = ["founders", "parties", "online", "faq"];

function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 2l2.6 6.6L21.5 9l-5.3 4.5L18 20.5 12 16.8 6 20.5l1.8-7L2.5 9l6.9-.4z" />
    </svg>
  );
}

function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Nav() {
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);

  // highlight the section currently in view
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // lock scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const linkCls = (id: string) =>
    `relative py-1 transition hover:text-coral ${
      active === id
        ? "text-coral after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-coral"
        : ""
    }`;

  return (
    <>
    <header className="sticky top-0 z-30 border-b border-ink/5 bg-paper/85 backdrop-blur-md">
      <AnnouncementBar />
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6" aria-label="Main">
        <a href="#" className="hover-wiggle flex shrink-0 items-center gap-2 whitespace-nowrap font-display text-2xl font-bold">
          <Star className="wiggle-target h-6 w-6 text-saffron" />
          Story Lab
        </a>

        <div className="hidden items-center gap-6 whitespace-nowrap text-sm font-bold text-ink-soft lg:flex">
          {sections
            .filter((s) => desktopLinks.includes(s.id))
            .map((s) => (
              <a key={s.id} href={`#${s.id}`} className={linkCls(s.id)} aria-current={active === s.id ? "true" : undefined}>
                {s.label}
              </a>
            ))}
          <a
            href="#reviews"
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition hover:bg-saffron/30 ${
              active === "reviews" ? "bg-saffron/40" : "bg-saffron/15"
            }`}
          >
            <span className="tracking-tighter text-saffron" aria-hidden>
              ★★★★★
            </span>
            <span className="text-ink">{site.reviewCount}+ reviews</span>
          </a>
        </div>

        <div className="flex items-center gap-2">
          {site.instagram && (
            <a
              href={`https://www.instagram.com/${site.instagram}/`}
              target="_blank"
              rel="noopener"
              aria-label={`Story Lab on Instagram (@${site.instagram})`}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-saffron via-coral to-[#c2537a] text-white transition hover:-translate-y-0.5"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
          )}
          <a
            href="#online"
            className="hidden whitespace-nowrap rounded-full bg-saffron px-4 py-2.5 text-sm font-extrabold text-ink transition hover:-translate-y-0.5 sm:inline-block lg:hidden xl:inline-block"
          >
            {site.online.seatsLeft > 0 ? `Only ${site.online.seatsLeft} seats left` : "Join waitlist"} · {inr(site.online.price)}
          </a>
          <a
            href="#book"
            className="hidden animate-ping-soft whitespace-nowrap rounded-full bg-coral px-4 py-2.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 sm:inline-block"
          >
            {site.party.showPrice ? "Book a party" : "Party quote"}
          </a>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-paper lg:hidden"
            aria-label="Open menu"
            aria-expanded={open}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          </button>
        </div>
      </nav>
    </header>

      {/* Mobile menu — outside <header>: its backdrop-blur would trap this fixed overlay */}
      <div
        className={`fixed inset-0 z-50 bg-ink/40 transition-opacity lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col bg-paper p-6 shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-display text-xl font-bold">
              <Star className="h-5 w-5 text-saffron" /> Story Lab
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 text-2xl"
              aria-label="Close menu"
            >
              ×
            </button>
          </div>
          <ul className="mt-8 flex-1 space-y-1 overflow-y-auto">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-4 rounded-2xl px-3 py-3.5 font-display text-xl font-semibold transition ${
                    active === s.id ? "bg-saffron/20" : "hover:bg-ink/5"
                  }`}
                >
                  <span className="rounded-md bg-saffron px-2 py-0.5 text-sm font-bold">{s.n}</span>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          {site.instagram && (
            <a
              href={`https://www.instagram.com/${site.instagram}/`}
              target="_blank"
              rel="noopener"
              className="mt-4 flex items-center gap-3 rounded-2xl px-3 py-3 font-bold text-ink-soft hover:bg-ink/5"
            >
              <InstagramIcon className="h-6 w-6 text-coral" /> @{site.instagram}
            </a>
          )}
          <div className="mt-6 grid gap-3">
            <a
              href={site.forms.party}
              target="_blank"
              rel="noopener"
              className="rounded-full bg-coral px-5 py-3.5 text-center font-extrabold text-white shadow-[0_5px_0_#b9442f]"
            >
              {site.party.showPrice ? "🎂 Book a birthday party" : "🎂 Get a free party quote"}
            </a>
            <a
              href={site.forms.online}
              target="_blank"
              rel="noopener"
              className="rounded-full bg-saffron px-5 py-3.5 text-center font-extrabold text-ink shadow-[0_5px_0_#b77612]"
            >
              💻 {site.online.seatsLeft > 0 ? `Grab a seat · ${inr(site.online.price)}` : "Join the waitlist"}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
