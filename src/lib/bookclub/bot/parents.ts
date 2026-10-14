// Everything a parent does in a private chat with the bot.
import { Composer, InlineKeyboard } from "grammy";
import { startAdd, startJoin } from "@/lib/bookclub/flow";
import { canRequest, payouts, shelfOrder } from "@/lib/bookclub/rules";
import { shelfChanged } from "@/lib/bookclub/shelf";
import * as store from "@/lib/bookclub/store";
import type { Club } from "@/lib/bookclub/store";
import type { Book, Borrow, Member } from "@/lib/bookclub/types";
import { site } from "@/lib/site";
import { ANY, BOOK_ID, BORROW_START, BUTTON, NUMBER, callback, paymentButtons, pressed } from "./buttons";
import { answer, show, type ParentContext } from "./conversation";
import { HELP, JUST_TAKEN, ONE_AT_A_TIME, cfg, date, tell, titleOf, who, whoIs } from "./messages";

const { price, ownerShare } = site.bookClub;
const PAGE_SIZE = 5;

type Membership = { club: Club; me: Member };

export const parents = new Composer<ParentContext>();

parents.command("start", async (ctx) => {
  const membership = await requireMember(ctx);
  if (!membership) return;
  if (ctx.match.startsWith(BORROW_START)) return offerBorrow(ctx, membership, ctx.match.slice(BORROW_START.length));
  if (ctx.match === "add") return show(ctx, startAdd(membership.me.telegramId));
  return ctx.reply(HELP);
});

parents.command("help", (ctx) => ctx.reply(HELP));

parents.command("cancel", async (ctx) => {
  await store.remove("Sessions", String(ctx.from.id));
  return ctx.reply("Okay, stopped. " + HELP, { reply_markup: { remove_keyboard: true } });
});

parents.command("add", async (ctx) => {
  const membership = await requireMember(ctx);
  if (membership) return show(ctx, startAdd(membership.me.telegramId));
});

parents.command("shelf", (ctx) => showShelf(ctx, 0, false));

parents.command("mybooks", async (ctx) => {
  const membership = await requireMember(ctx);
  if (!membership) return;
  const { club, me } = membership;
  const mine = club.books.filter((b) => b.ownerId === me.telegramId);
  if (!mine.length) return ctx.reply("You haven't shared a book yet — send /add.");
  const lines = mine.map((book) => `• ${book.title} — ${bookStatus(book, club.borrows)}`);
  const earnings = payouts(club.borrows, club.books, ownerShare).find((row) => row.ownerId === me.telegramId);
  const money = earnings ? `\n\nEarned ₹${earnings.earned} · paid ₹${earnings.paid} · pending ₹${earnings.owed}` : "";
  return ctx.reply(`Your books:\n${lines.join("\n")}${money}`);
});

parents.command("borrowed", async (ctx) => {
  const membership = await requireMember(ctx);
  if (!membership) return;
  const { club, me } = membership;
  const open = club.borrows.filter((b) => b.borrowerId === me.telegramId && (b.state === "out" || b.state === "requested"));
  if (!open.length) return ctx.reply("Nothing out right now — browse /shelf.");
  const lines = open.map((borrow) => {
    const status = borrow.state === "out" ? `due ${date(borrow.dueAt)}` : "waiting for payment";
    return `• ${titleOf(club, borrow.bookId)} — ${status}`;
  });
  return ctx.reply(lines.join("\n"));
});

parents.on("message:contact", (ctx) => {
  if (ctx.message.contact.user_id !== ctx.from.id) return ctx.reply("Please share your own number using the button.");
  return answer(ctx, { kind: "contact", phone: ctx.message.contact.phone_number });
});

parents.on("message:photo", async (ctx) => {
  const fileId = ctx.message.photo.at(-1)!.file_id;
  const id = String(ctx.from.id);
  const club = await store.readAll();
  if (club.sessions.some((s) => s.telegramId === id)) return answer(ctx, { kind: "photo", fileId });
  // Otherwise it's a payment screenshot for their open request.
  const request = club.borrows.find((b) => b.borrowerId === id && b.state === "requested");
  if (!request) return ctx.reply(HELP);
  const caption = `💳 Payment screenshot from ${whoIs(club, id)} for “${titleOf(club, request.bookId)}” (${request.id}) · ₹${price}`;
  await tell(ctx.api.sendPhoto(cfg().team, fileId, { caption, reply_markup: paymentButtons(request.id) }));
  return ctx.reply("Thanks! We'll confirm and arrange the handover.");
});

parents.on("message:text", (ctx) => answer(ctx, { kind: "text", text: ctx.message.text }));

parents.callbackQuery(BUTTON.skip, async (ctx) => {
  await ctx.answerCallbackQuery();
  return answer(ctx, { kind: "skip" });
});

