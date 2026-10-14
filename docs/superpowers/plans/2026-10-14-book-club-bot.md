# Book Club Telegram Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the Book Club 10+ through the Telegram bot @storylabclub_bot — parents join, add novels and borrow; Story Lab approves and confirms payments from a private team group; a public channel announces books; the website shows the live shelf.

**Architecture:** A grammY bot runs as a webhook route handler in this Next.js app on Vercel. All data lives in a Google Sheet owned by storylabkid@gmail.com; a small Apps Script web app (`scripts/book-club.gs`) is the sheet's API (read all / upsert row / delete row, guarded by a shared secret). Pure modules hold the rules (`rules.ts`) and the multi-step conversations (`flow.ts`) so they are unit-tested without Telegram or Sheets. A daily Vercel Cron sends reminders. The `/book-club` page reads the shelf through a cached function that the bot revalidates after every change.

**Tech Stack:** Next.js 16.4 (Cache Components), React 19.3, TypeScript, grammY 1.46.0, Google Apps Script, Vitest 3.2.4, Vercel Cron.

**Spec:** `docs/superpowers/specs/2026-10-14-book-club-and-site-structure-design.md` (Part 2). Amendments below are binding where they differ.

## Spec amendments (rulings)

- **Sheet access via Apps Script, not a Google Cloud service account** — the team already runs Apps Script for forms; no Google Cloud setup. Cost if wrong: ~1–2 s per sheet call; acceptable for one society.
- **No formula "Payouts"/"Shelf" tabs** — the bot's `/payouts` and the website compute them; the sheet keeps raw tabs (Members, Books, Borrows, Sessions, Log). Cost if wrong: team reads payouts in Telegram instead of the sheet.
- **Price ₹40, owner ₹20** (agreed in chat after the spec's ₹20/₹10) — read from `site.bookClub`.
- **Bot username:** `storylabclub_bot`.

## Global Constraints

- Prices and loan length only from `site.bookClub` (`price: 40`, `ownerShare: 20`, `loanDays: 7`). Never hard-code ₹ amounts in bot text.
- Secrets only in env vars, never in the repo or chat: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_TEAM_CHAT_ID`, `TELEGRAM_CHANNEL_ID`, `UPI_ID`, `BOOKCLUB_SCRIPT_URL`, `BOOKCLUB_SCRIPT_SECRET`, `CRON_SECRET`.
- The website never shows member names, phones, flats or Telegram IDs.
- Members are parents; collect child's first name only, optional (DPDP Act 2023).
- Team actions (approve, paid, returned, payouts) only from the chat whose id equals `TELEGRAM_TEAM_CHAT_ID`.
- Read `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`, `08-caching.md`, `03-api-reference/04-functions/revalidateTag.md` before Next.js code (AGENTS.md). `revalidateTag` takes two args: `revalidateTag("shelf", "max")`.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Do not push or deploy to production without the user's go-ahead.

## Review Focus

1. **Telegram retries the same update** (webhook timeout) — tapping 💰 Paid twice or a retried update must not create two borrows, pay an owner twice, or double-announce a book. State checks before every transition.
2. **Two kids request the same book** within seconds — only one request may exist; the second gets "someone just asked for it".
3. **A parent sends text/photos with no conversation going** (or after `/cancel`) — reply with help, never crash or save junk.
4. **Someone outside the team group presses a team button** (forwarded message) — refused.
5. **Sheet/Apps Script unreachable** — the parent gets "Something went wrong, please try again"; the website still renders with an empty-shelf message.

---

## File structure

| File | Responsibility |
|---|---|
| `scripts/book-club.gs` | Apps Script: creates the sheet; `doPost` API (read / upsert / delete) with secret + lock + audit log |
| `src/lib/bookclub/types.ts` | Member, Book, Borrow, Session types |
| `src/lib/bookclub/rows.ts` (+test) | Column order per tab; object ⇄ row |
| `src/lib/bookclub/rules.ts` (+test) | matchKey, duplicates, ids, availability, borrow transitions, payouts, reminders |
| `src/lib/bookclub/flow.ts` (+test) | `/start` join and `/add` conversations as a pure step machine |
| `src/lib/bookclub/store.ts` | Calls the Apps Script API |
| `src/lib/bookclub/bot.ts` | grammY handlers wiring everything together |
| `src/lib/bookclub/shelf.ts` | Cached public shelf for the website |
| `src/app/api/telegram/route.ts` | Webhook endpoint |
| `src/app/api/telegram/cron/route.ts` | Daily reminders |
| `src/app/api/covers/[id]/route.ts` | Serves a book's Telegram photo without exposing the token |
| `src/components/Shelf.tsx` | Client: shelf grid + search |
| `src/app/book-club/page.tsx` | Adds the shelf; button switches to Telegram |
| `vercel.json` | Cron schedule |
| `scripts/telegram-setup.mjs` | One-off: set webhook, commands, descriptions |
| `docs/book-club-setup.md` | Step-by-step setup for the team |

---

### Task 1: Apps Script sheet API

**Files:** Create `scripts/book-club.gs`

**Interfaces:**
- Produces: HTTP POST JSON `{ secret, op: "read" }` → `{ Members: string[][], Books: string[][], Borrows: string[][], Sessions: string[][] }` (rows without header); `{ secret, op: "upsert", tab, id, row: string[] }` → `{ ok: true }` (replaces the row whose column A equals `id`, else appends); `{ secret, op: "delete", tab, id }` → `{ ok: true }`. Wrong secret → `{ error: "forbidden" }`.

- [ ] **Step 1: Write the script**

```js
/**
 * Story Lab Book Club — the Google Sheet and the small API the Telegram bot uses.
 *
 * Setup (signed in as storylabkid@gmail.com):
 *   1. https://script.google.com/create → paste this file → Save.
 *   2. Select `setupBookClub` → Run → approve. The log prints the sheet link and BOOKCLUB_SCRIPT_SECRET.
 *   3. Deploy → New deployment → type "Web app" → Execute as: Me → Who has access: Anyone → Deploy.
 *      Copy the Web app URL → that is BOOKCLUB_SCRIPT_URL.
 */

const TABS = {
  Members: ["telegramId", "name", "flat", "phone", "childName", "status", "joinedAt"],
  Books: ["id", "title", "author", "matchKey", "condition", "photoFileId", "ownerId", "status", "addedAt"],
  Borrows: ["id", "bookId", "borrowerId", "requestedAt", "paidAt", "dueAt", "returnedAt", "ownerPaidAt", "state"],
  Sessions: ["telegramId", "flow", "step", "draft"],
  Log: ["at", "op", "tab", "data"],
};
const DATA_TABS = ["Members", "Books", "Borrows", "Sessions"];

function setupBookClub() {
  const ss = SpreadsheetApp.create("Story Lab Book Club");
  Object.keys(TABS).forEach(function (name, i) {
    const sh = i === 0 ? ss.getSheets()[0].setName(name) : ss.insertSheet(name);
    sh.getRange("A:Z").setNumberFormat("@"); // keep ids and phone numbers as text
    sh.getRange(1, 1, 1, TABS[name].length).setValues([TABS[name]]).setFontWeight("bold");
    sh.setFrozenRows(1);
  });
  const secret = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperties({ SHEET_ID: ss.getId(), SECRET: secret });
  Logger.log("Sheet: " + ss.getUrl() + "\nBOOKCLUB_SCRIPT_SECRET=" + secret);
}

function doPost(e) {
  const req = JSON.parse(e.postData.contents);
  const props = PropertiesService.getScriptProperties();
  if (!req.secret || req.secret !== props.getProperty("SECRET")) return json_({ error: "forbidden" });
  const ss = SpreadsheetApp.openById(props.getProperty("SHEET_ID"));

  if (req.op === "read") {
    const out = {};
    DATA_TABS.forEach(function (t) {
      const values = ss.getSheetByName(t).getDataRange().getDisplayValues();
      out[t] = values.slice(1).filter(function (r) { return r[0] !== ""; });
    });
    return json_(out);
  }

  if (DATA_TABS.indexOf(req.tab) === -1) return json_({ error: "bad-tab" });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = ss.getSheetByName(req.tab);
    const ids = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getDisplayValues().map(function (r) { return r[0]; });
    const at = ids.indexOf(String(req.id)); // 0 is the header row
    if (req.op === "upsert") {
      if (at > 0) sh.getRange(at + 1, 1, 1, req.row.length).setValues([req.row]);
      else sh.appendRow(req.row);
    } else if (req.op === "delete") {
      if (at > 0) sh.deleteRow(at + 1);
    } else {
      return json_({ error: "bad-op" });
    }
    if (req.tab !== "Sessions") {
      ss.getSheetByName("Log").appendRow([new Date().toISOString(), req.op, req.tab, JSON.stringify(req.row || req.id)]);
    }
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/book-club.gs
git commit -m "Book Club: Google Sheet and Apps Script API for the bot"
```

(Verified end-to-end in Task 8 once deployed by the team.)

---

### Task 2: Types and row mapping

**Files:** Create `src/lib/bookclub/types.ts`, `src/lib/bookclub/rows.ts`, `src/lib/bookclub/rows.test.ts`

**Interfaces:**
- Produces: types below; `columns: Record<Tab, readonly string[]>`; `fromRow<T>(tab: Tab, row: string[]): T`; `toRow(tab: Tab, obj: object): string[]`; `type Tab = "Members" | "Books" | "Borrows" | "Sessions"`.

- [ ] **Step 1: `types.ts`**

```ts
export type MemberStatus = "pending" | "approved" | "declined";
export type Member = {
  telegramId: string;
  name: string;
  flat: string;
  phone: string;
  childName: string;
  status: MemberStatus;
  joinedAt: string;
};

export type BookStatus = "pending" | "listed" | "rejected";
export type Book = {
  id: string;
  title: string;
  author: string;
  matchKey: string;
  condition: string;
  photoFileId: string;
  ownerId: string;
  status: BookStatus;
  addedAt: string;
};

export type BorrowState = "requested" | "out" | "returned" | "cancelled";
export type Borrow = {
  id: string;
  bookId: string;
  borrowerId: string;
  requestedAt: string;
  paidAt: string;
  dueAt: string;
  returnedAt: string;
  ownerPaidAt: string;
  state: BorrowState;
};

export type Flow = "join" | "add";
export type Session = { telegramId: string; flow: Flow; step: string; draft: Record<string, string> };
```

- [ ] **Step 2: Failing test `rows.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { fromRow, toRow } from "@/lib/bookclub/rows";
import type { Book, Session } from "@/lib/bookclub/types";

const book: Book = {
  id: "B001", title: "Wonder", author: "R.J. Palacio", matchKey: "wonder|rj palacio", condition: "Good",
  photoFileId: "", ownerId: "42", status: "listed", addedAt: "2026-10-14T10:00:00.000Z",
};

describe("rows", () => {
  it("round-trips a book in column order", () => {
    const row = toRow("Books", book);
    expect(row[0]).toBe("B001");
    expect(row).toHaveLength(9);
    expect(fromRow<Book>("Books", row)).toEqual(book);
  });

  it("stores a session draft as JSON", () => {
    const s: Session = { telegramId: "42", flow: "add", step: "author", draft: { title: "Wonder" } };
    const row = toRow("Sessions", s);
    expect(row[3]).toBe('{"title":"Wonder"}');
    expect(fromRow<Session>("Sessions", row)).toEqual(s);
  });

  it("fills missing trailing cells with empty strings", () => {
    expect(fromRow<Book>("Books", ["B002", "Holes"]).status).toBe("");
  });
});
```

Run: `npm test` — Expected: FAIL (`Cannot find module '@/lib/bookclub/rows'`).

- [ ] **Step 3: `rows.ts`**

```ts
// Column order of each sheet tab — must match TABS in scripts/book-club.gs.
export type Tab = "Members" | "Books" | "Borrows" | "Sessions";

export const columns: Record<Tab, readonly string[]> = {
  Members: ["telegramId", "name", "flat", "phone", "childName", "status", "joinedAt"],
  Books: ["id", "title", "author", "matchKey", "condition", "photoFileId", "ownerId", "status", "addedAt"],
  Borrows: ["id", "bookId", "borrowerId", "requestedAt", "paidAt", "dueAt", "returnedAt", "ownerPaidAt", "state"],
  Sessions: ["telegramId", "flow", "step", "draft"],
};

const json = new Set(["draft"]);

export function fromRow<T>(tab: Tab, row: string[]): T {
  const obj: Record<string, unknown> = {};
  columns[tab].forEach((key, i) => {
    const cell = row[i] ?? "";
    obj[key] = json.has(key) ? (cell ? JSON.parse(cell) : {}) : cell;
  });
  return obj as T;
}

export function toRow(tab: Tab, obj: object): string[] {
  const rec = obj as Record<string, unknown>;
  return columns[tab].map((key) => (json.has(key) ? JSON.stringify(rec[key] ?? {}) : String(rec[key] ?? "")));
}
```

Run: `npm test` — Expected: PASS.

- [ ] **Step 4: Commit** — `git add src/lib/bookclub && git commit -m "Book Club: types and sheet row mapping"`

---

### Task 3: Rules

**Files:** Create `src/lib/bookclub/rules.ts`, `src/lib/bookclub/rules.test.ts`

**Interfaces:**
- Consumes: types (Task 2).
- Produces:
  - `matchKey(title: string, author: string): string`
  - `findDuplicate(books: Book[], key: string): Book | undefined` — pending or listed only
  - `nextId(prefix: "B" | "L", ids: string[]): string`
  - `bookState(bookId: string, borrows: Borrow[]): "available" | "requested" | "out"`
  - `canRequest(memberId: string, bookId: string, books: Book[], borrows: Borrow[]): { ok: true } | { ok: false; reason: "not-listed" | "book-taken" | "has-active" }`
  - `pay(b: Borrow, now: Date, loanDays: number): Borrow`, `returnBook(b: Borrow, now: Date): Borrow`, `cancel(b: Borrow): Borrow` — throw `Error("bad-state")` on an invalid transition
  - `payouts(borrows: Borrow[], books: Book[], share: number): { ownerId: string; borrows: number; earned: number; paid: number; owed: number }[]`
  - `reminders(borrows: Borrow[], now: Date): { dueSoon: Borrow[]; overdue: Borrow[] }`

- [ ] **Step 1: Failing tests `rules.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import {
  bookState, canRequest, cancel, findDuplicate, matchKey, nextId, pay, payouts, reminders, returnBook,
} from "@/lib/bookclub/rules";
import type { Book, Borrow } from "@/lib/bookclub/types";

const book = (id: string, over: Partial<Book> = {}): Book => ({
  id, title: "T", author: "A", matchKey: id, condition: "Good", photoFileId: "", ownerId: "owner", status: "listed",
  addedAt: "", ...over,
});
const borrow = (id: string, over: Partial<Borrow> = {}): Borrow => ({
  id, bookId: "B001", borrowerId: "kid", requestedAt: "2026-10-01T00:00:00.000Z", paidAt: "", dueAt: "",
  returnedAt: "", ownerPaidAt: "", state: "requested", ...over,
});
const now = new Date("2026-10-14T03:30:00.000Z");

describe("matchKey", () => {
  it("ignores case, punctuation, extra spaces and a leading article", () => {
    expect(matchKey("The Hobbit", "J.R.R. Tolkien")).toBe(matchKey("  hobbit ", "JRR  Tolkien"));
    expect(matchKey("Wonder", "R. J. Palacio")).toBe("wonder|r j palacio");
  });
  it("keeps different authors apart", () => {
    expect(matchKey("Matilda", "Roald Dahl")).not.toBe(matchKey("Matilda", "Someone Else"));
  });
});

describe("findDuplicate", () => {
  it("finds pending or listed books, not rejected ones", () => {
    const books = [book("B001", { matchKey: "k", status: "rejected" }), book("B002", { matchKey: "k", status: "pending" })];
    expect(findDuplicate(books, "k")?.id).toBe("B002");
    expect(findDuplicate([book("B003", { matchKey: "k", status: "rejected" })], "k")).toBeUndefined();
  });
});

describe("nextId", () => {
  it("counts up from the highest id", () => {
    expect(nextId("B", [])).toBe("B001");
    expect(nextId("B", ["B001", "B009", "B004"])).toBe("B010");
    expect(nextId("L", ["L099"])).toBe("L100");
  });
});

describe("availability", () => {
  it("is out while paid and not returned, requested while waiting for payment", () => {
    expect(bookState("B001", [])).toBe("available");
    expect(bookState("B001", [borrow("L1")])).toBe("requested");
    expect(bookState("B001", [borrow("L1", { state: "out" })])).toBe("out");
    expect(bookState("B001", [borrow("L1", { state: "returned" }), borrow("L2", { state: "cancelled" })])).toBe("available");
  });

  it("allows one open request per book and one book per member", () => {
    const books = [book("B001"), book("B002"), book("B003", { status: "pending" })];
    expect(canRequest("kid", "B001", books, [])).toEqual({ ok: true });
    expect(canRequest("kid", "B003", books, [])).toEqual({ ok: false, reason: "not-listed" });
    expect(canRequest("other", "B001", books, [borrow("L1")])).toEqual({ ok: false, reason: "book-taken" });
    expect(canRequest("kid", "B002", books, [borrow("L1", { state: "out" })])).toEqual({ ok: false, reason: "has-active" });
  });
});

describe("borrow transitions", () => {
  it("pay sets paid and due dates once", () => {
    const paid = pay(borrow("L1"), now, 7);
    expect(paid.state).toBe("out");
    expect(paid.paidAt).toBe(now.toISOString());
    expect(paid.dueAt).toBe("2026-10-21T03:30:00.000Z");
    expect(() => pay(paid, now, 7)).toThrow("bad-state");
  });
  it("return only from out; cancel only from requested", () => {
    expect(() => returnBook(borrow("L1"), now)).toThrow("bad-state");
    expect(returnBook(borrow("L1", { state: "out" }), now).state).toBe("returned");
    expect(cancel(borrow("L1")).state).toBe("cancelled");
    expect(() => cancel(borrow("L1", { state: "out" }))).toThrow("bad-state");
  });
});

describe("payouts", () => {
  it("earns per paid borrow and subtracts what was paid out", () => {
    const books = [book("B001", { ownerId: "o1" }), book("B002", { ownerId: "o2" })];
    const borrows = [
      borrow("L1", { state: "returned", paidAt: "x", ownerPaidAt: "y" }),
      borrow("L2", { state: "out", paidAt: "x" }),
      borrow("L3", { bookId: "B002", state: "requested" }),
    ];
    expect(payouts(borrows, books, 20)).toEqual([{ ownerId: "o1", borrows: 2, earned: 40, paid: 20, owed: 20 }]);
  });
});

describe("reminders", () => {
  it("splits out borrows into due within a day and overdue", () => {
    const soon = borrow("L1", { state: "out", dueAt: "2026-10-14T20:00:00.000Z" });
    const late = borrow("L2", { state: "out", dueAt: "2026-10-13T20:00:00.000Z" });
    const later = borrow("L3", { state: "out", dueAt: "2026-10-18T20:00:00.000Z" });
    const back = borrow("L4", { state: "returned", dueAt: "2026-10-13T20:00:00.000Z" });
    const r = reminders([soon, late, later, back], now);
    expect(r.dueSoon.map((b) => b.id)).toEqual(["L1"]);
    expect(r.overdue.map((b) => b.id)).toEqual(["L2"]);
  });
});
```

Run: `npm test` — Expected: FAIL (module not found).

- [ ] **Step 2: `rules.ts`**

```ts
import type { Book, Borrow } from "@/lib/bookclub/types";

const DAY = 24 * 60 * 60 * 1000;

const norm = (s: string) =>
  s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

// "The Hobbit" by "J.R.R. Tolkien" and "hobbit" by "JRR Tolkien" are the same book.
export function matchKey(title: string, author: string): string {
  const t = norm(title).replace(/^(the|a|an) /, "");
  const a = norm(author.replace(/\.(?=\S)/g, "").replace(/\./g, " "));
  return `${t}|${a}`;
}

export function findDuplicate(books: Book[], key: string): Book | undefined {
  return books.find((b) => b.matchKey === key && (b.status === "pending" || b.status === "listed"));
}

export function nextId(prefix: "B" | "L", ids: string[]): string {
  const max = Math.max(0, ...ids.filter((id) => id.startsWith(prefix)).map((id) => Number(id.slice(1)) || 0));
  return prefix + String(max + 1).padStart(3, "0");
}

const open = (b: Borrow) => b.state === "requested" || b.state === "out";

export function bookState(bookId: string, borrows: Borrow[]): "available" | "requested" | "out" {
  const current = borrows.find((b) => b.bookId === bookId && open(b));
  return current ? (current.state as "requested" | "out") : "available";
}

export function canRequest(
  memberId: string,
  bookId: string,
  books: Book[],
  borrows: Borrow[],
): { ok: true } | { ok: false; reason: "not-listed" | "book-taken" | "has-active" } {
  if (!books.some((b) => b.id === bookId && b.status === "listed")) return { ok: false, reason: "not-listed" };
  if (borrows.some((b) => b.borrowerId === memberId && open(b))) return { ok: false, reason: "has-active" };
  if (bookState(bookId, borrows) !== "available") return { ok: false, reason: "book-taken" };
  return { ok: true };
}

function expect(b: Borrow, state: Borrow["state"]) {
  if (b.state !== state) throw new Error("bad-state");
}

export function pay(b: Borrow, now: Date, loanDays: number): Borrow {
  expect(b, "requested");
  return { ...b, state: "out", paidAt: now.toISOString(), dueAt: new Date(now.getTime() + loanDays * DAY).toISOString() };
}

export function returnBook(b: Borrow, now: Date): Borrow {
  expect(b, "out");
  return { ...b, state: "returned", returnedAt: now.toISOString() };
}

export function cancel(b: Borrow): Borrow {
  expect(b, "requested");
  return { ...b, state: "cancelled" };
}

export function payouts(borrows: Borrow[], books: Book[], share: number) {
  const owner = new Map(books.map((b) => [b.id, b.ownerId]));
  const rows = new Map<string, { ownerId: string; borrows: number; earned: number; paid: number; owed: number }>();
  for (const b of borrows) {
    if (!b.paidAt) continue;
    const ownerId = owner.get(b.bookId);
    if (!ownerId) continue;
    const r = rows.get(ownerId) ?? { ownerId, borrows: 0, earned: 0, paid: 0, owed: 0 };
    r.borrows += 1;
    r.earned += share;
    if (b.ownerPaidAt) r.paid += share;
    r.owed = r.earned - r.paid;
    rows.set(ownerId, r);
  }
  return [...rows.values()];
}

export function reminders(borrows: Borrow[], now: Date) {
  const out = borrows.filter((b) => b.state === "out" && b.dueAt);
  const t = now.getTime();
  return {
    dueSoon: out.filter((b) => {
      const due = Date.parse(b.dueAt);
      return due > t && due <= t + DAY;
    }),
    overdue: out.filter((b) => Date.parse(b.dueAt) <= t),
  };
}
```

Run: `npm test` — Expected: PASS. If `matchKey` cases fail, adjust normalisation (not the tests) until "J.R.R." ≡ "JRR" and "R. J." → "r j".

- [ ] **Step 3: Commit** — `git add src/lib/bookclub && git commit -m "Book Club: borrowing rules, duplicates and payouts"`

---

### Task 4: Conversations

**Files:** Create `src/lib/bookclub/flow.ts`, `src/lib/bookclub/flow.test.ts`

**Interfaces:**
- Consumes: `Session` (Task 2).
- Produces:
  - `type Input = { kind: "text"; text: string } | { kind: "contact"; phone: string } | { kind: "photo"; fileId: string } | { kind: "skip" }`
  - `type Ask = { text: string; options?: string[]; contact?: boolean; skippable?: boolean }`
  - `type Step = { session: Session | null; ask?: Ask; error?: string; done?: { flow: Flow; draft: Record<string, string> } }`
  - `startJoin(telegramId: string): Step`, `startAdd(telegramId: string): Step`, `advance(session: Session, input: Input): Step`
  - `CONDITIONS = ["Like new", "Good", "Well-loved"]`

- [ ] **Step 1: Failing test `flow.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { advance, startAdd, startJoin, type Step } from "@/lib/bookclub/flow";

const go = (s: Step, ...inputs: Parameters<typeof advance>[1][]) =>
  inputs.reduce<Step>((step, input) => advance(step.session!, input), s);

describe("join", () => {
  it("asks name, flat, child (skippable), then phone via contact", () => {
    const s = go(startJoin("42"), { kind: "text", text: "Riya Sharma" }, { kind: "text", text: "1204" }, { kind: "skip" });
    expect(s.ask?.contact).toBe(true);
    const done = advance(s.session!, { kind: "contact", phone: "+919800000000" });
    expect(done.session).toBeNull();
    expect(done.done).toEqual({ flow: "join", draft: { name: "Riya Sharma", flat: "1204", childName: "", phone: "+919800000000" } });
  });

  it("re-asks on empty or too-long text without moving on", () => {
    const s = startJoin("42");
    const bad = advance(s.session!, { kind: "text", text: "   " });
    expect(bad.error).toBeTruthy();
    expect(bad.session?.step).toBe("name");
    expect(advance(s.session!, { kind: "text", text: "x".repeat(121) }).session?.step).toBe("name");
  });

  it("only accepts a contact at the phone step", () => {
    const s = go(startJoin("42"), { kind: "text", text: "Riya" }, { kind: "text", text: "1204" }, { kind: "text", text: "Aarav" });
    expect(advance(s.session!, { kind: "text", text: "98000" }).session?.step).toBe("phone");
  });
});

describe("add", () => {
  it("asks title, author, condition (options), photo (skippable)", () => {
    const s = go(startAdd("42"), { kind: "text", text: "Wonder" }, { kind: "text", text: "R.J. Palacio" });
    expect(s.ask?.options).toEqual(["Like new", "Good", "Well-loved"]);
    const bad = advance(s.session!, { kind: "text", text: "Amazing" });
    expect(bad.session?.step).toBe("condition");
    const photo = go(s, { kind: "text", text: "Good" });
    expect(photo.ask?.skippable).toBe(true);
    const done = advance(photo.session!, { kind: "photo", fileId: "AgAC123" });
    expect(done.done).toEqual({ flow: "add", draft: { title: "Wonder", author: "R.J. Palacio", condition: "Good", photoFileId: "AgAC123" } });
  });

  it("skipping the photo finishes with an empty photo", () => {
    const s = go(startAdd("42"), { kind: "text", text: "Holes" }, { kind: "text", text: "Louis Sachar" }, { kind: "text", text: "Good" });
    expect(advance(s.session!, { kind: "skip" }).done?.draft.photoFileId).toBe("");
  });

  it("rejects skip on a step that isn't skippable", () => {
    expect(advance(startAdd("42").session!, { kind: "skip" }).session?.step).toBe("title");
  });
});
```

Run: `npm test` — Expected: FAIL (module not found).

- [ ] **Step 2: `flow.ts`**

```ts
// The two multi-step chats — joining and adding a book — as a pure step machine.
import type { Flow, Session } from "@/lib/bookclub/types";

export const CONDITIONS = ["Like new", "Good", "Well-loved"];

export type Input =
  | { kind: "text"; text: string }
  | { kind: "contact"; phone: string }
  | { kind: "photo"; fileId: string }
  | { kind: "skip" };
export type Ask = { text: string; options?: string[]; contact?: boolean; skippable?: boolean };
export type Step = { session: Session | null; ask?: Ask; error?: string; done?: { flow: Flow; draft: Record<string, string> } };

type Field = { key: string; ask: Ask; accept: "text" | "contact" | "photo"; max?: number; options?: string[] };

const flows: Record<Flow, Field[]> = {
  join: [
    { key: "name", accept: "text", max: 60, ask: { text: "Welcome to the Story Lab Book Club! 📚 What's your name? (parent's name)" } },
    { key: "flat", accept: "text", max: 20, ask: { text: "Your flat number?" } },
    { key: "childName", accept: "text", max: 40, ask: { text: "Your child's first name? (optional)", skippable: true } },
    { key: "phone", accept: "contact", ask: { text: "Last step — tap the button below to share your phone number.", contact: true } },
  ],
  add: [
    { key: "title", accept: "text", max: 120, ask: { text: "What's the book's title?" } },
    { key: "author", accept: "text", max: 80, ask: { text: "Who wrote it?" } },
    { key: "condition", accept: "text", options: CONDITIONS, ask: { text: "What condition is it in?", options: CONDITIONS } },
    { key: "photoFileId", accept: "photo", ask: { text: "Send a photo of the cover (or skip).", skippable: true } },
  ],
};

function at(flow: Flow, draft: Record<string, string>, telegramId: string, i: number): Step {
  const fields = flows[flow];
  if (i >= fields.length) return { session: null, done: { flow, draft } };
  const f = fields[i];
  return { session: { telegramId, flow, step: f.key, draft }, ask: f.ask };
}

export const startJoin = (telegramId: string) => at("join", {}, telegramId, 0);
export const startAdd = (telegramId: string) => at("add", {}, telegramId, 0);

export function advance(session: Session, input: Input): Step {
  const fields = flows[session.flow];
  const i = fields.findIndex((f) => f.key === session.step);
  const f = fields[i];
  const again = (error: string): Step => ({ session, ask: f.ask, error });

  let value: string;
  if (input.kind === "skip") {
    if (!f.ask.skippable) return again("This one is needed — please answer.");
    value = "";
  } else if (f.accept === "contact") {
    if (input.kind !== "contact") return again("Please use the “Share my phone number” button.");
    value = input.phone;
  } else if (f.accept === "photo") {
    if (input.kind !== "photo") return again("Please send a photo, or tap Skip.");
    value = input.fileId;
  } else {
    if (input.kind !== "text") return again("Please type your answer.");
    value = input.text.trim().replace(/\s+/g, " ");
    if (!value) return again("Please type your answer.");
    if (f.max && value.length > f.max) return again(`That's a bit long — please keep it under ${f.max} characters.`);
    if (f.options && !f.options.includes(value)) return again("Please pick one of the buttons.");
  }
  return at(session.flow, { ...session.draft, [f.key]: value }, session.telegramId, i + 1);
}
```

Run: `npm test` — Expected: PASS.

- [ ] **Step 3: Commit** — `git add src/lib/bookclub && git commit -m "Book Club: join and add-book conversations"`

---

### Task 5: Store + bot + webhook

**Files:**
- Modify: `package.json` (grammY)
- Create: `src/lib/bookclub/store.ts`, `src/lib/bookclub/bot.ts`, `src/app/api/telegram/route.ts`

**Interfaces:**
- Consumes: Tasks 2–4.
- Produces:
  - `store.readAll(): Promise<{ members: Member[]; books: Book[]; borrows: Borrow[]; sessions: Session[] }>`; `store.save(tab: Tab, obj: object): Promise<void>`; `store.remove(tab: Tab, id: string): Promise<void>`
  - `createBot(token: string): Bot`
  - `POST /api/telegram`

- [ ] **Step 1: Install** — `npm install grammy@1.46.0`

- [ ] **Step 2: `store.ts`**

```ts
// Reads and writes the Book Club sheet through its Apps Script web app (scripts/book-club.gs).
import { columns, fromRow, toRow, type Tab } from "@/lib/bookclub/rows";
import type { Book, Borrow, Member, Session } from "@/lib/bookclub/types";

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const url = process.env.BOOKCLUB_SCRIPT_URL;
  const secret = process.env.BOOKCLUB_SCRIPT_SECRET;
  if (!url || !secret) throw new Error("Book Club sheet is not configured");
  const res = await fetch(url, { method: "POST", body: JSON.stringify({ secret, ...body }), redirect: "follow", cache: "no-store" });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok || data.error) throw new Error(`Sheet ${String(body.op)} failed: ${data.error ?? res.status}`);
  return data;
}

