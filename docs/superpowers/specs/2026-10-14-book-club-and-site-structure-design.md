# Book Club 10+ and multi-page site — design

Date: 2026-10-14 · Status: awaiting review

## Why

Story Lab is getting traction. Two changes:

1. **Site structure** — the single scrolling homepage becomes separate pages, so each offering has its own shareable link and new programs slot in easily.
2. **Book Club 10+** — a novel-sharing circle for readers above 10, piloted in Sumadhura Madhuram. Parents contribute novels their kids have finished; other kids borrow them for ₹40 a week. The owner earns ₹20 every time their book is borrowed; Story Lab keeps ₹20. Parents use it through a Telegram bot.

## Decisions (agreed in chat)

| Topic | Decision |
|---|---|
| Pilot | One society (Sumadhura Madhuram); Story Lab runs approvals, payments and handovers |
| Visibility | Book Club page is public; only approved Sumadhura members can borrow or add books; "Want this in your society?" captures interest |
| Books accepted | Novels suitable for 10+, approved by Story Lab before listing |
| Duplicates | One copy per title. Adding a title + author already on the shelf is declined instantly: "we already have it listed" |
| Price | ₹40 per one-week borrow, prepaid before pickup |
| Owner earnings | ₹20 per borrow, every borrow, paid out by Story Lab via UPI |
| Main interface | **Telegram bot** — parents' Telegram account is their login; no website accounts |
| Membership | New members are approved by Story Lab before they can borrow or add |
| Payment details | UPI ID sent by the bot only after a borrow request; never on the website or in the repo |
| Notifications | Public Telegram **channel** (new / back-on-shelf books); private **team group** where Story Lab runs everything with buttons |
| Record | Google Sheet is the database and the human-readable record; the bot reads and writes it |
| Children's data | Members are parents (DPDP Act 2023: no accounts for minors). Child's first name only, optional |

## Part 1 — Site structure

| Page | Path | Content |
|---|---|---|
| Home | `/` | Signpost, impact counters, one card per program (Parties, Online, Book Club), a few reviews, share button |
| Birthday Parties | `/parties` | Today's parties section, return-gift band, quote CTA |
| Story Lab Online | `/online` | Today's online section, session path, seats meter |
| Book Club 10+ | `/book-club` | How it works, live shelf, "Borrow on Telegram", "Add your book", "Join the channel", "Want this in your society?" form |
| About | `/about` | Founders, mentors, age bands (3–10 stories, 10+ book club), reviews/proof |
| FAQ | `/faq` | Existing FAQ plus book club FAQ (joining, late returns, damage, payouts, why ₹40) |

- **Nav** links to pages (not `#anchors`); active state comes from the current path instead of the IntersectionObserver. Mobile menu and `MobileCTA` keep working.
- **Old links** (`/#parties`, `/#online`, `/#faq`, `/#book`, `/#founders`, `/#reviews`) are shared on WhatsApp already. URL fragments never reach the server, so a small client component on Home maps the hash to the new page and calls `router.replace`.
- Sections move into components (e.g. `PartiesSection`, `OnlineSection`) so pages stay thin and Home can reuse short versions. No visual redesign — same tokens, fonts, animations.
- Each page gets its own `metadata` (title, description) for sharing previews.
- The "Book & feedback" forms grid moves to the bottom of the relevant pages (party form on `/parties`, etc.); feedback link stays in the footer and on Home.

## Part 2 — Book Club

### Architecture

```
Parents ──Telegram──▶ Bot webhook (/api/telegram, this Next.js app on Vercel)
Story Lab team group ─┘        │
                               ├──▶ Google Sheet (Sheets API, service account) ◀── Story Lab can view/edit
                               ├──▶ Telegram channel (posts)
                               └──▶ revalidates website shelf
Website /book-club ──reads──▶ Google Sheet (cached ~5 min, revalidated on change)
Vercel Cron (daily 9 am IST) ──▶ /api/telegram/cron (reminders, overdue list)
```

