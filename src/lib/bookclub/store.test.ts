import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { insert, saveIf } from "@/lib/bookclub/store";

const fetchMock = vi.fn();
const reply = (o: object) => ({ ok: true, status: 200, json: async () => o });

beforeEach(() => {
  process.env.BOOKCLUB_SCRIPT_URL = "https://example.test/exec";
  process.env.BOOKCLUB_SCRIPT_SECRET = "s";
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});
const sent = () => JSON.parse(fetchMock.mock.calls[0][1].body as string);

describe("saveIf", () => {
  it("maps field names to column indexes", async () => {
    fetchMock.mockResolvedValue(reply({ ok: true }));
    const ok = await saveIf("Borrows", { id: "L001", state: "out", ownerPaidAt: "" }, { state: "requested", ownerPaidAt: "" });
    expect(ok).toBe(true);
    expect(sent()).toMatchObject({ op: "upsert", tab: "Borrows", id: "L001", expect: { "8": "requested", "7": "" } });
  });
  it("returns false on conflict", async () => {
    fetchMock.mockResolvedValue(reply({ error: "conflict" }));
    expect(await saveIf("Books", { id: "B001" }, { status: "pending" })).toBe(false);
  });
  it("throws on other errors", async () => {
    fetchMock.mockResolvedValue(reply({ error: "forbidden" }));
    await expect(saveIf("Books", { id: "B001" }, { status: "pending" })).rejects.toThrow();
  });
});

describe("insert", () => {
  it("sends prefix and row, returns the id", async () => {
    fetchMock.mockResolvedValue(reply({ ok: true, id: "B007" }));
    expect(await insert("Books", { title: "T" }, "B")).toBe("B007");
    expect(sent()).toMatchObject({ op: "insert", tab: "Books", prefix: "B" });
    expect(sent().row).toHaveLength(9);
  });
  it("returns null on conflict", async () => {
    fetchMock.mockResolvedValue(reply({ error: "conflict" }));
    expect(await insert("Borrows", { bookId: "B001" }, "L")).toBeNull();
  });
});