export async function readAll() {
  const raw = await call<Record<Tab, string[][]>>({ op: "read" });
  const rows = <T>(tab: Tab) => (raw[tab] ?? []).map((r) => fromRow<T>(tab, r));
  return {
    members: rows<Member>("Members"),
    books: rows<Book>("Books"),
    borrows: rows<Borrow>("Borrows"),
    sessions: rows<Session>("Sessions"),
  };
}

export async function save(tab: Tab, obj: object) {
  const row = toRow(tab, obj);
  await call({ op: "upsert", tab, id: row[0], row });
}

export async function remove(tab: Tab, id: string) {
  await call({ op: "delete", tab, id });
}

export const keyOf = (tab: Tab) => columns[tab][0];
```

- [ ] **Step 3: `bot.ts`**

```ts
// Story Lab Book Club bot. Parents chat privately; Story Lab acts from the team group.
import { Bot, InlineKeyboard, Keyboard, type Context } from "grammy";
import { revalidateTag } from "next/cache";
import { advance, startAdd, startJoin, type Input, type Step } from "@/lib/bookclub/flow";
import { bookState, canRequest, cancel, findDuplicate, matchKey, nextId, pay, payouts, reminders, returnBook } from "@/lib/bookclub/rules";
import * as store from "@/lib/bookclub/store";
import type { Book, Borrow, Member } from "@/lib/bookclub/types";
import { site } from "@/lib/site";

