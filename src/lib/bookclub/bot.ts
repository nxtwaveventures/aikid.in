// Story Lab Book Club bot. Parents chat privately; Story Lab acts from the team group.
import { Bot, InlineKeyboard, Keyboard, type Context } from "grammy";
import { revalidateTag } from "next/cache";
import { advance, startAdd, startJoin, type Input, type Step } from "@/lib/bookclub/flow";
import { bookState, canRequest, cancel, findDuplicate, matchKey, nextId, pay, payouts, reminders, returnBook } from "@/lib/bookclub/rules";
import * as store from "@/lib/bookclub/store";
import type { Book, Borrow, Member } from "@/lib/bookclub/types";
import { site } from "@/lib/site";

const { price, ownerShare, loanDays } = site.bookClub;
const PAGE = 5;
type Data = Awaited<ReturnType<typeof store.readAll>>;

const cfg = () => ({
  team: process.env.TELEGRAM_TEAM_CHAT_ID ?? "",
  channel: process.env.TELEGRAM_CHANNEL_ID ?? "",
  upi: process.env.UPI_ID ?? "",
});
const date = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const who = (m?: Member) => (m ? `${m.name}, Flat ${m.flat}` : "someone");
const shelfChanged = () => revalidateTag("shelf", "max");

const HELP = [
  "📚 Story Lab Book Club",
  "/shelf — browse and borrow",
  "/add — share a novel",
  "/mybooks — your books and earnings",
  "/borrowed — what you have out",
  "/cancel — stop what you're doing",
].join("\n");

