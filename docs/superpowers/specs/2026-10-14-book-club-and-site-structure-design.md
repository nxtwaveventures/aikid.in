# Book Club 10+ and multi-page site — design

Date: 2026-10-14 · Status: awaiting review

## Why

Story Lab is getting traction. Two changes:

1. **Site structure** — the single scrolling homepage becomes separate pages, so each offering has its own shareable link and new programs slot in easily.
2. **Book Club 10+** — a novel-sharing circle for readers above 10, piloted in Sumadhura Madhuram. Parents contribute novels their kids have finished; other kids borrow them for ₹20 a week. The owner earns ₹10 every time their book is borrowed; Story Lab keeps ₹10.

## Decisions (agreed in chat)

| Topic | Decision |
|---|---|
| Pilot | Run by hand in one society (Sumadhura Madhuram); automate only when expanding |
| Visibility | Book Club page is public; borrowing is Sumadhura-only for now; "Want this in your society?" captures interest |
| Books accepted | Novels suitable for 10+, approved by Story Lab before listing |
| Duplicates | One copy per title. A later submission of the same title + author is declined: "we already have it listed" |
| Owner earnings | ₹10 per borrow, every borrow, paid out by UPI on a regular payout day |
| Payment | Prepaid ₹20, before pickup. UPI ID is **not** shown on the site — sent on WhatsApp only after a borrow request |
| Data source | One Google Sheet; the website reads a published, privacy-safe "Shelf" tab |

## Part 1 — Site structure

| Page | Path | Content |
|---|---|---|
| Home | `/` | Signpost, impact counters, one card per program (Parties, Online, Book Club), a few reviews, share button |
| Birthday Parties | `/parties` | Today's parties section, return-gift band, quote CTA |
| Story Lab Online | `/online` | Today's online section, session path, seats meter |
| Book Club 10+ | `/book-club` | How it works, live shelf, borrow buttons, "Share a book" form, "Want this in your society?" form |
| About | `/about` | Founders, mentors, age bands (3–10 stories, 10+ book club), reviews/proof |
| FAQ | `/faq` | Existing FAQ plus book club FAQ (late returns, damage, payouts, why ₹20) |

- **Nav** links to pages (not `#anchors`); active state comes from the current path instead of the IntersectionObserver. Mobile menu and `MobileCTA` keep working.
- **Old links** (`/#parties`, `/#online`, `/#faq`, `/#book`, `/#founders`, `/#reviews`) are shared on WhatsApp already. URL fragments never reach the server, so a small client component on Home maps the hash to the new page and calls `router.replace`.
- Sections move into components (e.g. `PartiesSection`, `OnlineSection`) so pages stay thin and Home can reuse short versions. No visual redesign — same tokens, fonts, animations.
- Each page gets its own `metadata` (title, description) for sharing previews.
- The "Book & feedback" forms grid moves to the bottom of the relevant pages (party form on `/parties`, etc.); feedback link stays in the footer and on Home.

## Part 2 — Book Club tracking

### Google Sheet: "Story Lab Book Club"

Created by a new function `createBookClub()` in `scripts/create-google-forms.gs` (same pattern as the existing forms), which builds two forms, the sheet, its tabs, formulas and an on-submit trigger.

**Form A — "Share a book"** → tab **Books**
- Asked: parent name, WhatsApp number, flat number, book title, author, ISBN (optional; "13 digits on the back cover"), condition (Like new / Good / Well-loved), confirmation it's a novel suitable for 10+.
- Added by script on submit: `Book ID` (`B001`, `B002`, …), `Match key` (title + author lower-cased, punctuation and leading "the/a/an" removed), `Duplicate of` (Book ID of an already-approved book with the same match key, else blank). Duplicate rows are highlighted red.
- Set by Story Lab: `Approval` dropdown — Pending (default) / Approved / Not 10+ / Duplicate.
- A `Reply` column shows a ready-to-copy WhatsApp message for Duplicate / Not 10+ / Approved outcomes.

