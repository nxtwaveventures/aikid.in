# Site Structure (multi-page) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the single scrolling homepage into Home, `/parties`, `/online`, `/about`, `/faq`, with a shared layout and old `/#anchor` links still landing in the right place.

**Architecture:** Nav, footer, mobile CTA and the scroll-reveal observer move into the root layout. Each section of today's `src/app/page.tsx` is moved verbatim into its own component under `src/components/sections/`, and pages compose them. A pure `legacyHashPath()` maps old fragments to new paths; a tiny client component on Home applies it.

**Tech Stack:** Next.js 16.4 App Router (Cache Components on), React 19.3, Tailwind 4, TypeScript; Vitest for unit tests (new dev dependency).

**Spec:** `docs/superpowers/specs/2026-10-14-book-club-and-site-structure-design.md` (Part 1). Part 2 (Book Club + Telegram bot) is a separate plan; this plan does **not** add the Book Club page, card or nav item.

## Global Constraints

- No visual redesign: same Tailwind tokens, fonts, animations and copy; markup moves verbatim except where a step shows a change.
- Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (AGENTS.md rule): `01-app/01-getting-started/03-layouts-and-pages.md`, `04-linking-and-navigating.md`, `14-metadata-and-og-images.md`, `03-api-reference/04-functions/use-pathname.md`, `use-router.md`.
- `AGENTS.md` may be rewritten by `next dev`; commit it if it changes.
- Ages copy for stories stays "3–10".
- Do not touch `src/lib/site.ts` data values (forms, prices, TODOs).
- Commit after each task; messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Old shared links `aikid.in/#parties`, `/#online`, `/#faq`, `/#book`, `/#founders`, `/#reviews`, `/#ages` must land on the new page (and section) — not a blank Home. `/#about` must stay on Home (Impact section keeps `id="about"`).
2. Scroll-reveal content must appear after client-side navigation between pages (a page whose `.reveal` elements never get `.in` looks empty).
3. Mobile menu must close after tapping a link (it previously closed via `onClick`; with page navigation the overlay could stay open).
4. Nav highlights the current page, including on nested hash URLs like `/about#reviews`.
5. Each page has its own `<title>` so WhatsApp link previews show which page was shared.

---

## File structure

| File | Responsibility |
|---|---|
| `src/lib/legacyHash.ts` | Pure map from old `#fragment` → new path |
| `src/lib/legacyHash.test.ts` | Unit tests for the map |
| `src/lib/pages.ts` | List of site pages for Nav (href, label, number) |
| `src/components/LegacyHashRedirect.tsx` | Client: on Home, replace old fragment URLs |
| `src/components/Footer.tsx` | Footer moved out of page |
| `src/components/Star.tsx` | Shared star icon (currently duplicated) |
| `src/components/sections/AgeBands.tsx` | Age bands section |
| `src/components/sections/PartiesSection.tsx` | Parties + return-gift band |
| `src/components/sections/OnlineSection.tsx` | Online section |
| `src/components/sections/FaqSection.tsx` | FAQ |
| `src/components/sections/BookingCard.tsx` | One booking/feedback card (from the old forms grid) |
| `src/components/sections/ProgramCards.tsx` | Home: one card per program linking to its page |
| `src/app/layout.tsx` | Adds Nav, ScrollReveal, Footer, MobileCTA, title template |
| `src/app/page.tsx` | Home: Signpost, Impact, ProgramCards, share band |
| `src/app/parties/page.tsx`, `online/page.tsx`, `about/page.tsx`, `faq/page.tsx` | New pages |
| `src/components/Nav.tsx` | Page links + pathname-based active state |
| `src/components/Signpost.tsx` | Sign hrefs → pages |

---

### Task 1: Vitest + legacy hash map

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`, `src/lib/legacyHash.ts`, `src/lib/legacyHash.test.ts`

**Interfaces:**
- Produces: `legacyHashPath(hash: string): string | null` — takes `location.hash` (with or without `#`), returns the new path (may include a fragment) or `null` to stay put.

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest@3.2.4`
Then add to `package.json` `"scripts"`: `"test": "vitest run"`.

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 2: Write the failing test** — `src/lib/legacyHash.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { legacyHashPath } from "@/lib/legacyHash";