const { price, ownerShare, loanDays } = site.bookClub;
const PAGE = 5;
type Data = Awaited<ReturnType<typeof store.readAll>>;

const cfg = () => ({
  team: process.env.TELEGRAM_TEAM_CHAT_ID ?? "",
  channel: process.env.TELEGRAM_CHANNEL_ID ?? "",
  upi: process.env.UPI_ID ?? "",
});
const date = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const who = (m?: Member) => (m ? `${m.name}, Flat ${m.flat}` : "someone");
const shelfChanged = () => revalidateTag("shelf", "max");

const HELP = [
  "📚 Story Lab Book Club",
  "/shelf — browse and borrow",
  "/add — share a novel",
  "/mybooks — your books and earnings",
  "/borrowed — what you have out",
  "/cancel — stop what you're doing",
].join("\n");

export function createBot(token: string) {
  const bot = new Bot(token);
  const dm = bot.chatType("private");
  const team = bot.filter((ctx) => String(ctx.chat?.id) === cfg().team);

  // In any group: tells the team the chat id to put in TELEGRAM_TEAM_CHAT_ID.
  bot.chatType(["group", "supergroup"]).command("chatid", (ctx) => ctx.reply(`Chat ID: ${ctx.chat.id}`));

  // ---------- conversations ----------

  async function show(ctx: Context, step: Step) {
    if (step.session) await store.save("Sessions", step.session);
    else await store.remove("Sessions", String(ctx.from!.id));
    if (step.done) return finish(ctx, step.done);
    const a = step.ask!;
    const text = step.error ? `${step.error}\n\n${a.text}` : a.text;
    if (a.contact) {
      return ctx.reply(text, { reply_markup: new Keyboard().requestContact("📱 Share my phone number").resized().oneTime() });
    }
    const kb = new InlineKeyboard();
    a.options?.forEach((o) => kb.text(o, `cd:${o}`));
    if (a.skippable) kb.text("Skip", "sk");
    return ctx.reply(text, a.options || a.skippable ? { reply_markup: kb } : { reply_markup: { remove_keyboard: true } });
  }

  async function step(ctx: Context, input: Input) {
    const id = String(ctx.from!.id);
    const data = await store.readAll();
    const session = data.sessions.find((s) => s.telegramId === id);
    if (!session) return ctx.reply(HELP);
    const next = advance(session, input);
    // Duplicate check as soon as we know title + author.
    if (session.flow === "add" && session.step === "author" && !next.error) {
      const dup = findDuplicate(data.books, matchKey(next.session!.draft.title, next.session!.draft.author));
      if (dup) {
        await store.remove("Sessions", id);
        return ctx.reply(`We already have “${dup.title}” listed — thank you! Do you have another novel to share? Send /add.`);
      }
    }
    return show(ctx, next);
  }

  async function finish(ctx: Context, done: NonNullable<Step["done"]>) {
    const id = String(ctx.from!.id);
    const d = done.draft;
    if (done.flow === "join") {
      const m: Member = { telegramId: id, name: d.name, flat: d.flat, phone: d.phone, childName: d.childName, status: "pending", joinedAt: new Date().toISOString() };
      await store.save("Members", m);
      await ctx.reply("Thanks! Story Lab will approve you shortly — we'll message you here. 🙂", { reply_markup: { remove_keyboard: true } });
      return ctx.api.sendMessage(cfg().team, `🙋 New member: ${who(m)}${m.childName ? ` (child: ${m.childName})` : ""} · ${m.phone}`, {
        reply_markup: new InlineKeyboard().text("✅ Approve", `t:ma:${id}`).text("❌ Decline", `t:md:${id}`),
      });
    }
    const data = await store.readAll();
    const key = matchKey(d.title, d.author);
    const dup = findDuplicate(data.books, key);
    if (dup) return ctx.reply(`We already have “${dup.title}” listed — thank you! Do you have another novel? Send /add.`);
    const b: Book = {
      id: nextId("B", data.books.map((x) => x.id)), title: d.title, author: d.author, matchKey: key, condition: d.condition,
      photoFileId: d.photoFileId, ownerId: id, status: "pending", addedAt: new Date().toISOString(),
    };
    await store.save("Books", b);
    await ctx.reply(`Thanks! We'll check “${b.title}” and let you know when it's on the shelf.`);
    const owner = data.members.find((m) => m.telegramId === id);
    const caption = `📖 New book ${b.id}: “${b.title}” by ${b.author} (${b.condition}) from ${who(owner)}`;
    const kb = new InlineKeyboard().text("✅ Approve", `t:ba:${b.id}`).text("🚫 Not 10+", `t:br:${b.id}`);
    return b.photoFileId
      ? ctx.api.sendPhoto(cfg().team, b.photoFileId, { caption, reply_markup: kb })
      : ctx.api.sendMessage(cfg().team, caption, { reply_markup: kb });
  }

  // ---------- parents ----------

  async function member(ctx: Context): Promise<{ data: Data; me: Member } | null> {
    const data = await store.readAll();
    const me = data.members.find((m) => m.telegramId === String(ctx.from!.id));
    if (!me) {
      await show(ctx, startJoin(String(ctx.from!.id)));
      return null;
    }
    if (me.status !== "approved") {
      await ctx.reply(me.status === "pending" ? "You're waiting for approval — we'll message you soon." : "Sorry, the Book Club isn't open to you right now.");
      return null;
    }
    return { data, me };
  }

  async function offerBorrow(ctx: Context, data: Data, me: Member, bookId: string) {
    const book = data.books.find((b) => b.id === bookId);
    const check = canRequest(me.telegramId, bookId, data.books, data.borrows);
    if (!book || !check.ok) {
      const why = !check.ok && check.reason === "has-active" ? "You already have a book out or requested — one at a time." : "That book isn't available right now. See /shelf.";
      return ctx.reply(why);
    }
    return ctx.reply(`Borrow “${book.title}” by ${book.author} for one week — ₹${price}?`, {
      reply_markup: new InlineKeyboard().text(`Yes, borrow · ₹${price}`, `bc:${book.id}`),
    });
  }

  dm.command("start", async (ctx) => {
    const ok = await member(ctx);
    if (!ok) return;
    if (ctx.match.startsWith("borrow_")) return offerBorrow(ctx, ok.data, ok.me, ctx.match.slice(7));
    if (ctx.match === "add") return show(ctx, startAdd(ok.me.telegramId));
    return ctx.reply(HELP);
  });
  dm.command("help", (ctx) => ctx.reply(HELP));
  dm.command("cancel", async (ctx) => {
    await store.remove("Sessions", String(ctx.from.id));
    return ctx.reply("Okay, stopped. " + HELP, { reply_markup: { remove_keyboard: true } });
  });
  dm.command("add", async (ctx) => {
    const ok = await member(ctx);
    if (ok) return show(ctx, startAdd(ok.me.telegramId));
  });

  async function shelf(ctx: Context, page: number, edit: boolean) {
    const ok = await member(ctx);
    if (!ok) return;
    const listed = ok.data.books.filter((b) => b.status === "listed");
    const sorted = [...listed].sort((a, b) => Number(bookState(a.id, ok.data.borrows) !== "available") - Number(bookState(b.id, ok.data.borrows) !== "available"));
    const slice = sorted.slice(page * PAGE, page * PAGE + PAGE);
    if (!slice.length) return ctx.reply("The shelf is empty right now — share a novel with /add!");
    const kb = new InlineKeyboard();
    const lines = slice.map((b) => {
      const state = bookState(b.id, ok.data.borrows);
      if (state === "available") kb.text(`Borrow: ${b.title}`, `bw:${b.id}`).row();
      return `${state === "available" ? "🟢" : "⏳"} ${b.title} — ${b.author}`;
    });
    if (page > 0) kb.text("◀ Back", `sh:${page - 1}`);
    if ((page + 1) * PAGE < sorted.length) kb.text("More ▶", `sh:${page + 1}`);
    const text = `📚 The shelf (${listed.length} books) · ₹${price} a week\n\n${lines.join("\n")}`;
    return edit ? ctx.editMessageText(text, { reply_markup: kb }) : ctx.reply(text, { reply_markup: kb });
  }
  dm.command("shelf", (ctx) => shelf(ctx, 0, false));

  dm.command("mybooks", async (ctx) => {
    const ok = await member(ctx);
    if (!ok) return;
    const mine = ok.data.books.filter((b) => b.ownerId === ok.me.telegramId);
    if (!mine.length) return ctx.reply("You haven't shared a book yet — send /add.");
    const lines = mine.map((b) => {
      const out = ok.data.borrows.find((l) => l.bookId === b.id && l.state === "out");
      const status = b.status !== "listed" ? (b.status === "pending" ? "waiting for approval" : "not listed") : out ? `out until ${date(out.dueAt)}` : "on the shelf";
      return `• ${b.title} — ${status}`;
    });
    const p = payouts(ok.data.borrows, ok.data.books, ownerShare).find((r) => r.ownerId === ok.me.telegramId);
    const money = p ? `\n\nEarned ₹${p.earned} · paid ₹${p.paid} · pending ₹${p.owed}` : "";
    return ctx.reply(`Your books:\n${lines.join("\n")}${money}`);
  });

  dm.command("borrowed", async (ctx) => {
    const ok = await member(ctx);
    if (!ok) return;
    const mine = ok.data.borrows.filter((l) => l.borrowerId === ok.me.telegramId && (l.state === "out" || l.state === "requested"));
    if (!mine.length) return ctx.reply("Nothing out right now — browse /shelf.");
    const title = (id: string) => ok.data.books.find((b) => b.id === id)?.title ?? id;
    return ctx.reply(mine.map((l) => `• ${title(l.bookId)} — ${l.state === "out" ? `due ${date(l.dueAt)}` : "waiting for payment"}`).join("\n"));
  });

  dm.on("message:contact", (ctx) => {
    if (ctx.message.contact.user_id !== ctx.from.id) return ctx.reply("Please share your own number using the button.");
    return step(ctx, { kind: "contact", phone: ctx.message.contact.phone_number });
  });

  dm.on("message:photo", async (ctx) => {
    const fileId = ctx.message.photo.at(-1)!.file_id;
    const id = String(ctx.from.id);
    const data = await store.readAll();
    if (data.sessions.some((s) => s.telegramId === id)) return step(ctx, { kind: "photo", fileId });
    // Otherwise treat it as a payment screenshot for their open request.
    const req = data.borrows.find((l) => l.borrowerId === id && l.state === "requested");
    if (!req) return ctx.reply(HELP);
    const me = data.members.find((m) => m.telegramId === id);
    const book = data.books.find((b) => b.id === req.bookId);
    await ctx.api.sendPhoto(cfg().team, fileId, {
      caption: `💳 Payment screenshot from ${who(me)} for “${book?.title}” (${req.id}) · ₹${price}`,
      reply_markup: new InlineKeyboard().text("💰 Paid", `t:lp:${req.id}`).text("✖ Cancel", `t:lc:${req.id}`),
    });
    return ctx.reply("Thanks! We'll confirm and arrange the handover.");
  });

  dm.on("message:text", (ctx) => step(ctx, { kind: "text", text: ctx.message.text }));

  dm.callbackQuery("sk", async (ctx) => {
    await ctx.answerCallbackQuery();
    return step(ctx, { kind: "skip" });
  });
  dm.callbackQuery(/^cd:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    return step(ctx, { kind: "text", text: ctx.match[1] });
  });
  dm.callbackQuery(/^sh:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    return shelf(ctx, Number(ctx.match[1]), true);
  });
  dm.callbackQuery(/^bw:(B\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const ok = await member(ctx);
    if (ok) return offerBorrow(ctx, ok.data, ok.me, ctx.match[1]);
  });
  dm.callbackQuery(/^bc:(B\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const ok = await member(ctx);
    if (!ok) return;
    const bookId = ctx.match[1];
    const check = canRequest(ok.me.telegramId, bookId, ok.data.books, ok.data.borrows);
    if (!check.ok) return ctx.reply(check.reason === "book-taken" ? "Someone just asked for that one — try another from /shelf." : "You already have a book out or requested — one at a time.");
    const book = ok.data.books.find((b) => b.id === bookId)!;
    const l: Borrow = {
      id: nextId("L", ok.data.borrows.map((x) => x.id)), bookId, borrowerId: ok.me.telegramId, requestedAt: new Date().toISOString(),
      paidAt: "", dueAt: "", returnedAt: "", ownerPaidAt: "", state: "requested",
    };
    await store.save("Borrows", l);
    shelfChanged();
    await ctx.editMessageReplyMarkup();
    await ctx.reply(`Great choice! Please pay ₹${price} by UPI to ${cfg().upi} (note: ${l.id}), then send the payment screenshot here.`);
    return ctx.api.sendMessage(cfg().team, `📥 Borrow request ${l.id}: “${book.title}” for ${who(ok.me)} — waiting for payment.`, {
      reply_markup: new InlineKeyboard().text("💰 Paid", `t:lp:${l.id}`).text("✖ Cancel", `t:lc:${l.id}`),
    });
  });

  // ---------- team ----------

  team.callbackQuery(/^t:(ma|md):(\d+)$/, async (ctx) => {
    const data = await store.readAll();
    const m = data.members.find((x) => x.telegramId === ctx.match[2]);
    if (!m || m.status !== "pending") return ctx.answerCallbackQuery("Already handled");
    const approved = ctx.match[1] === "ma";
    await store.save("Members", { ...m, status: approved ? "approved" : "declined" });
    await ctx.answerCallbackQuery(approved ? "Approved" : "Declined");
    await ctx.editMessageText(`${ctx.callbackQuery.message?.text ?? ""}\n→ ${approved ? "✅ approved" : "❌ declined"}`);
    return ctx.api.sendMessage(m.telegramId, approved ? `You're in! 🎉\n\n${HELP}` : "Sorry — we can't add you to the Book Club right now.");
  });

  team.callbackQuery(/^t:(ba|br):(B\d+)$/, async (ctx) => {
    const data = await store.readAll();
    const b = data.books.find((x) => x.id === ctx.match[2]);
    if (!b || b.status !== "pending") return ctx.answerCallbackQuery("Already handled");
    const listed = ctx.match[1] === "ba";
    await store.save("Books", { ...b, status: listed ? "listed" : "rejected" });
    await ctx.answerCallbackQuery(listed ? "Listed" : "Marked not 10+");
    await ctx.editMessageReplyMarkup();
    await ctx.api.sendMessage(b.ownerId, listed ? `“${b.title}” is on the shelf! You'll earn ₹${ownerShare} every time it's borrowed.` : `Thanks for “${b.title}” — it isn't quite right for 10+ readers, so we won't list it. Do you have another?`);
    if (!listed) return;
    shelfChanged();
    const text = `📚 New on the shelf: “${b.title}” by ${b.author} · ₹${price}/week`;
    const kb = new InlineKeyboard().url("Borrow", `https://t.me/${site.bookClub.telegramBot}?start=borrow_${b.id}`);
    return b.photoFileId
      ? ctx.api.sendPhoto(cfg().channel, b.photoFileId, { caption: text, reply_markup: kb })
      : ctx.api.sendMessage(cfg().channel, text, { reply_markup: kb });
  });

  team.callbackQuery(/^t:(lp|lc|lr):(L\d+)$/, async (ctx) => {
    const data = await store.readAll();
    const l = data.borrows.find((x) => x.id === ctx.match[2]);
    if (!l) return ctx.answerCallbackQuery("Not found");
    const book = data.books.find((b) => b.id === l.bookId);
    const action = ctx.match[1];
    let next: Borrow;
    try {
      next = action === "lp" ? pay(l, new Date(), loanDays) : action === "lc" ? cancel(l) : returnBook(l, new Date());
    } catch {
      return ctx.answerCallbackQuery("Already handled");
    }
    await store.save("Borrows", next);
    shelfChanged();
    await ctx.answerCallbackQuery("Done");
    if (action === "lp") {
      await ctx.editMessageReplyMarkup({ reply_markup: new InlineKeyboard().text("📥 Returned", `t:lr:${l.id}`) });
      await ctx.api.sendMessage(l.borrowerId, `Paid ✓ — we'll hand over “${book?.title}”. Please return it by ${date(next.dueAt)}.`);
      if (book) await ctx.api.sendMessage(book.ownerId, `“${book.title}” was just borrowed — +₹${ownerShare} for you! 🎉`);
      return;
    }
    await ctx.editMessageReplyMarkup();
    if (action === "lc") return ctx.api.sendMessage(l.borrowerId, `Your request for “${book?.title}” was cancelled. Browse /shelf for another.`);
    await ctx.api.sendMessage(l.borrowerId, `Thanks for returning “${book?.title}”! Pick your next one with /shelf.`);
    if (book) return ctx.api.sendMessage(cfg().channel, `🔁 Back on the shelf: “${book.title}” by ${book.author}`);
  });

  team.command("payouts", async (ctx) => {
    const data = await store.readAll();
    const owed = payouts(data.borrows, data.books, ownerShare).filter((p) => p.owed > 0);
    if (!owed.length) return ctx.reply("Nobody is owed anything right now. ✓");
    for (const p of owed) {
      const m = data.members.find((x) => x.telegramId === p.ownerId);
      await ctx.reply(`💸 ${who(m)} · ${m?.phone ?? ""} — owed ₹${p.owed}`, {
        reply_markup: new InlineKeyboard().text(`Mark ₹${p.owed} paid`, `t:po:${p.ownerId}`),
      });
    }
  });

  team.callbackQuery(/^t:po:(\d+)$/, async (ctx) => {
    const data = await store.readAll();
    const ownerBooks = new Set(data.books.filter((b) => b.ownerId === ctx.match[1]).map((b) => b.id));
    const unpaid = data.borrows.filter((l) => ownerBooks.has(l.bookId) && l.paidAt && !l.ownerPaidAt);
    if (!unpaid.length) return ctx.answerCallbackQuery("Already paid");
    const at = new Date().toISOString();
    for (const l of unpaid) await store.save("Borrows", { ...l, ownerPaidAt: at });
    await ctx.answerCallbackQuery("Marked paid");
    await ctx.editMessageReplyMarkup();
    return ctx.api.sendMessage(ctx.match[1], `We've sent you ₹${unpaid.length * ownerShare} for your books. Thank you for sharing! 📚`);
  });

  team.command("overdue", async (ctx) => {
    const data = await store.readAll();
    const { overdue } = reminders(data.borrows, new Date());
    if (!overdue.length) return ctx.reply("Nothing overdue. ✓");
    return ctx.reply(overdue.map((l) => `• ${data.books.find((b) => b.id === l.bookId)?.title} — ${who(data.members.find((m) => m.telegramId === l.borrowerId))}, due ${date(l.dueAt)}`).join("\n"));
  });

  // Any team button pressed outside the team chat.
  bot.callbackQuery(/^t:/, (ctx) => ctx.answerCallbackQuery("Only the Story Lab team can do that."));

  bot.catch(async (err) => {
    console.error("[bookclub]", err.error);
    try {
      await err.ctx.reply("Something went wrong — please try again in a minute.");
    } catch {}
  });

  return bot;
}

