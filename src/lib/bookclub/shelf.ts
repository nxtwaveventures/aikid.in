import { cacheLife, cacheTag } from "next/cache";
import { bookState } from "@/lib/bookclub/rules";
import * as store from "@/lib/bookclub/store";

export type ShelfBook = { id: string; title: string; author: string; available: boolean; hasPhoto: boolean };

// Throws on failure so a failed read is never stored as an empty shelf.
async function loadShelf(): Promise<ShelfBook[]> {
  "use cache";
  cacheTag("shelf");
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  const { books, borrows } = await store.readAll();
  return books
    .filter((b) => b.status === "listed")
    .map((b) => ({ id: b.id, title: b.title, author: b.author, available: bookState(b.id, borrows) === "available", hasPhoto: !!b.photoFileId }))
    .sort((a, b) => Number(b.available) - Number(a.available) || a.title.localeCompare(b.title));
}

// Public shelf: titles and availability only — never member details.
export async function getShelf(): Promise<ShelfBook[]> {
  if (!process.env.BOOKCLUB_SCRIPT_URL) return [];
  try {
    return await loadShelf();
  } catch (e) {
    console.error("[shelf]", e);
    return [];
  }
}