describe("legacyHashPath", () => {
  it.each([
    ["#parties", "/parties"],
    ["#online", "/online"],
    ["#faq", "/faq"],
    ["#book", "/parties#book"],
    ["#founders", "/about#founders"],
    ["#reviews", "/about#reviews"],
    ["#ages", "/about#ages"],
    ["parties", "/parties"],
    ["#PARTIES", "/parties"],
  ])("%s → %s", (hash, path) => {
    expect(legacyHashPath(hash)).toBe(path);
  });

  it.each(["", "#", "#about", "#unknown", "#parties/../x"])("%s stays on Home", (hash) => {
    expect(legacyHashPath(hash)).toBeNull();
  });
});
```

- [ ] **Step 3: Run it — expect FAIL** (`Cannot find module '@/lib/legacyHash'`)

Run: `npm test`

- [ ] **Step 4: Implement** — `src/lib/legacyHash.ts`

```ts
// Old single-page anchors (already shared on WhatsApp) → their new pages.
// "#about" is the Impact section, which stays on Home.
const map: Record<string, string> = {
  parties: "/parties",
  online: "/online",
  faq: "/faq",
  book: "/parties#book",
  founders: "/about#founders",
  reviews: "/about#reviews",
  ages: "/about#ages",
};

export function legacyHashPath(hash: string): string | null {
  const key = hash.replace(/^#/, "").toLowerCase();
  return map[key] ?? null;
}
```

- [ ] **Step 5: Run — expect PASS**: `npm test`

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/legacyHash.ts src/lib/legacyHash.test.ts
git commit -m "Map old homepage anchors to new pages"
```

---

### Task 2: Shared shell in the layout

Moves Nav, ScrollReveal, footer and MobileCTA into the root layout so every page gets them. Home still renders every section after this task — no visible change.

**Files:**
- Create: `src/components/Star.tsx`, `src/components/Footer.tsx`
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`

**Interfaces:**
- Produces: `Star({ className?: string })` default export; `Footer()` default export.

- [ ] **Step 1: Create `src/components/Star.tsx`** (copy of `page.tsx:76-82`)

```tsx
export default function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 2l2.6 6.6L21.5 9l-5.3 4.5L18 20.5 12 16.8 6 20.5l1.8-7L2.5 9l6.9-.4z" />
    </svg>
  );
}
```

In `src/app/page.tsx`, delete the local `Star` function (lines 76-82) and add `import Star from "@/components/Star";`.

- [ ] **Step 2: Create `src/components/Footer.tsx`**

Move the `<footer>…</footer>` block from `src/app/page.tsx:399-421` verbatim into:

```tsx
import Star from "@/components/Star";
import { site } from "@/lib/site";

export default function Footer() {
  return (
    /* paste the <footer className="bg-night py-14 pb-28 text-paper/60 md:pb-14"> … </footer> block here unchanged */
  );
}
```

(The comment marks where the moved JSX goes; the block itself is unchanged existing code.)

- [ ] **Step 3: Update `src/app/layout.tsx`**

Add imports and wrap children; replace the `title` line with a template:

```tsx
import Footer from "@/components/Footer";
import MobileCTA from "@/components/MobileCTA";
import Nav from "@/components/Nav";
import ScrollReveal from "@/components/ScrollReveal";
```

```tsx
  title: { default: "Story Lab — Human touch in the world of AI", template: "%s · Story Lab" },
```

```tsx
      <body className="min-h-full">
        <ScrollReveal />
        <Nav />
        <main className="overflow-x-clip">{children}</main>
        <Footer />
        <MobileCTA />
      </body>
