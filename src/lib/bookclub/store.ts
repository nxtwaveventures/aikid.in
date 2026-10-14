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