export function createBot(token: string) {
  const bot = new Bot(token);
  const dm = bot.chatType("private");
  const team = bot.filter((ctx) => String(ctx.chat?.id) === cfg().team);

  // In any group: tells the team the chat id to put in TELEGRAM_TEAM_CHAT_ID.
  bot.chatType(["group", "supergroup"]).command("chatid", (ctx) => ctx.reply(`Chat ID: ${ctx.chat.id}`));

  // ---------- conversations ----------

  async function show(ctx: Context, step: Step) {
    if (step.session) await store.save("Sessions", step.session);
    else await store.remove("Sessions", String(ctx.from!.id));
    if (step.done) return finish(ctx, step.done);
    const a = step.ask;
    if (!a) return ctx.reply(step.error ?? HELP);
    const text = step.error ? `${step.error}\n\n${a.text}` : a.text;
    if (a.contact) {
      return ctx.reply(text, { reply_markup: new Keyboard().requestContact("📱 Share my phone number").resized().oneTime() });
    }
    const kb = new InlineKeyboard();
    a.options?.forEach((o) => kb.text(o, `cd:${o}`));
    if (a.skippable) kb.text("Skip", "sk");
    return ctx.reply(text, a.options || a.skippable ? { reply_markup: kb } : { reply_markup: { remove_keyboard: true } });
  }

  async function step(ctx: Context, input: Input) {
    const id = String(ctx.from!.id);
    const data = await store.readAll();
    const session = data.sessions.find((s) => s.telegramId === id);
    if (!session) return ctx.reply(HELP);
    const next = advance(session, input);
    // Duplicate check as soon as we know title + author.
    if (session.flow === "add" && session.step === "author" && !next.error) {
      const dup = findDuplicate(data.books, matchKey(next.session!.draft.title, next.session!.draft.author));
      if (dup) {
        await store.remove("Sessions", id);
        return ctx.reply(`We already have “${dup.title}” listed — thank you! Do you have another novel to share? Send /add.`);
      }
    }
    return show(ctx, next);
  }

  async function finish(ctx: Context, done: NonNullable<Step["done"]>) {
    const id = String(ctx.from!.id);
    const d = done.draft;
    if (done.flow === "join") {
      const m: Member = { telegramId: id, name: d.name, flat: d.flat, phone: d.phone, childName: d.childName, status: "pending", joinedAt: new Date().toISOString() };
      await store.save("Members", m);
      await ctx.reply("Thanks! Story Lab will approve you shortly — we'll message you here. 🙂", { reply_markup: { remove_keyboard: true } });
      return ctx.api.sendMessage(cfg().team, `🙋 New member: ${who(m)}${m.childName ? ` (child: ${m.childName})` : ""} · ${m.phone}`, {
        reply_markup: new InlineKeyboard().text("✅ Approve", `t:ma:${id}`).text("❌ Decline", `t:md:${id}`),
      });
    }
    const data = await store.readAll();
    const key = matchKey(d.title, d.author);
    const dup = findDuplicate(data.books, key);
    if (dup) return ctx.reply(`We already have “${dup.title}” listed — thank you! Do you have another novel? Send /add.`);
    const b: Book = {
      id: nextId("B", data.books.map((x) => x.id)), title: d.title, author: d.author, matchKey: key, condition: d.condition,
      photoFileId: d.photoFileId, ownerId: id, status: "pending", addedAt: new Date().toISOString(),
    };
    await store.save("Books", b);
    await ctx.reply(`Thanks! We'll check “${b.title}” and let you know when it's on the shelf.`);
    const owner = data.members.find((m) => m.telegramId === id);
    const caption = `📖 New book ${b.id}: “${b.title}” by ${b.author} (${b.condition}) from ${who(owner)}`;
    const kb = new InlineKeyboard().text("✅ Approve", `t:ba:${b.id}`).text("🚫 Not 10+", `t:br:${b.id}`);
    return b.photoFileId
      ? ctx.api.sendPhoto(cfg().team, b.photoFileId, { caption, reply_markup: kb })
      : ctx.api.sendMessage(cfg().team, caption, { reply_markup: kb });
  }

  // ---------- parents ----------

  async function member(ctx: Context): Promise<{ data: Data; me: Member } | null> {
    const data = await store.readAll();
    const me = data.members.find((m) => m.telegramId === String(ctx.from!.id));
    if (!me) {
      await show(ctx, startJoin(String(ctx.from!.id)));
      return null;
    }
    if (me.status !== "approved") {
      await ctx.reply(me.status === "pending" ? "You're waiting for approval — we'll message you soon." : "Sorry, the Book Club isn't open to you right now.");
      return null;
    }
    return { data, me };
  }

  async function offerBorrow(ctx: Context, data: Data, me: Member, bookId: string) {
    const book = data.books.find((b) => b.id === bookId);
    const check = canRequest(me.telegramId, bookId, data.books, data.borrows);
    if (!book || !check.ok) {
      const why = !check.ok && check.reason === "has-active" ? "You already have a book out or requested — one at a time." : "That book isn't available right now. See /shelf.";
      return ctx.reply(why);
    }
    return ctx.reply(`Borrow “${book.title}” by ${book.author} for one week — ₹${price}?`, {
      reply_markup: new InlineKeyboard().text(`Yes, borrow · ₹${price}`, `bc:${book.id}`),
    });
  }

  dm.command("start", async (ctx) => {
    const ok = await member(ctx);
    if (!ok) return;
    if (ctx.match.startsWith("borrow_")) return offerBorrow(ctx, ok.data, ok.me, ctx.match.slice(7));
    if (ctx.match === "add") return show(ctx, startAdd(ok.me.telegramId));
    return ctx.reply(HELP);
  });
  dm.command("help", (ctx) => ctx.reply(HELP));
  dm.command("cancel", async (ctx) => {
    await store.remove("Sessions", String(ctx.from.id));
    return ctx.reply("Okay, stopped. " + HELP, { reply_markup: { remove_keyboard: true } });
  });
  dm.command("add", async (ctx) => {
    const ok = await member(ctx);
    if (ok) return show(ctx, startAdd(ok.me.telegramId));
  });

  async function shelf(ctx: Context, page: number, edit: boolean) {
    const ok = await member(ctx);
    if (!ok) return;
    const listed = ok.data.books.filter((b) => b.status === "listed");
    const sorted = [...listed].sort((a, b) => Number(bookState(a.id, ok.data.borrows) !== "available") - Number(bookState(b.id, ok.data.borrows) !== "available"));
    const slice = sorted.slice(page * PAGE, page * PAGE + PAGE);
    if (!slice.length) return ctx.reply("The shelf is empty right now — share a novel with /add!");
    const kb = new InlineKeyboard();
    const lines = slice.map((b) => {
      const state = bookState(b.id, ok.data.borrows);
      if (state === "available") kb.text(`Borrow: ${b.title}`, `bw:${b.id}`).row();
      return `${state === "available" ? "🟢" : "⏳"} ${b.title} — ${b.author}`;
    });
    if (page > 0) kb.text("◀ Back", `sh:${page - 1}`);
    if ((page + 1) * PAGE < sorted.length) kb.text("More ▶", `sh:${page + 1}`);
    const text = `📚 The shelf (${listed.length} books) · ₹${price} a week\n\n${lines.join("\n")}`;
    return edit ? ctx.editMessageText(text, { reply_markup: kb }) : ctx.reply(text, { reply_markup: kb });
  }
  dm.command("shelf", (ctx) => shelf(ctx, 0, false));

  dm.command("mybooks", async (ctx) => {
    const ok = await member(ctx);
    if (!ok) return;
    const mine = ok.data.books.filter((b) => b.ownerId === ok.me.telegramId);
    if (!mine.length) return ctx.reply("You haven't shared a book yet — send /add.");
    const lines = mine.map((b) => {
      const out = ok.data.borrows.find((l) => l.bookId === b.id && l.state === "out");
      const status = b.status !== "listed" ? (b.status === "pending" ? "waiting for approval" : "not listed") : out ? `out until ${date(out.dueAt)}` : "on the shelf";
      return `• ${b.title} — ${status}`;
    });
    const p = payouts(ok.data.borrows, ok.data.books, ownerShare).find((r) => r.ownerId === ok.me.telegramId);
    const money = p ? `\n\nEarned ₹${p.earned} · paid ₹${p.paid} · pending ₹${p.owed}` : "";
    return ctx.reply(`Your books:\n${lines.join("\n")}${money}`);
  });

  dm.command("borrowed", async (ctx) => {
    const ok = await member(ctx);
    if (!ok) return;
    const mine = ok.data.borrows.filter((l) => l.borrowerId === ok.me.telegramId && (l.state === "out" || l.state === "requested"));
    if (!mine.length) return ctx.reply("Nothing out right now — browse /shelf.");
    const title = (id: string) => ok.data.books.find((b) => b.id === id)?.title ?? id;
    return ctx.reply(mine.map((l) => `• ${title(l.bookId)} — ${l.state === "out" ? `due ${date(l.dueAt)}` : "waiting for payment"}`).join("\n"));
  });

  dm.on("message:contact", (ctx) => {
    if (ctx.message.contact.user_id !== ctx.from.id) return ctx.reply("Please share your own number using the button.");
    return step(ctx, { kind: "contact", phone: ctx.message.contact.phone_number });
  });

  dm.on("message:photo", async (ctx) => {
    const fileId = ctx.message.photo.at(-1)!.file_id;
    const id = String(ctx.from.id);
    const data = await store.readAll();
    if (data.sessions.some((s) => s.telegramId === id)) return step(ctx, { kind: "photo", fileId });
    // Otherwise treat it as a payment screenshot for their open request.
    const req = data.borrows.find((l) => l.borrowerId === id && l.state === "requested");
    if (!req) return ctx.reply(HELP);
    const me = data.members.find((m) => m.telegramId === id);
    const book = data.books.find((b) => b.id === req.bookId);
    await ctx.api.sendPhoto(cfg().team, fileId, {
      caption: `💳 Payment screenshot from ${who(me)} for “${book?.title}” (${req.id}) · ₹${price}`,
      reply_markup: new InlineKeyboard().text("💰 Paid", `t:lp:${req.id}`).text("✖ Cancel", `t:lc:${req.id}`),
    });
    return ctx.reply("Thanks! We'll confirm and arrange the handover.");
  });

  dm.on("message:text", (ctx) => step(ctx, { kind: "text", text: ctx.message.text }));

  dm.callbackQuery("sk", async (ctx) => {
    await ctx.answerCallbackQuery();
    return step(ctx, { kind: "skip" });
  });
  dm.callbackQuery(/^cd:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    return step(ctx, { kind: "text", text: ctx.match[1] });
  });
  dm.callbackQuery(/^sh:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    return shelf(ctx, Number(ctx.match[1]), true);
  });
  dm.callbackQuery(/^bw:(B\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const ok = await member(ctx);
    if (ok) return offerBorrow(ctx, ok.data, ok.me, ctx.match[1]);
  });
  dm.callbackQuery(/^bc:(B\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const ok = await member(ctx);
    if (!ok) return;
    const bookId = ctx.match[1];
    const check = canRequest(ok.me.telegramId, bookId, ok.data.books, ok.data.borrows);
    if (!check.ok) return ctx.reply(check.reason === "book-taken" ? "Someone just asked for that one — try another from /shelf." : "You already have a book out or requested — one at a time.");
    const book = ok.data.books.find((b) => b.id === bookId)!;
    const l: Borrow = {
      id: nextId("L", ok.data.borrows.map((x) => x.id)), bookId, borrowerId: ok.me.telegramId, requestedAt: new Date().toISOString(),
      paidAt: "", dueAt: "", returnedAt: "", ownerPaidAt: "", state: "requested",
    };
    await store.save("Borrows", l);
    shelfChanged();
    await ctx.editMessageReplyMarkup();
    await ctx.reply(`Great choice! Please pay ₹${price} by UPI to ${cfg().upi} (note: ${l.id}), then send the payment screenshot here.`);
    return ctx.api.sendMessage(cfg().team, `📥 Borrow request ${l.id}: “${book.title}” for ${who(ok.me)} — waiting for payment.`, {
      reply_markup: new InlineKeyboard().text("💰 Paid", `t:lp:${l.id}`).text("✖ Cancel", `t:lc:${l.id}`),
    });
  });

  // ---------- team ----------

  team.callbackQuery(/^t:(ma|md):(\d+)$/, async (ctx) => {
    const data = await store.readAll();
    const m = data.members.find((x) => x.telegramId === ctx.match[2]);
    if (!m || m.status !== "pending") return ctx.answerCallbackQuery("Already handled");
    const approved = ctx.match[1] === "ma";
    await store.save("Members", { ...m, status: approved ? "approved" : "declined" });
    await ctx.answerCallbackQuery(approved ? "Approved" : "Declined");
    await ctx.editMessageText(`${ctx.callbackQuery.message?.text ?? ""}\n→ ${approved ? "✅ approved" : "❌ declined"}`);
    return ctx.api.sendMessage(m.telegramId, approved ? `You're in! 🎉\n\n${HELP}` : "Sorry — we can't add you to the Book Club right now.");
  });

  team.callbackQuery(/^t:(ba|br):(B\d+)$/, async (ctx) => {
    const data = await store.readAll();
    const b = data.books.find((x) => x.id === ctx.match[2]);
    if (!b || b.status !== "pending") return ctx.answerCallbackQuery("Already handled");
    const listed = ctx.match[1] === "ba";
    await store.save("Books", { ...b, status: listed ? "listed" : "rejected" });
    await ctx.answerCallbackQuery(listed ? "Listed" : "Marked not 10+");
    await ctx.editMessageReplyMarkup();
    await ctx.api.sendMessage(b.ownerId, listed ? `“${b.title}” is on the shelf! You'll earn ₹${ownerShare} every time it's borrowed.` : `Thanks for “${b.title}” — it isn't quite right for 10+ readers, so we won't list it. Do you have another?`);
    if (!listed) return;
    shelfChanged();
    const text = `📚 New on the shelf: “${b.title}” by ${b.author} · ₹${price}/week`;
    const kb = new InlineKeyboard().url("Borrow", `https://t.me/${ctx.me.username}?start=borrow_${b.id}`);
    return b.photoFileId
      ? ctx.api.sendPhoto(cfg().channel, b.photoFileId, { caption: text, reply_markup: kb })
      : ctx.api.sendMessage(cfg().channel, text, { reply_markup: kb });
  });

  team.callbackQuery(/^t:(lp|lc|lr):(L\d+)$/, async (ctx) => {
    const data = await store.readAll();
    const l = data.borrows.find((x) => x.id === ctx.match[2]);
    if (!l) return ctx.answerCallbackQuery("Not found");
    const book = data.books.find((b) => b.id === l.bookId);
    const action = ctx.match[1];
    let next: Borrow;
    try {
      next = action === "lp" ? pay(l, new Date(), loanDays) : action === "lc" ? cancel(l) : returnBook(l, new Date());
    } catch {
      return ctx.answerCallbackQuery("Already handled");
    }
    await store.save("Borrows", next);
    shelfChanged();
    await ctx.answerCallbackQuery("Done");
    if (action === "lp") {
      await ctx.editMessageReplyMarkup({ reply_markup: new InlineKeyboard().text("📥 Returned", `t:lr:${l.id}`) });
      await ctx.api.sendMessage(l.borrowerId, `Paid ✓ — we'll hand over “${book?.title}”. Please return it by ${date(next.dueAt)}.`);
      if (book) await ctx.api.sendMessage(book.ownerId, `“${book.title}” was just borrowed — +₹${ownerShare} for you! 🎉`);
      return;
    }
    await ctx.editMessageReplyMarkup();
    if (action === "lc") return ctx.api.sendMessage(l.borrowerId, `Your request for “${book?.title}” was cancelled. Browse /shelf for another.`);
    await ctx.api.sendMessage(l.borrowerId, `Thanks for returning “${book?.title}”! Pick your next one with /shelf.`);
    if (book) return ctx.api.sendMessage(cfg().channel, `🔁 Back on the shelf: “${book.title}” by ${book.author}`);
  });

  team.command("payouts", async (ctx) => {
    const data = await store.readAll();
    const owed = payouts(data.borrows, data.books, ownerShare).filter((p) => p.owed > 0);
    if (!owed.length) return ctx.reply("Nobody is owed anything right now. ✓");
    for (const p of owed) {
      const m = data.members.find((x) => x.telegramId === p.ownerId);
      await ctx.reply(`💸 ${who(m)} · ${m?.phone ?? ""} — owed ₹${p.owed}`, {
        reply_markup: new InlineKeyboard().text(`Mark ₹${p.owed} paid`, `t:po:${p.ownerId}`),
      });
    }
  });

  team.callbackQuery(/^t:po:(\d+)$/, async (ctx) => {
    const data = await store.readAll();
    const ownerBooks = new Set(data.books.filter((b) => b.ownerId === ctx.match[1]).map((b) => b.id));
    const unpaid = data.borrows.filter((l) => ownerBooks.has(l.bookId) && l.paidAt && !l.ownerPaidAt);
    if (!unpaid.length) return ctx.answerCallbackQuery("Already paid");
    const at = new Date().toISOString();
    for (const l of unpaid) await store.save("Borrows", { ...l, ownerPaidAt: at });
    await ctx.answerCallbackQuery("Marked paid");
    await ctx.editMessageReplyMarkup();
    return ctx.api.sendMessage(ctx.match[1], `We've sent you ₹${unpaid.length * ownerShare} for your books. Thank you for sharing! 📚`);
  });

  team.command("overdue", async (ctx) => {
    const data = await store.readAll();
    const { overdue } = reminders(data.borrows, new Date());
    if (!overdue.length) return ctx.reply("Nothing overdue. ✓");
    return ctx.reply(overdue.map((l) => `• ${data.books.find((b) => b.id === l.bookId)?.title} — ${who(data.members.find((m) => m.telegramId === l.borrowerId))}, due ${date(l.dueAt)}`).join("\n"));
  });

  // Any team button pressed outside the team chat.
  bot.callbackQuery(/^t:/, (ctx) => ctx.answerCallbackQuery("Only the Story Lab team can do that."));

  bot.catch(async (err) => {
    console.error("[bookclub]", err.error);
    try {
      await err.ctx.reply("Something went wrong — please try again in a minute.");
    } catch {}
  });

  return bot;
}

// Sent by the daily cron.
export async function sendReminders(bot: Bot) {
  const data = await store.readAll();
  const { dueSoon, overdue } = reminders(data.borrows, new Date());
  const title = (l: Borrow) => data.books.find((b) => b.id === l.bookId)?.title ?? l.bookId;
  for (const l of dueSoon) await bot.api.sendMessage(l.borrowerId, `⏰ “${title(l)}” is due back by ${date(l.dueAt)}.`);
  for (const l of overdue) await bot.api.sendMessage(l.borrowerId, `📚 “${title(l)}” was due on ${date(l.dueAt)} — please return it soon.`);
  if (overdue.length) {
    await bot.api.sendMessage(cfg().team, `Overdue today:\n${overdue.map((l) => `• ${title(l)} — ${who(data.members.find((m) => m.telegramId === l.borrowerId))}`).join("\n")}`);
  }
  return { dueSoon: dueSoon.length, overdue: overdue.length };
}