```

- [ ] **Step 4: Update `src/app/page.tsx`**

Remove `<ScrollReveal />`, `<Nav />`, the footer block and `<MobileCTA />` and their imports. Change the outer `<main className="overflow-x-clip">…</main>` to a fragment `<>…</>` (layout now provides `<main>`).

- [ ] **Step 5: Verify**

Run: `npm run build && npm run lint`
Expected: build succeeds, no lint errors.
Run `npm run dev`, open `http://localhost:3000` — page looks identical to before (nav at top, footer, mobile bar at 375px).

- [ ] **Step 6: Commit**

```bash
git add src/components/Star.tsx src/components/Footer.tsx src/app/layout.tsx src/app/page.tsx AGENTS.md
git commit -m "Move nav, footer and mobile bar into the root layout"
```

---

### Task 3: Extract sections into components

Still no visible change: Home renders the same sections, now via components.

**Files:**
- Create: `src/components/sections/AgeBands.tsx`, `PartiesSection.tsx`, `OnlineSection.tsx`, `FaqSection.tsx`, `BookingCard.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Produces:
  - `AgeBands({ n }: { n: string })`
  - `PartiesSection({ n }: { n: string })` — parties section + return-gift band + party booking card (`id="book"` on the card wrapper)
  - `OnlineSection({ n }: { n: string })` — online section + online booking card
  - `FaqSection({ n, extra }: { n: string; extra?: [string, string][] })` — `extra` lets Plan 2 append Book Club questions
  - `BookingCard(props: { emoji: string; title: string; body: string; note?: string; href: string; card: string })`

Each section component starts with:

```tsx
import SectionLabel from "@/components/SectionLabel";
import Star from "@/components/Star";
import { inr, site } from "@/lib/site";