parents.callbackQuery(pressed(BUTTON.choose, ANY), async (ctx) => {
  await ctx.answerCallbackQuery();
  return answer(ctx, { kind: "text", text: ctx.match[1] });
});

parents.callbackQuery(pressed(BUTTON.shelfPage, NUMBER), async (ctx) => {
  await ctx.answerCallbackQuery();
  return showShelf(ctx, Number(ctx.match[1]), true);
});

parents.callbackQuery(pressed(BUTTON.borrow, BOOK_ID), async (ctx) => {
  await ctx.answerCallbackQuery();
  const membership = await requireMember(ctx);
  if (membership) return offerBorrow(ctx, membership, ctx.match[1]);
});

parents.callbackQuery(pressed(BUTTON.confirmBorrow, BOOK_ID), async (ctx) => {
  await ctx.answerCallbackQuery();
  const membership = await requireMember(ctx);
  if (membership) return requestBorrow(ctx, membership, ctx.match[1]);
});

/** The approved member behind this chat. Otherwise starts the join conversation or explains why not, and returns null. */
async function requireMember(ctx: ParentContext): Promise<Membership | null> {
  const id = String(ctx.from.id);
  const club = await store.readAll();
  const me = club.members.find((m) => m.telegramId === id);
  if (!me) {
    await show(ctx, startJoin(id));
    return null;
  }
  if (me.status !== "approved") {
    const why = me.status === "pending"
      ? "You're waiting for approval — we'll message you soon."
      : "Sorry, the Book Club isn't open to you right now.";
    await ctx.reply(why);
    return null;
  }
  return { club, me };
}

async function showShelf(ctx: ParentContext, page: number, edit: boolean) {
  const membership = await requireMember(ctx);
  if (!membership) return;
  const shelf = shelfOrder(membership.club.books, membership.club.borrows);
  const onPage = shelf.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  if (!onPage.length) return ctx.reply("The shelf is empty right now — share a novel with /add!");
  const keyboard = new InlineKeyboard();
  const lines = onPage.map(({ book, available }) => {
    if (available) keyboard.text(`Borrow: ${book.title}`, callback(BUTTON.borrow, book.id)).row();
    return `${available ? "🟢" : "⏳"} ${book.title} — ${book.author}`;
  });
  if (page > 0) keyboard.text("◀ Back", callback(BUTTON.shelfPage, page - 1));
  if ((page + 1) * PAGE_SIZE < shelf.length) keyboard.text("More ▶", callback(BUTTON.shelfPage, page + 1));
  const text = `📚 The shelf (${shelf.length} books) · ₹${price} a week\n\n${lines.join("\n")}`;
  return edit ? ctx.editMessageText(text, { reply_markup: keyboard }) : ctx.reply(text, { reply_markup: keyboard });
}

function bookStatus(book: Book, borrows: Borrow[]) {
  if (book.status === "pending") return "waiting for approval";
  if (book.status !== "listed") return "not listed";
  const out = borrows.find((b) => b.bookId === book.id && b.state === "out");
  return out ? `out until ${date(out.dueAt)}` : "on the shelf";
}

async function offerBorrow(ctx: ParentContext, { club, me }: Membership, bookId: string) {
  const check = canRequest(me.telegramId, bookId, club.books, club.borrows);
  if (!check.ok) return ctx.reply(check.reason === "has-active" ? ONE_AT_A_TIME : "That book isn't available right now. See /shelf.");
  const book = club.books.find((b) => b.id === bookId)!;
  const confirm = new InlineKeyboard().text(`Yes, borrow · ₹${price}`, callback(BUTTON.confirmBorrow, book.id));
  return ctx.reply(`Borrow “${book.title}” by ${book.author} for one week — ₹${price}?`, { reply_markup: confirm });
}

async function requestBorrow(ctx: ParentContext, { club, me }: Membership, bookId: string) {
  const check = canRequest(me.telegramId, bookId, club.books, club.borrows);
  if (!check.ok) return ctx.reply(check.reason === "book-taken" ? JUST_TAKEN : ONE_AT_A_TIME);
  const borrow: Borrow = {
    id: "", bookId, borrowerId: me.telegramId, requestedAt: new Date().toISOString(),
    paidAt: "", dueAt: "", returnedAt: "", ownerPaidAt: "", state: "requested",
  };
  // The sheet refuses a second open request for the same book.
  const id = await store.insert("Borrows", borrow, "L");
  if (!id) return ctx.reply(JUST_TAKEN);
  shelfChanged();
  await tell(ctx.editMessageReplyMarkup());
  await ctx.reply(`Great choice! Please pay ₹${price} by UPI to ${cfg().upi} (note: ${id}), then send the payment screenshot here.`);
  const request = `📥 Borrow request ${id}: “${titleOf(club, bookId)}” for ${who(me)} — waiting for payment.`;
  await tell(ctx.api.sendMessage(cfg().team, request, { reply_markup: paymentButtons(id) }));
}