**Form B — "Want this in your society?"** → its own responses tab: name, WhatsApp, society name, area, number of 10+ readers.

**Tab Borrows** (filled by hand, one row per borrow)
- Typed: date, Book ID, borrower name, flat, ✓ Paid ₹20, ✓ Returned, ✓ Owner paid.
- Formulas: title, owner, owner WhatsApp (lookups from Books), due date = date + 7.
- Conditional format: red when today > due date and Returned is unticked.
- Data validation: Book ID must exist among Approved books.

**Tab Payouts** (formulas only): per owner — books lent, borrows, ₹ earned (10 × borrows with Paid ₹20 ticked), ₹ paid (10 × Owner paid ticked), ₹ owed.

**Tab Shelf** (formulas only, the only published tab): `id, title, author, isbn, status` for Approved books. `status` = `borrowed` if the book has a Borrows row with Returned unticked, else `available`. No names, numbers or flats.

Shelf is published via *File → Share → Publish to web → Shelf → CSV*. The CSV URL goes in `site.bookClub.shelfCsv`.

### Website: `/book-club`

- `src/lib/bookClub.ts` — `getShelf()`: fetches the CSV, parses it (small hand-written parser, quoted fields supported), returns `Book[]`. Uses `'use cache'` + `cacheLife` with ~5-minute revalidation. On fetch/parse failure, returns `[]` and the page shows "Shelf is being restocked — message us on WhatsApp".
- Shelf UI: grid of book cards. Cover from Open Library (`https://covers.openlibrary.org/b/isbn/<isbn>-M.jpg?default=false`); on missing ISBN or image error, a coloured "spine" card with title and author. Badge: Available / Borrowed. Available books sorted first. Simple title/author search box (client-side filter).
- **Borrow for ₹20** button (available books only) → `whatsappLink("Hi! I'd like to borrow <title> by <author> (<id>) for ₹20. Name: ___ Flat no: ___")`. Borrowed books show "Out now — ask to be next" with a waitlist message instead.
- Copy states: "₹20 for one week, paid before pickup · Owner earns ₹10 every borrow · Currently in Sumadhura Madhuram".
- How-it-works strip: Share a novel → We list it → Kids borrow for ₹20 → You earn ₹10 each time.
- Config in `site.ts`: `bookClub: { price: 20, ownerShare: 10, loanDays: 7, ages: "10+ years", societies: ["Sumadhura Madhuram"], shelfCsv, }` and `forms.shareBook`, `forms.bookClubInterest`.

### Borrow flow (manual)

1. Kid/parent taps Borrow → WhatsApp message to Story Lab.
2. Story Lab replies with UPI ID (`nehanagpal0910@okicici`, kept off the site) and amount.
3. Payment screenshot arrives → book handed over → row added in Borrows with Paid ticked. Shelf flips to Borrowed within ~5 minutes.
4. Return → tick Returned. Payout day → pay owners per Payouts tab, tick Owner paid.

## Error handling

- Sheet unreachable or malformed → empty shelf with WhatsApp fallback; rest of page renders.
- Rows with missing title or unknown status are skipped.
- Cover image 404 → spine card.

## Testing

- Unit tests for the CSV parser and match-key normaliser (quotes, commas, "The Hobbit" vs "hobbit", extra spaces).
- Build passes; each page renders; old `/#…` links redirect.
- Manual end-to-end with a test sheet: submit form → approve → appears on site → log borrow → shows Borrowed → tick returned → Available. Duplicate submission is flagged red.
- Mobile check at 375px.

## Out of scope (later, when expanding)

- Online payment confirmation (Razorpay payment links), automatic payouts.
- Per-society shelves and logins.
- Business UPI ID ("Story Lab" display name) — recommended before expanding.

## Needed from the team

- WhatsApp number for borrow requests (`site.whatsapp` is still the placeholder `919999999999`).
- Survey details (optional — can refine Book Club copy later).
