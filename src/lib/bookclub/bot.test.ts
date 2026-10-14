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
