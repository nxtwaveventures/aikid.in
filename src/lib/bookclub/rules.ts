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

function requireState(b: Borrow, state: Borrow["state"]) {
  if (b.state !== state) throw new Error("bad-state");
}

export function pay(b: Borrow, now: Date, loanDays: number): Borrow {
  requireState(b, "requested");
  return { ...b, state: "out", paidAt: now.toISOString(), dueAt: new Date(now.getTime() + loanDays * DAY).toISOString() };
}

export function returnBook(b: Borrow, now: Date): Borrow {
  requireState(b, "out");
  return { ...b, state: "returned", returnedAt: now.toISOString() };
}

export function cancel(b: Borrow): Borrow {
  requireState(b, "requested");
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