const d = (ms: number) => ({ ["--d" as string]: `${ms}ms` }) as React.CSSProperties;
```

(import only what the moved JSX uses — lint will flag unused imports.)

- [ ] **Step 1: `AgeBands.tsx`** — move `ageBands` (page.tsx:55-74) and the `{/* Age bands */}` `<section id="ages">` block (137-170). Replace `<SectionLabel n="03" center>` with `<SectionLabel n={n} center>`.

```tsx
export default function AgeBands({ n }: { n: string }) {
  return (/* moved <section id="ages"> block */);
}
```

- [ ] **Step 2: `BookingCard.tsx`** — the card markup from the forms grid (page.tsx:373-393) as a component:

```tsx
export default function BookingCard({ emoji, title, body, note, href, card }: {
  emoji: string; title: string; body: string; note?: string; href: string; card: string;
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
```

- [ ] **Step 3: `PartiesSection.tsx`** — move `partyIncludes`, `partySteps` (13-26), the `{/* Parties */}` section (172-244) and the return-gift band (246-271). `SectionLabel n="04"` → `n={n}`. After the return-gift band, append the party booking card using the `bookingForms[0]` values (page.tsx:85-95):

```tsx
      <div id="book" className="mx-auto max-w-md scroll-mt-24 px-4 py-24 sm:px-6">
        <BookingCard
          emoji="🎂"
          title={site.party.showPrice ? "Book a birthday party" : "Get a party quote"}
          body={
            site.party.showPrice
              ? `Pick your date and tell us about the birthday child. ${inr(site.party.price)} per party.`
              : "Tell us your date, venue and number of kids — we'll send you a free quote on WhatsApp within a few hours."
          }
          note={partyLine}
          href={site.forms.party}
          card="bg-coral text-white shadow-[0_8px_0_#b9442f]"
        />
      </div>
```

Wrap everything in a fragment; signature `export default function PartiesSection({ n }: { n: string })`. Import `PartyBadge, partyLine` from `@/components/Availability`.

- [ ] **Step 4: `OnlineSection.tsx`** — move `onlineSessions` (28-34) and the `{/* Online */}` section (273-331). `SectionLabel n="05" dark` → `n={n} dark`. Append the online booking card (values from page.tsx:97-104):

```tsx
      <div className="mx-auto max-w-md px-4 py-24 sm:px-6">
        <BookingCard
          emoji="💻"
          title="Book Story Lab Online"
          body={`Reserve a spot in the next batch — ${site.online.sessions} live sessions for ${inr(site.online.price)}.`}
          note={onlineLine}
          href={site.forms.online}
          card="bg-saffron text-ink shadow-[0_8px_0_#b77612]"
        />
      </div>
```

Import `SeatsMeter, onlineLine` from `@/components/Availability`.

- [ ] **Step 5: `FaqSection.tsx`** — move `faqs` (36-53) and the `{/* FAQ */}` section (335-356). `SectionLabel n="07" center` → `n={n} center`. Signature and list:

```tsx
export default function FaqSection({ n, extra = [] }: { n: string; extra?: [string, string][] }) {
  const items = [...faqs, ...extra];
  // in the moved JSX, map over `items` instead of `faqs`
```

- [ ] **Step 6: Use them in `src/app/page.tsx`** — replace the moved blocks with `<AgeBands n="03" />`, `<PartiesSection n="04" />`, `<OnlineSection n="05" />`, `<FaqSection n="07" />`; delete the moved constants. Leave the `{/* Book */}` section in place for now.

- [ ] **Step 7: Verify** — `npm run build && npm run lint && npm test`; dev server: Home looks the same as before (plus a party card and online card after their sections — expected).

- [ ] **Step 8: Commit**

```bash
git add src/components/sections src/app/page.tsx
git commit -m "Split homepage sections into components"
```

---

### Task 4: New pages and the short Home

**Files:**
- Create: `src/app/parties/page.tsx`, `src/app/online/page.tsx`, `src/app/about/page.tsx`, `src/app/faq/page.tsx`, `src/components/sections/ProgramCards.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: section components from Task 3; `Founders`, `Proof`, `Impact`, `Signpost`, `ShareButton`.
- Produces: `ProgramCards()` — Plan 2 adds a Book Club card to its `programs` array.

- [ ] **Step 1: Pages**

`src/app/parties/page.tsx`:

```tsx
import type { Metadata } from "next";
import PartiesSection from "@/components/sections/PartiesSection";

export const metadata: Metadata = {
  title: "Birthday Story Parties",
  description: "A live storyteller at your child's birthday — an original story starring the birthday child, props, puppets and act-it-out fun for ages 3–10.",
};

export default function PartiesPage() {
  return <PartiesSection n="01" />;
}
```

`src/app/online/page.tsx`:

```tsx
import type { Metadata } from "next";
import OnlineSection from "@/components/sections/OnlineSection";
import { inr, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Story Lab Online",
  description: `${site.online.sessions} live storytelling sessions in small groups for ages 3–10 — ${inr(site.online.price)}.`,
};

export default function OnlinePage() {
  return <OnlineSection n="01" />;
}
```

`src/app/about/page.tsx`:

```tsx
import type { Metadata } from "next";
import Founders from "@/components/Founders";
import Proof from "@/components/Proof";
import AgeBands from "@/components/sections/AgeBands";

export const metadata: Metadata = {
  title: "About us",
  description: "Women-founded by Neha & Anamika, guided by our mentors. Stories matched to every age, and what parents say.",
};

export default function AboutPage() {
  return (
    <>
      <Founders />
      <AgeBands n="02" />
      <Proof />
    </>
  );
}
```

`src/app/faq/page.tsx`:

```tsx
import type { Metadata } from "next";
import FaqSection from "@/components/sections/FaqSection";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Questions parents ask about Story Lab parties and online sessions.",
};

export default function FaqPage() {
  return <FaqSection n="01" />;
}
```

- [ ] **Step 2: `ProgramCards.tsx`**

```tsx
import Link from "next/link";
import SectionLabel from "@/components/SectionLabel";
import { onlineLine, partyLine } from "@/components/Availability";
import { inr, partyPriceLabel, site } from "@/lib/site";

const d = (ms: number) => ({ ["--d" as string]: `${ms}ms` }) as React.CSSProperties;

const programs = [
  {
    href: "/parties",
    emoji: "🎂",
    title: "Birthday Story Parties",
    body: `A live story show starring the birthday child · ${site.party.ages}`,
    meta: partyPriceLabel,
    note: partyLine,
    card: "bg-coral text-white shadow-[0_8px_0_#b9442f]",
  },
  {
    href: "/online",
    emoji: "💻",
    title: "Story Lab Online",
    body: `${site.online.sessions} live sessions — kids learn to tell their own story · ${site.online.ages}`,
    meta: inr(site.online.price),
    note: onlineLine,
    card: "bg-saffron text-ink shadow-[0_8px_0_#b77612]",
  },
];

export default function ProgramCards() {
  return (
    <section id="programs" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-32 sm:px-6 sm:py-40">
      <SectionLabel n="02" center>Our programs</SectionLabel>
      <h2 className="reveal mt-5 text-center font-display text-4xl font-semibold sm:text-6xl">Pick a story path</h2>
      <div className="mt-16 grid gap-6 md:grid-cols-2">
        {programs.map((p, i) => (
          <Link
            key={p.href}
            href={p.href}
            className={`reveal reveal-pop hover-wiggle group flex flex-col rounded-[2rem] p-8 transition duration-300 hover:-translate-y-2 ${p.card}`}
            style={d(i * 130)}
          >
            <span className="wiggle-target inline-block text-5xl" aria-hidden>{p.emoji}</span>
            <h3 className="mt-6 font-display text-3xl font-semibold">{p.title}</h3>
            <p className="mt-2 flex-1 opacity-80">{p.body}</p>
            <p className="mt-5 rounded-xl bg-white/25 px-3 py-2 text-sm font-extrabold">🔥 {p.note}</p>
            <span className="mt-8 flex items-center justify-between font-extrabold">
              <span>{p.meta}</span>
              <span>See details <span className="inline-block transition group-hover:translate-x-1">→</span></span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Rewrite `src/app/page.tsx`** to:

```tsx
import { partyPriceLabel, inr, site } from "@/lib/site";
import Impact from "@/components/Impact";
import LegacyHashRedirect from "@/components/LegacyHashRedirect";
import ProgramCards from "@/components/sections/ProgramCards";
import ShareButton from "@/components/ShareButton";
import Signpost from "@/components/Signpost";

export default function Home() {
  return (
    <>
      <LegacyHashRedirect />
      <Signpost
        hiringUrl={site.forms.hiring}
        partyHref={site.forms.party}
        onlineHref={site.forms.online}
        tagline={site.tagline}
        partyTag={site.party.slotsLeftThisMonth > 0 ? "Almost full!" : "Fully booked"}
        onlineTag={site.online.seatsLeft > 0 ? `${site.online.seatsLeft} seats left` : "Waitlist"}
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
```

(The old "Book & feedback" grid is gone: the party and online cards now live on their pages; feedback is linked on Home, in Proof on `/about`, and in the footer.)

- [ ] **Step 4: `src/components/LegacyHashRedirect.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { legacyHashPath } from "@/lib/legacyHash";

// Old links like aikid.in/#parties were shared before the site had pages.
export default function LegacyHashRedirect() {
  const router = useRouter();
  useEffect(() => {
    const path = legacyHashPath(window.location.hash);
    if (path) router.replace(path);
  }, [router]);
  return null;
}
```

- [ ] **Step 5: Verify**

Run: `npm run build && npm run lint && npm test` — expect success; build output lists `/`, `/parties`, `/online`, `/about`, `/faq` as static.
Dev server: open each page; open `http://localhost:3000/#parties` → ends on `/parties`; `/#reviews` → `/about` scrolled to reviews; `/#about` stays on Home at the impact section.

- [ ] **Step 6: Commit**

```bash
git add src/app src/components/sections/ProgramCards.tsx src/components/LegacyHashRedirect.tsx
git commit -m "Add Parties, Online, About and FAQ pages; shorter Home"
```

---

### Task 5: Navigation across pages

**Files:**
- Create: `src/lib/pages.ts`
- Modify: `src/components/Nav.tsx`, `src/components/Signpost.tsx`

**Interfaces:**
- Produces: `pages: { href: string; n: string; label: string; desktop: boolean }[]` — Plan 2 adds `/book-club`.
- Produces: `isActive(pathname: string, href: string): boolean` in `src/lib/pages.ts`.

- [ ] **Step 1: Failing test** — `src/lib/pages.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { isActive } from "@/lib/pages";

describe("isActive", () => {
  it("matches home only on /", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/parties", "/")).toBe(false);
  });
  it("matches a page and its subpaths", () => {
    expect(isActive("/about", "/about")).toBe(true);
    expect(isActive("/about/team", "/about")).toBe(true);
    expect(isActive("/aboutx", "/about")).toBe(false);
  });
});
```

Run `npm test` — expect FAIL (module not found).

- [ ] **Step 2: `src/lib/pages.ts`**

```ts
export const pages = [
  { href: "/", n: "01", label: "Home", desktop: false },
  { href: "/parties", n: "02", label: "Birthday parties", desktop: true },
  { href: "/online", n: "03", label: "Online sessions", desktop: true },
  { href: "/about", n: "04", label: "About us", desktop: true },
  { href: "/faq", n: "05", label: "FAQ", desktop: true },
];

export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
```

Run `npm test` — expect PASS.

- [ ] **Step 3: `Nav.tsx`**

- Replace the `sections` export and `desktopLinks` with `import { isActive, pages } from "@/lib/pages";`, plus `import Link from "next/link";` and `import { usePathname } from "next/navigation";`.
- Replace the `active` state and its IntersectionObserver `useEffect` with `const pathname = usePathname();`.
- Close the mobile menu on navigation:

```tsx
  useEffect(() => setOpen(false), [pathname]);
```

- `linkCls(id)` → `linkCls(href)` using `isActive(pathname, href)`.
- Logo `<a href="#">` → `<Link href="/">`.
- Desktop links:

```tsx
          {pages.filter((p) => p.desktop).map((p) => (
            <Link key={p.href} href={p.href} className={linkCls(p.href)} aria-current={isActive(pathname, p.href) ? "page" : undefined}>
              {p.label}
            </Link>
          ))}
```

- Reviews pill: `href="#reviews"` → `<Link href="/about#reviews">`; its active class uses `false` (pill stays `bg-saffron/15`).
- Seats button `href="#online"` → `<Link href="/online">`; party button `href="#book"` → `<Link href="/parties#book">`.
- Mobile list: map over `pages`, `<Link href={p.href} …>` with `p.n`, `p.label`, active via `isActive(pathname, p.href)`; drop the `onClick` (the pathname effect closes the menu). Keep `onClick={() => setOpen(false)}` anyway for same-page taps.

- [ ] **Step 4: `Signpost.tsx`** — `href="#parties"` → `href="/parties"`, `href="#online"` → `href="/online"` (lines 165-166). Keep `href="#about"` (Impact is on Home).

- [ ] **Step 5: Verify**

`npm run build && npm run lint && npm test`.
Dev server, desktop width: click each nav link → page changes, link underlined, content fades in (scroll-reveal works after navigation — Review Focus 2). Phone width (375px): open menu → tap "FAQ" → menu closes, FAQ shows. Reviews pill → `/about` scrolled to reviews.

- [ ] **Step 6: Commit**

```bash
git add src/lib/pages.ts src/lib/pages.test.ts src/components/Nav.tsx src/components/Signpost.tsx
git commit -m "Nav links to pages with current-page highlight"
```

---

### Task 6: Final check

- [ ] **Step 1:** `npm run build && npm run lint && npm test` — all pass.
- [ ] **Step 2:** In the dev server, check every Review Focus item (1–5) and record results in the PR/commit message. View page source of `/parties` and confirm `<title>Birthday Story Parties · Story Lab</title>`.
- [ ] **Step 3:** At 375px width, every page has no horizontal scroll and the mobile CTA bar doesn't cover the footer.
- [ ] **Step 4:** Commit any fixes. Do **not** push or deploy — the team reviews first.
