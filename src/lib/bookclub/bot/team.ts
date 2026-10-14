// What Story Lab does from the team group: approve members and books, confirm payments and returns, pay owners.
import { Composer, InlineKeyboard, type CallbackQueryContext, type Context } from "grammy";
import { cancel, pay, payouts, reminders, returnBook } from "@/lib/bookclub/rules";
import { shelfChanged } from "@/lib/bookclub/shelf";
import * as store from "@/lib/bookclub/store";
import type { Borrow } from "@/lib/bookclub/types";
import { site } from "@/lib/site";
import { BOOK_ID, BORROW_ID, BUTTON, MEMBER_ID, NUMBER, borrowLink, callback, pressed } from "./buttons";
import { ALREADY_HANDLED, HELP, cfg, date, post, tell, titleOf, who, whoIs } from "./messages";

const { price, ownerShare, loanDays } = site.bookClub;

type Press = CallbackQueryContext<Context>;

export const teamActions = new Composer();

teamActions.callbackQuery(pressed(BUTTON.approveMember, MEMBER_ID), (ctx) => decideMember(ctx, ctx.match[1], "approved"));
teamActions.callbackQuery(pressed(BUTTON.declineMember, MEMBER_ID), (ctx) => decideMember(ctx, ctx.match[1], "declined"));
teamActions.callbackQuery(pressed(BUTTON.listBook, BOOK_ID), (ctx) => decideBook(ctx, ctx.match[1], "listed"));
teamActions.callbackQuery(pressed(BUTTON.rejectBook, BOOK_ID), (ctx) => decideBook(ctx, ctx.match[1], "rejected"));

teamActions.callbackQuery(pressed(BUTTON.paid, BORROW_ID), async (ctx) => {
  const moved = await moveBorrow(ctx, ctx.match[1], (borrow) => pay(borrow, new Date(), loanDays));
  if (!moved) return;
  const { borrow, book, title } = moved;
  const returned = new InlineKeyboard().text("📥 Returned", callback(BUTTON.returned, borrow.id));
  await tell(ctx.editMessageReplyMarkup({ reply_markup: returned }));
  await tell(ctx.api.sendMessage(borrow.borrowerId, `Paid ✓ — we'll hand over “${title}”. Please return it by ${date(borrow.dueAt)}.`));
  if (book) await tell(ctx.api.sendMessage(book.ownerId, `“${book.title}” was just borrowed — +₹${ownerShare} for you! 🎉`));
});

teamActions.callbackQuery(pressed(BUTTON.cancelBorrow, BORROW_ID), async (ctx) => {
  const moved = await moveBorrow(ctx, ctx.match[1], cancel);
  if (!moved) return;
  await tell(ctx.editMessageReplyMarkup());
  await tell(ctx.api.sendMessage(moved.borrow.borrowerId, `Your request for “${moved.title}” was cancelled. Browse /shelf for another.`));
});

teamActions.callbackQuery(pressed(BUTTON.returned, BORROW_ID), async (ctx) => {
  const moved = await moveBorrow(ctx, ctx.match[1], (borrow) => returnBook(borrow, new Date()));
  if (!moved) return;
  const { borrow, book, title } = moved;
  await tell(ctx.editMessageReplyMarkup());
  await tell(ctx.api.sendMessage(borrow.borrowerId, `Thanks for returning “${title}”! Pick your next one with /shelf.`));
  if (book) await tell(ctx.api.sendMessage(cfg().channel, `🔁 Back on the shelf: “${book.title}” by ${book.author}`));
});

teamActions.command("payouts", async (ctx) => {
  const club = await store.readAll();
  const owed = payouts(club.borrows, club.books, ownerShare).filter((row) => row.owed > 0);
  if (!owed.length) return ctx.reply("Nobody is owed anything right now. ✓");
  for (const { ownerId, owed: amount } of owed) {
    const owner = club.members.find((m) => m.telegramId === ownerId);
    const markPaid = new InlineKeyboard().text(`Mark ₹${amount} paid`, callback(BUTTON.ownerPaid, ownerId, amount));
    await ctx.reply(`💸 ${who(owner)} · ${owner?.phone ?? ""} — owed ₹${amount}`, { reply_markup: markPaid });
  }
});

