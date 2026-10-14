import { afterEach, describe, expect, it, vi } from "vitest";
import type { Update } from "grammy/types";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

import { createBot } from "@/lib/bookclub/bot";
import { sendReminders } from "@/lib/bookclub/bot/reminders";

const TEAM = -100;
const PARENT = 5;
const OWNER = "9";

type Body = Record<string, unknown>;
type Sheet = Partial<Record<"Members" | "Books" | "Borrows" | "Sessions", string[][]>>;
type Options = { sheet?: Sheet; respond?: (body: Body) => Body | undefined; blocked?: string };

const parentRow = [String(PARENT), "Riya", "1204", "+919800000000", "", "approved", ""];
const listedBook = ["B001", "Wonder", "R.J. Palacio", "wonder|rj palacio", "Good", "", OWNER, "listed", ""];
const pendingBook = ["B001", "Wonder", "R.J. Palacio", "wonder|rj palacio", "Good", "", OWNER, "pending", ""];
const borrowRow = (over: Partial<Record<"id" | "borrowerId" | "paidAt" | "ownerPaidAt" | "state", string>> = {}) => {
  const b = { id: "L001", borrowerId: String(PARENT), paidAt: "2026-01-01", ownerPaidAt: "", state: "out", ...over };
  return [b.id, "B001", b.borrowerId, "", b.paidAt, "2026-01-08", "", b.ownerPaidAt, b.state];
};

