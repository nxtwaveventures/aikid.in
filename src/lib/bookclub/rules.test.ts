import { describe, expect, it } from "vitest";
import {
  bookState, canRequest, cancel, findDuplicate, matchKey, pay, payouts, reminders, returnBook, shelfOrder,
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
    expect(matchKey("Wonder", "R. J. Palacio")).toBe("wonder|rj palacio");
  });
  it("treats spaced and unspaced initials as the same author", () => {
    expect(matchKey("Wonder", "R. J. Palacio")).toBe(matchKey("Wonder", "R.J. Palacio"));
    expect(matchKey("Wonder", "R.J. Palacio")).toBe(matchKey("wonder", "RJ Palacio"));
    expect(matchKey("The Hobbit", "J. R. R. Tolkien")).toBe(matchKey("Hobbit", "JRR Tolkien"));
  });
  it("keeps Indic vowel signs so different words do not collide", () => {
    expect(matchKey("किताब", "प्रेमचंद")).not.toBe(matchKey("कोताब", "प्रेमचंद"));
    expect(matchKey("कहानी", "x")).toMatch(/^कहानी\|/);
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

describe("availability", () => {
  it("is out while paid and not returned, requested while waiting for payment", () => {
    expect(bookState("B001", [])).toBe("available");
    expect(bookState("B001", [borrow("L1")])).toBe("requested");
    expect(bookState("B001", [borrow("L1", { state: "out" })])).toBe("out");
    expect(bookState("B001", [borrow("L1", { state: "returned" }), borrow("L2", { state: "cancelled" })])).toBe("available");
  });

  it("orders the shelf: listed books only, available first, then by title", () => {
    const books = [
      book("B001", { title: "Wonder" }),
      book("B002", { title: "Holes" }),
      book("B003", { title: "Matilda" }),
      book("B004", { title: "Alone", status: "pending" }),
    ];
    const shelf = shelfOrder(books, [borrow("L1", { bookId: "B002", state: "out" })]);
    expect(shelf.map(({ book, available }) => [book.title, available])).toEqual([["Matilda", true], ["Wonder", true], ["Holes", false]]);
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