- Bot runs as a webhook route handler in this repo — no new hosting. Library chosen in the implementation plan (Vercel Chat SDK Telegram adapter or grammY), whichever handles inline buttons and multi-step replies cleanly.
- Secrets in Vercel env vars: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` (checked on every request), `TELEGRAM_TEAM_CHAT_ID`, `TELEGRAM_CHANNEL_ID`, `UPI_ID`, `GOOGLE_SERVICE_ACCOUNT` (JSON), `BOOKCLUB_SHEET_ID`.
- Team actions are accepted only from the team group chat ID.

### Google Sheet: "Story Lab Book Club"

Owned by storylabkid@gmail.com, shared with the service account. Tabs (one header row each):

- **Members** — telegram_id, name, flat, phone, child_name (optional), status (pending / approved / declined), joined_at
- **Books** — book_id (`B001`…), title, author, match_key, condition, photo_file_id, owner_telegram_id, status (pending / listed / rejected), added_at
- **Borrows** — borrow_id (`L001`…), book_id, borrower_telegram_id, requested_at, paid_at, due_at (paid_at + 7 days), returned_at, owner_paid_at, state (requested / out / returned / cancelled)
- **Sessions** — telegram_id, step, draft (JSON) — in-progress `/add` and `/start` conversations
- **Log** — timestamp, actor, action, details — every bot action, for audit

Payouts are computed from Borrows (owner's paid borrows × ₹20 minus owner_paid). A **Payouts** tab with formulas mirrors it for viewing in the sheet.

**match_key**: title + author, lower-cased, punctuation removed, leading "the / a / an" dropped, spaces collapsed. Duplicate = any book with the same match_key and status pending or listed.

### Parent flows (private chat with the bot)

- **/start** — if new: asks name, flat number, child's first name (optional, skippable), then a "Share my phone number" contact button. Saves as pending and posts to the team group: "New member: Riya Sharma, Flat 1204 — ✅ Approve / ❌ Decline". Approve → bot welcomes them and lists commands. Decline → polite message. Pending members who try other commands are told "waiting for approval".
- **/add** — title → author → (instant duplicate check: "We already have *Wonder* listed — do you have another novel?") → condition (Like new / Good / Well-loved buttons) → cover photo (or "Skip") → confirm. Saved as pending; team group gets the book with ✅ Approve / 🚫 Not 10+ buttons. Owner is told the outcome. `/cancel` aborts any step.
- **/shelf** — listed books, available first, 5 per page with ◀ ▶; each with "Borrow ₹40" (or "Out until 21 Oct" when borrowed). Optional search: `/shelf wonder`.
- **Borrow** — tap button (or website deep link `t.me/<bot>?start=borrow_B007`) → confirm → borrow created as requested; bot replies with UPI ID, ₹40, book name and "send the payment screenshot here". Screenshot is forwarded to the team group with 💰 Paid / ✖ Cancel buttons. A book with an open request or out on loan can't be requested again. One active borrow per member during the pilot.
- **/mybooks** — the parent's own books with status (pending / on shelf / out with a member until date) and ₹ earned, ₹ paid, ₹ pending.
- **/borrowed** — what they have out and due dates.
- **/help** — commands and how it works.

### Team flows (private team group)

- Approve/decline members and books (buttons above). Approving a book posts to the channel: cover photo (if any) + "📚 New on the shelf: *Wonder* by R.J. Palacio · ₹40/week" + link to the bot.
- **💰 Paid** on a borrow → state out, due_at set; borrower told "Paid ✓ — we'll hand over *Wonder*, due back 21 Oct"; owner told "Your book was just borrowed — +₹20". Message updates to show 📥 Returned button.
- **📥 Returned** → state returned; channel posts "🔁 Back on the shelf: *Wonder*".
- **/payouts** — owners with pending ₹, each with "Mark ₹X paid" button (sets owner_paid_at on their unpaid borrows) and owner is notified.
- **/overdue** — list of overdue borrows.

### Daily cron (9 am IST)

- Borrowers due tomorrow: reminder. Overdue: reminder to borrower, list to team group.

### Website `/book-club`

- `src/lib/bookClub.ts` — `getShelf()` reads Books + open Borrows via Sheets API, returns `{ id, title, author, status, hasPhoto }[]` for listed books only — no names, phones or flats. `'use cache'` + `cacheLife` (~5 min) with a cache tag; the bot revalidates the tag after approve / paid / returned so changes appear immediately.
- Shelf UI: book cards, available first, client-side search. Cover via `/api/covers/[bookId]` which fetches the Telegram photo server-side (bot token never exposed) and returns it with long CDN cache; no photo → coloured "spine" card.
- Buttons: "Borrow on Telegram" (deep link per book), "Add your book" (`t.me/<bot>?start=add`), "Join new-book alerts" (channel link).
- Copy: "₹40 for one week, paid before pickup · Owners earn ₹20 every borrow · Currently in Sumadhura Madhuram · Members approved by Story Lab".
- How-it-works: Join on Telegram → Add a novel → Kids borrow for ₹40 → You earn ₹20 each time.
- "Want this in your society?" → new Google Form (name, WhatsApp, society, area, number of 10+ readers) added to `scripts/create-google-forms.gs` pattern.
- Config in `site.ts`: `bookClub: { price: 40, ownerShare: 20, loanDays: 7, ages: "10+ years", societies: ["Sumadhura Madhuram"], bot: "<username>", channel: "<link>" }`, `forms.bookClubInterest`.

## Error handling

- Webhook rejects requests without the correct secret header.
- Sheets API failure during a bot action → user gets "Something went wrong, please try again"; error logged; team group alerted if it repeats.
- Telegram retries a webhook on non-200 → handlers are idempotent (actions keyed by message/callback id; Paid/Returned check current state before changing).
- Website: sheet unreachable → "Shelf is being restocked" with Telegram links; rest of page renders.
- Missing/invalid photo → spine card.

## Testing

- Unit tests: match_key normaliser, payout calculation, borrow state transitions (requested → out → returned; no double-borrow; no double payout), conversation step machine for `/add` and `/start`.
- Integration: a test bot + test sheet; scripted walk-through of every flow (join → approve → add → approve → channel post → borrow → paid → reminders → returned → payout).
- Website: build passes, each page renders, old `/#…` links redirect, shelf reflects sheet changes, mobile at 375px.

## Out of scope (later)

- Automatic payment confirmation (Razorpay) and automatic payouts.
- Multiple societies (per-society shelves and admins) and a website login.
- WhatsApp bot.

## One-time setup (Story Lab)

- Create the bot in @BotFather; create the public channel and the private team group; add the bot as admin to both.
- Create the Google Sheet; share it with the service account email.
- Add env vars in Vercel; deploy; register the webhook.
- Guided steps go in the implementation plan.

## Still open

- Survey details (optional — refine Book Club copy).