const savedEnv = { ...process.env };
afterEach(() => {
  process.env = { ...savedEnv };
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function setup({ sheet = {}, respond = () => undefined, blocked }: Options = {}) {
  process.env.BOOKCLUB_SCRIPT_URL = "https://example.test/exec";
  process.env.BOOKCLUB_SCRIPT_SECRET = "s";
  process.env.TELEGRAM_TEAM_CHAT_ID = String(TEAM);
  process.env.TELEGRAM_CHANNEL_ID = "-200";
  vi.spyOn(console, "error").mockImplementation(() => {});
  const writes: Body[] = [];
  vi.stubGlobal("fetch", async (_url: string, init: { body: string }) => {
    const body = JSON.parse(init.body) as Body;
    if (body.op !== "read") writes.push(body);
    const fallback = body.op === "read" ? sheet : body.op === "insert" ? { ok: true, id: `${body.prefix}009` } : { ok: true };
    const out = respond(body) ?? fallback;
    return { ok: true, status: 200, json: async () => out };
  });
  const sent: { method: string; payload: Body }[] = [];
  const bot = createBot("123:abc");
  bot.botInfo = { id: 1, is_bot: true, first_name: "t", username: "t_bot" } as typeof bot.botInfo;
  bot.api.config.use(async (_prev, method, payload) => {
    sent.push({ method, payload: payload as Body });
    if (blocked && String((payload as Body).chat_id) === blocked) {
      return { ok: false, error_code: 403, description: "Forbidden: bot was blocked by the user" } as never;
    }
    return { ok: true, result: true } as never;
  });
  const texts = (method = "sendMessage") => sent.filter((s) => s.method === method).map((s) => String(s.payload.text));
  const answer = () => sent.find((s) => s.method === "answerCallbackQuery")?.payload.text;
  const sentTo = (chat: string | number) => sent.filter((s) => String(s.payload.chat_id) === String(chat));
  return { bot, writes, sent, texts, answer, sentTo };
}

const parent = { id: PARENT, is_bot: false, first_name: "P" };
const teamMember = { id: 7, is_bot: false, first_name: "T" };
const chatOf = (id: number) => (id === PARENT ? { id, type: "private" as const, first_name: "P" } : { id, type: "supergroup" as const, title: "t" });

function message(text: string, chatId = PARENT): Update {
  const command = text.startsWith("/") ? { entities: [{ type: "bot_command" as const, offset: 0, length: text.split(" ")[0].length }] } : {};
  const from = chatId === PARENT ? parent : teamMember;
  return { update_id: 1, message: { message_id: 1, date: 0, chat: chatOf(chatId), from, text, ...command } };
}

function press(data: string, chatId: number): Update {
  const from = chatId === PARENT ? parent : teamMember;
  return { update_id: 2, callback_query: { id: "1", chat_instance: "x", data, from, message: { message_id: 1, date: 0, chat: chatOf(chatId), text: "x" } } };
}

describe("createBot", () => {
  it("constructs without network access", () => {
    expect(() => createBot("123:abc")).not.toThrow();
  });

  it("does not throw out of handleUpdate when a handler fails, and tells the user", async () => {
    const { bot, sent } = setup();
    delete process.env.BOOKCLUB_SCRIPT_URL; // the store throws "not configured"
    await expect(bot.handleUpdate(message("/shelf"))).resolves.toBeUndefined();
    expect(sent.map((s) => s.method)).toEqual(["sendMessage"]);
    expect(JSON.stringify(sent[0].payload)).toContain("Something went wrong");
  });
});

describe("conversations", () => {
  const lastStep = { Members: [parentRow], Sessions: [[String(PARENT), "add", "photoFileId", '{"title":"Wonder","author":"R.J. Palacio","condition":"Good"}']] };

  it("keeps the session when the final save fails, so the parent can retry", async () => {
    const { bot, writes } = setup({ sheet: lastStep, respond: (b) => (b.op === "insert" ? { error: "timeout" } : undefined) });
    await bot.handleUpdate(press("sk", PARENT));
    expect(writes.map((w) => w.op)).toEqual(["insert"]);
  });

  it("removes the session only after the book is saved", async () => {
    const { bot, writes } = setup({ sheet: lastStep });
    await bot.handleUpdate(press("sk", PARENT));
    expect(writes.map((w) => w.op)).toEqual(["insert", "delete"]);
  });
});

describe("team borrow writes", () => {
  it("t:lr expects both state and ownerPaidAt", async () => {
    const { bot, writes } = setup({ sheet: { Books: [listedBook], Borrows: [borrowRow()] } });
    await bot.handleUpdate(press("t:lr:L001", TEAM));
    expect(writes.find((w) => w.op === "upsert")?.expect).toEqual({ "8": "out", "7": "" });
  });
});

describe("review focus", () => {
  it("refuses a team button pressed outside the team chat, without writing", async () => {
    const { bot, writes, answer } = setup({ sheet: { Books: [pendingBook] } });
    await bot.handleUpdate(press("t:ba:B001", -300));
    expect(answer()).toBe("Only the Story Lab team can do that.");
    expect(writes).toEqual([]);
  });

  it("says Already handled when a team transition loses the race, and tells nobody", async () => {
    const { bot, answer, sentTo } = setup({ sheet: { Books: [pendingBook] }, respond: (b) => (b.op === "upsert" ? { error: "conflict" } : undefined) });
    await bot.handleUpdate(press("t:ba:B001", TEAM));
    expect(answer()).toBe("Already handled");
    expect(sentTo("-200")).toEqual([]);
    expect(sentTo(OWNER)).toEqual([]);
  });

  it("tells the second borrower someone just asked when the insert conflicts", async () => {
    const { bot, texts } = setup({
      sheet: { Members: [parentRow], Books: [listedBook] },
      respond: (b) => (b.op === "insert" ? { error: "conflict" } : undefined),
    });
    await bot.handleUpdate(press("bc:B001", PARENT));
    expect(texts()).toEqual(["Someone just asked for that one — try another from /shelf."]);
  });

  it("answers stray text with help and writes nothing", async () => {
    const { bot, writes, texts } = setup({ sheet: { Members: [parentRow] } });
    await bot.handleUpdate(message("hello"));
    expect(texts()).toHaveLength(1);
    expect(texts()[0]).toContain("/shelf — browse and borrow");
    expect(writes).toEqual([]);
  });
});

describe("payouts", () => {
  const sheet = { Books: [listedBook], Borrows: [borrowRow()] };

  it("puts the owed amount in the button", async () => {
    const { bot, sent } = setup({ sheet });
    await bot.handleUpdate(message("/payouts", TEAM));
    expect(JSON.stringify(sent.at(-1)?.payload)).toContain(`t:po:${OWNER}:20`);
  });

  it("marks each unpaid borrow, expecting ownerPaidAt and state", async () => {
    const { bot, writes } = setup({ sheet });
    await bot.handleUpdate(press(`t:po:${OWNER}:20`, TEAM));
    expect(writes.find((w) => w.op === "upsert")?.expect).toEqual({ "7": "", "8": "out" });
  });

  it("marks nothing when the amount changed since /payouts", async () => {
    const { bot, writes, answer } = setup({ sheet });
    await bot.handleUpdate(press(`t:po:${OWNER}:40`, TEAM));
    expect(answer()).toBe("Amount changed — run /payouts again");
    expect(writes).toEqual([]);
  });
});

describe("sendReminders", () => {
  it("keeps going when one borrower has blocked the bot", async () => {
    const overdue = [borrowRow({ id: "L001", borrowerId: "5" }), borrowRow({ id: "L002", borrowerId: "6" })];
    const { bot, sentTo } = setup({ sheet: { Books: [listedBook], Borrows: overdue }, blocked: "5" });
    await expect(sendReminders(bot)).resolves.toEqual({ dueSoon: 0, overdue: 2, failed: 1 });
    expect(sentTo("6")).toHaveLength(1);
    expect(sentTo(TEAM)).toHaveLength(1);
  });
});
