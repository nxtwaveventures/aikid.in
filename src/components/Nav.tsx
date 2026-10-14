"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { isActive, pages } from "@/lib/pages";

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // close the phone menu after navigating (incl. browser back/forward)
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  const links = pages.filter((p) => p.href !== "/");
  const linkCls = (href: string) =>
    `transition hover:text-ink ${isActive(pathname, href) ? "text-ink underline decoration-2 underline-offset-8" : "text-ink-soft"}`;

  return (
    <header className="border-b border-line">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6" aria-label="Main">
        <Link href="/" className="font-display text-xl font-medium">
          Story Lab
        </Link>
        <div className="hidden items-center gap-7 font-semibold sm:flex">
          {links.map((p) => (
            <Link key={p.href} href={p.href} className={linkCls(p.href)} aria-current={isActive(pathname, p.href) ? "page" : undefined}>
              {p.label}
            </Link>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="font-semibold text-ink-soft sm:hidden"
          aria-expanded={open}
          aria-controls="phone-menu"
        >
          {open ? "Close" : "Menu"}
        </button>
      </nav>
      {open && (
        <div id="phone-menu" className="border-t border-line px-4 pb-4 sm:hidden">
          {links.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(pathname, p.href) ? "page" : undefined}
              className={`block py-3 text-lg font-semibold ${isActive(pathname, p.href) ? "text-ink" : "text-ink-soft"}`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