// Sent by the daily cron.
export async function sendReminders(bot: Bot) {
  const data = await store.readAll();
  const { dueSoon, overdue } = reminders(data.borrows, new Date());
  const title = (l: Borrow) => data.books.find((b) => b.id === l.bookId)?.title ?? l.bookId;
  for (const l of dueSoon) await bot.api.sendMessage(l.borrowerId, `⏰ “${title(l)}” is due back by ${date(l.dueAt)}.`);
  for (const l of overdue) await bot.api.sendMessage(l.borrowerId, `📚 “${title(l)}” was due on ${date(l.dueAt)} — please return it soon.`);
  if (overdue.length) {
    await bot.api.sendMessage(cfg().team, `Overdue today:\n${overdue.map((l) => `• ${title(l)} — ${who(data.members.find((m) => m.telegramId === l.borrowerId))}`).join("\n")}`);
  }
  return { dueSoon: dueSoon.length, overdue: overdue.length };
}
```

- [ ] **Step 4: `src/app/api/telegram/route.ts`**

```ts
import { webhookCallback } from "grammy";
import { createBot } from "@/lib/bookclub/bot";

// Telegram calls this for every message and button press.
export async function POST(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return new Response("Bot not configured", { status: 503 });
  const handle = webhookCallback(createBot(token), "std/http", { secretToken: process.env.TELEGRAM_WEBHOOK_SECRET });
  return handle(req);
}
```

- [ ] **Step 5: Verify** — `npx tsc --noEmit && npm run lint && npm test && npm run build`. Expected: all pass; build lists `ƒ /api/telegram`. If grammY's types reject a call (e.g. `editMessageReplyMarkup()` arguments, `filter` typing), fix to the installed version's signature and ledger the ruling.

- [ ] **Step 6: Commit** — `git add package.json package-lock.json src/lib/bookclub src/app/api/telegram && git commit -m "Book Club: Telegram bot and webhook"`

---

### Task 6: Daily reminders + cover photos

**Files:** Create `src/app/api/telegram/cron/route.ts`, `src/app/api/covers/[id]/route.ts`, `vercel.json`

**Interfaces:**
- Consumes: `createBot`, `sendReminders`, `store.readAll`.
- Produces: `GET /api/telegram/cron` (Vercel Cron, `Authorization: Bearer $CRON_SECRET`); `GET /api/covers/:id` → image bytes for a **listed** book with a photo, else 404.

- [ ] **Step 1: Cron route**

```ts
import { createBot, sendReminders } from "@/lib/bookclub/bot";

