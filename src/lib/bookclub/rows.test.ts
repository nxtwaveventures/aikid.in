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

  it("reads a corrupt session draft as empty instead of throwing", () => {
    expect(fromRow<Session>("Sessions", ["42", "add", "author", "{not json"]).draft).toEqual({});
  });

  it("fills missing trailing cells with empty strings", () => {
    expect(fromRow<Book>("Books", ["B002", "Holes"]).status).toBe("");
  });
});
