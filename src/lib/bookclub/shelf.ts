import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { shelfOrder } from "@/lib/bookclub/rules";
import * as store from "@/lib/bookclub/store";

const TAG = "shelf";

/** Call after any change to what the public shelf shows. */
export const shelfChanged = () => revalidateTag(TAG, "max");

export type ShelfBook = { id: string; title: string; author: string; available: boolean; hasPhoto: boolean };

// Throws on failure so a failed read is never stored as an empty shelf.
async function loadShelf(): Promise<ShelfBook[]> {
  "use cache";
  cacheTag(TAG);
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  const { books, borrows } = await store.readAll();
  return shelfOrder(books, borrows).map(({ book, available }) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    available,
    hasPhoto: !!book.photoFileId,
  }));
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