// Vercel Cron, 9:00 IST daily (see vercel.json).
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return new Response("Bot not configured", { status: 503 });
  return Response.json(await sendReminders(createBot(token)));
}
```

`vercel.json`:

```json
{
  "crons": [{ "path": "/api/telegram/cron", "schedule": "30 3 * * *" }]
}
```

- [ ] **Step 2: Covers route**

```ts
import * as store from "@/lib/bookclub/store";

// Streams a listed book's cover photo from Telegram so the bot token never reaches the browser.
export async function GET(_req: Request, ctx: RouteContext<"/api/covers/[id]">) {
  const { id } = await ctx.params;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return new Response(null, { status: 404 });
  const { books } = await store.readAll();
  const book = books.find((b) => b.id === id && b.status === "listed" && b.photoFileId);
  if (!book) return new Response(null, { status: 404 });
  const info = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(book.photoFileId)}`).then((r) => r.json());
  if (!info.ok) return new Response(null, { status: 404 });
  const img = await fetch(`https://api.telegram.org/file/bot${token}/${info.result.file_path}`);
  if (!img.ok) return new Response(null, { status: 404 });
  return new Response(img.body, {
    headers: { "Content-Type": img.headers.get("content-type") ?? "image/jpeg", "Cache-Control": "public, max-age=86400, s-maxage=604800" },
  });
}
```

- [ ] **Step 3: Verify** — `npm run build` (both routes listed as `ƒ`), then with `next start` and no env: `curl -i localhost:PORT/api/telegram/cron` → 401; `curl -i -H "authorization: Bearer x" …` with `CRON_SECRET=x` and no token → 503; `curl -i localhost:PORT/api/covers/B001` → 404.

- [ ] **Step 4: Commit** — `git add src/app/api vercel.json && git commit -m "Book Club: daily reminders and cover photos"`

---

### Task 7: Website shelf

**Files:** Create `src/lib/bookclub/shelf.ts`, `src/components/Shelf.tsx`; Modify `src/app/book-club/page.tsx`

**Interfaces:**
- Produces: `getShelf(): Promise<ShelfBook[]>` where `ShelfBook = { id: string; title: string; author: string; available: boolean; hasPhoto: boolean }`; cache tag `"shelf"`.

- [ ] **Step 1: `shelf.ts`**

```ts
import { cacheLife, cacheTag } from "next/cache";
import { bookState } from "@/lib/bookclub/rules";
import * as store from "@/lib/bookclub/store";

