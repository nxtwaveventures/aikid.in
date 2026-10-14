// Reads and writes the Book Club sheet through its Apps Script web app (scripts/book-club.gs).
import { columns, fromRow, toRow, type Tab } from "@/lib/bookclub/rows";
import type { Book, Borrow, Member, Session } from "@/lib/bookclub/types";

type Reply = { error?: string; id?: string };

async function call<T extends Reply = Reply>(body: Record<string, unknown>): Promise<T> {
  const url = process.env.BOOKCLUB_SCRIPT_URL;
  const secret = process.env.BOOKCLUB_SCRIPT_SECRET;
  if (!url || !secret) throw new Error("Book Club sheet is not configured");
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify({ secret, ...body }),
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const data = (await res.json()) as T;
  // "conflict" is a normal answer to a guarded write, not a failure.
  if (data.error === "conflict") return data;
  if (!res.ok || data.error) throw new Error(`Sheet ${String(body.op)} failed: ${data.error ?? res.status}`);
  return data;
}

export async function readAll() {
  const raw = await call<Record<Tab, string[][]> & Reply>({ op: "read" });
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

/** Adds a Book or Borrow under a fresh id. Returns the id, or null if the sheet refused (duplicate book / already borrowed). */
export async function insert(tab: "Books" | "Borrows", obj: object, prefix: "B" | "L"): Promise<string | null> {
  const data = await call({ op: "insert", tab, prefix, row: toRow(tab, obj) });
  return data.error === "conflict" ? null : (data.id ?? null);
}

/** Saves only if the row still holds the expected values (keyed by field name). False if it has changed. */
export async function saveIf(tab: Tab, obj: object, expect: Partial<Record<string, string>>): Promise<boolean> {
  const row = toRow(tab, obj);
  const cols = columns[tab];
  const exp: Record<number, string> = {};
  for (const [key, value] of Object.entries(expect)) {
    const i = cols.indexOf(key);
    if (i < 0) throw new Error(`Unknown column ${key} in ${tab}`);
    exp[i] = value ?? "";
  }
  const data = await call({ op: "upsert", tab, id: row[0], row, expect: exp });
  return data.error !== "conflict";
}

export async function remove(tab: Tab, id: string) {
  await call({ op: "delete", tab, id });
}

export const keyOf = (tab: Tab) => columns[tab][0];