// The button carries the amount the team saw, so a borrow paid since then isn't marked without being paid for.
teamActions.callbackQuery(pressed(BUTTON.ownerPaid, MEMBER_ID, NUMBER), async (ctx) => {
  const [, ownerId, amountShown] = ctx.match;
  const club = await store.readAll();
  const ownerBooks = new Set(club.books.filter((b) => b.ownerId === ownerId).map((b) => b.id));
  const unpaid = club.borrows.filter((b) => ownerBooks.has(b.bookId) && b.paidAt && !b.ownerPaidAt);
  if (!unpaid.length) return ctx.answerCallbackQuery("Already paid");
  if (unpaid.length * ownerShare !== Number(amountShown)) return ctx.answerCallbackQuery("Amount changed — run /payouts again");
  const paidAt = new Date().toISOString();
  let marked = 0;
  for (const borrow of unpaid) {
    if (await store.saveIf("Borrows", { ...borrow, ownerPaidAt: paidAt }, { ownerPaidAt: "", state: borrow.state })) marked++;
  }
  if (!marked) return ctx.answerCallbackQuery("Already paid");
  await ctx.answerCallbackQuery("Marked paid");
  await tell(ctx.editMessageReplyMarkup());
  await tell(ctx.api.sendMessage(ownerId, `We've sent you ₹${marked * ownerShare} for your books. Thank you for sharing! 📚`));
});

teamActions.command("overdue", async (ctx) => {
  const club = await store.readAll();
  const { overdue } = reminders(club.borrows, new Date());
  if (!overdue.length) return ctx.reply("Nothing overdue. ✓");
  const lines = overdue.map((b) => `• ${titleOf(club, b.bookId)} — ${whoIs(club, b.borrowerId)}, due ${date(b.dueAt)}`);
  return ctx.reply(lines.join("\n"));
});

async function decideMember(ctx: Press, telegramId: string, status: "approved" | "declined") {
  const club = await store.readAll();
  const member = club.members.find((m) => m.telegramId === telegramId);
  if (member?.status !== "pending" || !(await store.saveIf("Members", { ...member, status }, { status: "pending" }))) {
    return ctx.answerCallbackQuery(ALREADY_HANDLED);
  }
  const approved = status === "approved";
  await ctx.answerCallbackQuery(approved ? "Approved" : "Declined");
  await tell(ctx.editMessageText(`${ctx.callbackQuery.message?.text ?? ""}\n→ ${approved ? "✅ approved" : "❌ declined"}`));
  const news = approved ? `You're in! 🎉\n\n${HELP}` : "Sorry — we can't add you to the Book Club right now.";
  await tell(ctx.api.sendMessage(telegramId, news));
}

async function decideBook(ctx: Press, bookId: string, status: "listed" | "rejected") {
  const club = await store.readAll();
  const book = club.books.find((b) => b.id === bookId);
  if (book?.status !== "pending" || !(await store.saveIf("Books", { ...book, status }, { status: "pending" }))) {
    return ctx.answerCallbackQuery(ALREADY_HANDLED);
  }
  if (status === "rejected") {
    await ctx.answerCallbackQuery("Marked not 10+");
    await tell(ctx.editMessageReplyMarkup());
    const news = `Thanks for “${book.title}” — it isn't quite right for 10+ readers, so we won't list it. Do you have another?`;
    return tell(ctx.api.sendMessage(book.ownerId, news));
  }
  await ctx.answerCallbackQuery("Listed");
  shelfChanged();
  await tell(ctx.editMessageReplyMarkup());
  await tell(ctx.api.sendMessage(book.ownerId, `“${book.title}” is on the shelf! You'll earn ₹${ownerShare} every time it's borrowed.`));
  const announcement = `📚 New on the shelf: “${book.title}” by ${book.author} · ₹${price}/week`;
  const borrowButton = new InlineKeyboard().url("Borrow", borrowLink(ctx.me.username, book.id));
  await tell(post(ctx.api, cfg().channel, book.photoFileId, announcement, borrowButton));
}

/** Applies a borrow transition if the borrow is still where the button expects; otherwise answers and returns null. */
async function moveBorrow(ctx: Press, borrowId: string, move: (borrow: Borrow) => Borrow) {
  const club = await store.readAll();
  const borrow = club.borrows.find((b) => b.id === borrowId);
  if (!borrow) {
    await ctx.answerCallbackQuery("Not found");
    return null;
  }
  let next: Borrow;
  try {
    next = move(borrow); // throws if the borrow is no longer in the state this button expects
  } catch {
    await ctx.answerCallbackQuery(ALREADY_HANDLED);
    return null;
  }
  if (!(await store.saveIf("Borrows", next, { state: borrow.state, ownerPaidAt: borrow.ownerPaidAt }))) {
    await ctx.answerCallbackQuery(ALREADY_HANDLED);
    return null;
  }
  shelfChanged();
  await ctx.answerCallbackQuery("Done");
  return { borrow: next, book: club.books.find((b) => b.id === borrow.bookId), title: titleOf(club, borrow.bookId) };
}