export type ShelfBook = { id: string; title: string; author: string; available: boolean; hasPhoto: boolean };

// Public shelf: titles and availability only — never member details.
export async function getShelf(): Promise<ShelfBook[]> {
  "use cache";
  cacheTag("shelf");
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  if (!process.env.BOOKCLUB_SCRIPT_URL) return [];
  try {
    const { books, borrows } = await store.readAll();
    return books
      .filter((b) => b.status === "listed")
      .map((b) => ({ id: b.id, title: b.title, author: b.author, available: bookState(b.id, borrows) === "available", hasPhoto: !!b.photoFileId }))
      .sort((a, b) => Number(b.available) - Number(a.available) || a.title.localeCompare(b.title));
  } catch (e) {
    console.error("[shelf]", e);
    return [];
  }
}
```

- [ ] **Step 2: `Shelf.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { ShelfBook } from "@/lib/bookclub/shelf";

export default function Shelf({ books, bot }: { books: ShelfBook[]; bot: string }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = needle ? books.filter((b) => `${b.title} ${b.author}`.toLowerCase().includes(needle)) : books;
  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search title or author"
        aria-label="Search the shelf"
        className="w-full rounded-full border border-line bg-white px-5 py-3 outline-none focus:border-ink-soft"
      />
      <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {shown.map((b) => (
          <li key={b.id} className="flex flex-col">
            {b.hasPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element -- served by our own route, sizes vary
              <img src={`/api/covers/${b.id}`} alt="" className="aspect-[3/4] w-full rounded-2xl object-cover" loading="lazy" />
            ) : (
              <div className="flex aspect-[3/4] items-center justify-center rounded-2xl bg-lavender p-4 text-center font-display text-lg">{b.title}</div>
            )}
            <p className="mt-2 font-bold leading-snug">{b.title}</p>
            <p className="text-sm text-ink-soft">{b.author}</p>
            {b.available ? (
              <a href={`https://t.me/${bot}?start=borrow_${b.id}`} target="_blank" rel="noopener" className="mt-2 text-sm font-bold underline underline-offset-4">
                Borrow on Telegram
              </a>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">Out now</p>
            )}
          </li>
        ))}
      </ul>
      {!shown.length && <p className="mt-6 text-ink-soft">No books match “{q}”.</p>}
    </div>
  );
}
```

- [ ] **Step 3: Book Club page** — in `src/app/book-club/page.tsx`, make the component `async`, add `import Shelf from "@/components/Shelf"; import { getShelf } from "@/lib/bookclub/shelf";`, and insert before the "How it works" section:

```tsx
      {bookClub.telegramBot && (
        <Section id="shelf" title="On the shelf">
          {books.length > 0 ? (
            <Shelf books={books} bot={bookClub.telegramBot} />
          ) : (
            <p className="text-ink-soft">The shelf is being stocked — be the first to share a novel.</p>
          )}
        </Section>
      )}
