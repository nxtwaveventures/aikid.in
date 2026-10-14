// Column order of each sheet tab — must match TABS in scripts/book-club.gs.
export type Tab = "Members" | "Books" | "Borrows" | "Sessions";

export const columns: Record<Tab, readonly string[]> = {
  Members: ["telegramId", "name", "flat", "phone", "childName", "status", "joinedAt"],
  Books: ["id", "title", "author", "matchKey", "condition", "photoFileId", "ownerId", "status", "addedAt"],
  Borrows: ["id", "bookId", "borrowerId", "requestedAt", "paidAt", "dueAt", "returnedAt", "ownerPaidAt", "state"],
  Sessions: ["telegramId", "flow", "step", "draft"],
};

const json = new Set(["draft"]);

// A hand-edited cell must not take down every read of the sheet.
function parseJson(cell: string) {
  try {
    return JSON.parse(cell);
  } catch {
    return {};
  }
}

export function fromRow<T>(tab: Tab, row: string[]): T {
  const obj: Record<string, unknown> = {};
  columns[tab].forEach((key, i) => {
    const cell = row[i] ?? "";
    obj[key] = json.has(key) ? parseJson(cell) : cell;
  });
  return obj as T;
}

export function toRow(tab: Tab, obj: object): string[] {
  const rec = obj as Record<string, unknown>;
  return columns[tab].map((key) => (json.has(key) ? JSON.stringify(rec[key] ?? {}) : String(rec[key] ?? "")));
}
