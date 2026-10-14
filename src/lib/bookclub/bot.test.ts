import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

import { createBot } from "@/lib/bookclub/bot";

describe("createBot", () => {
  it("constructs without network access", () => {
    expect(() => createBot("123:abc")).not.toThrow();
  });

  it("does not throw out of handleUpdate when a handler fails, and tells the user", async () => {
    delete process.env.BOOKCLUB_SCRIPT_URL; // the store throws "not configured"
    vi.spyOn(console, "error").mockImplementation(() => {});
    const bot = createBot("123:abc");
    bot.botInfo = { id: 1, is_bot: true, first_name: "t", username: "t_bot" } as typeof bot.botInfo;
    const calls: { method: string; payload: unknown }[] = [];
    bot.api.config.use(async (_prev, method, payload) => {
      calls.push({ method, payload });
      return { ok: true, result: true } as never;
    });
    await expect(
      bot.handleUpdate({
        update_id: 1,
        message: {
          message_id: 1, date: 0, chat: { id: 5, type: "private", first_name: "P" }, from: { id: 5, is_bot: false, first_name: "P" },
          text: "/shelf", entities: [{ type: "bot_command", offset: 0, length: 6 }],
        },
      }),
    ).resolves.toBeUndefined();
    expect(calls.map((c) => c.method)).toEqual(["sendMessage"]);
    expect(JSON.stringify(calls[0].payload)).toContain("Something went wrong");
  });
});

describe("team borrow writes", () => {
  async function press(data: string, borrow: string[]) {
    process.env.BOOKCLUB_SCRIPT_URL = "https://example.test/exec";
    process.env.BOOKCLUB_SCRIPT_SECRET = "s";
    process.env.TELEGRAM_TEAM_CHAT_ID = "-100";
    const bodies: Record<string, unknown>[] = [];
    vi.stubGlobal("fetch", async (_u: string, init: { body: string }) => {
      const body = JSON.parse(init.body);
      bodies.push(body);
      const out = body.op === "read" ? { Members: [], Books: [["B001", "T", "A", "k", "ok", "", "9", "listed", ""]], Borrows: [borrow], Sessions: [] } : { ok: true };
      return { ok: true, status: 200, json: async () => out };
    });
    const bot = createBot("123:abc");
    bot.botInfo = { id: 1, is_bot: true, first_name: "t", username: "t_bot" } as typeof bot.botInfo;
    bot.api.config.use(async () => ({ ok: true, result: true }) as never);
    await bot.handleUpdate({
      update_id: 2,
      callback_query: {
        id: "1", chat_instance: "x", data, from: { id: 7, is_bot: false, first_name: "T" },
        message: { message_id: 1, date: 0, chat: { id: -100, type: "supergroup", title: "t" }, text: "x" },
      },
    });
    vi.unstubAllGlobals();
    return bodies.find((b) => b.op === "upsert");
  }

  it("t:lr expects both state and ownerPaidAt", async () => {
    const w = await press("t:lr:L001", ["L001", "B001", "5", "", "2026-01-01", "2026-01-08", "", "", "out"]);
    expect(w?.expect).toEqual({ "8": "out", "7": "" });
  });

  it("t:po expects both ownerPaidAt and state per borrow", async () => {
    const w = await press("t:po:9", ["L001", "B001", "5", "", "2026-01-01", "2026-01-08", "", "", "out"]);
    expect(w?.expect).toEqual({ "7": "", "8": "out" });
  });
});