```

with `const books = bookClub.telegramBot ? await getShelf() : [];` at the top of the component. Keep the join button logic (switches to Telegram when `telegramBot` is set). Add a second button beside it when the bot is set: `<Button href={`https://t.me/${bookClub.telegramBot}?start=add`}>Add your book</Button>` (wrap both in `<div className="mt-6 flex flex-wrap gap-3">`).

- [ ] **Step 4: Verify** — `npx tsc --noEmit && npm run lint && npm test && npm run build`; with `telegramBot: ""` the page renders exactly as before (no shelf section). Temporarily set `telegramBot: "storylabclub_bot"` locally without sheet env → page shows "The shelf is being stocked"; revert.

- [ ] **Step 5: Commit** — `git add src && git commit -m "Book Club: live shelf on the website"`

---

### Task 8: Setup script, guide, and go-live

**Files:** Create `scripts/telegram-setup.mjs`, `docs/book-club-setup.md`; Modify `src/lib/site.ts` (`telegramBot`) only at the end, after the team confirms the bot works.

- [ ] **Step 1: `scripts/telegram-setup.mjs`**

```js
// One-off: points Telegram at the website and sets the bot's commands and descriptions.
// Run after `vercel env pull .env.local`:  node --env-file=.env.local scripts/telegram-setup.mjs https://www.aikid.in
const site = process.argv[2];
const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
if (!site || !token || !secret) {
  console.error("Usage: node --env-file=.env.local scripts/telegram-setup.mjs https://www.aikid.in (needs TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET)");
  process.exit(1);
}
const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

const steps = [
  ["setWebhook", { url: `${site}/api/telegram`, secret_token: secret, allowed_updates: ["message", "callback_query"], drop_pending_updates: true }],
  ["setMyCommands", { commands: [
    { command: "shelf", description: "Browse and borrow books" },
    { command: "add", description: "Share a novel" },
    { command: "mybooks", description: "Your books and earnings" },
    { command: "borrowed", description: "What you have out" },
    { command: "help", description: "How it works" },
  ] }],
  ["setMyShortDescription", { short_description: "Story Lab Book Club — novels shared between families for readers aged 10+." }],
  ["setMyDescription", { description: "Families share novels their kids have finished; other kids borrow them for a week. Owners earn every time their book is borrowed. Tap Start to join." }],
];
for (const [method, body] of steps) {
  const res = await api(method, body);
  console.log(method, res.ok ? "✓" : res);
}
```

- [ ] **Step 2: `docs/book-club-setup.md`** — the team's checklist:

```markdown
# Book Club bot — setup

1. **Reset the bot token** (it was pasted in chat): @BotFather → /revoke → @storylabclub_bot. Keep the new token private.
2. **Channel and team group** (Telegram):
   - New Channel "Story Lab Book Club", public, link e.g. t.me/storylabbookclub. Add @storylabclub_bot as admin (Post messages).
   - New Group "Story Lab Team" with Neha and Anamika. Add @storylabclub_bot. Send `/chatid` in the group once the bot is live (step 6) and note the number (starts with -100…).
3. **Google Sheet** (as storylabkid@gmail.com): follow the comment at the top of `scripts/book-club.gs` — run `setupBookClub`, then deploy as Web app. Note the Web app URL and the secret from the log.
4. **Vercel env vars** (Project aikid-in-storylab → Settings → Environment Variables, Production + Preview):
   - TELEGRAM_BOT_TOKEN — from step 1
   - TELEGRAM_WEBHOOK_SECRET — any long random text (e.g. from a password generator)
   - TELEGRAM_CHANNEL_ID — `@` + the channel's public username, e.g. `@storylabbookclub`
   - TELEGRAM_TEAM_CHAT_ID — from step 6 (add it then, and redeploy)
   - UPI_ID — the UPI ID borrowers pay to
   - BOOKCLUB_SCRIPT_URL, BOOKCLUB_SCRIPT_SECRET — from step 3
   - CRON_SECRET — any long random text
5. **Deploy**, then run: `vercel env pull .env.local` and `node --env-file=.env.local scripts/telegram-setup.mjs https://www.aikid.in`
6. In the team group send `/chatid` → put the number in TELEGRAM_TEAM_CHAT_ID → redeploy.
7. **Test** with your own phone: /start → join → approve in team group → /add a book → approve → it appears in the channel and on aikid.in/book-club → borrow it → send any photo as "payment" → 💰 Paid → 📥 Returned.
8. Tell Claude it works → `telegramBot: "storylabclub_bot"` goes into `src/lib/site.ts` and the website switches to "Join on Telegram".
```

- [ ] **Step 3: Verify** — `node scripts/telegram-setup.mjs` with no args prints usage and exits 1. Full suite + build green.

- [ ] **Step 4: Commit** — `git add scripts/telegram-setup.mjs docs/book-club-setup.md && git commit -m "Book Club: setup script and team guide"`

- [ ] **Step 5 (after the team completes the guide and the step-7 test passes):** set `telegramBot: "storylabclub_bot"` in `src/lib/site.ts`, build, commit "Book Club: website links to the Telegram bot". Production deploy only with the user's go-ahead.
