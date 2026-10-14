// What the bot says, and how it reaches people other than the one it is answering.
import type { Api, InlineKeyboard } from "grammy";
import type { Club } from "@/lib/bookclub/store";
import type { Member } from "@/lib/bookclub/types";

export const cfg = () => ({
  team: process.env.TELEGRAM_TEAM_CHAT_ID ?? "",
  channel: process.env.TELEGRAM_CHANNEL_ID ?? "",
  upi: process.env.UPI_ID ?? "",
});

export const HELP = [
  "📚 Story Lab Book Club",
  "/shelf — browse and borrow",
  "/add — share a novel",
  "/mybooks — your books and earnings",
  "/borrowed — what you have out",
  "/cancel — stop what you're doing",
].join("\n");

export const alreadyListed = (title: string) => `We already have “${title}” listed — thank you! Do you have another novel? Send /add.`;
export const ONE_AT_A_TIME = "You already have a book out or requested — one at a time.";
export const JUST_TAKEN = "Someone just asked for that one — try another from /shelf.";
export const ALREADY_HANDLED = "Already handled";

// While no UPI ID is configured (payments paused), the team shares payment details by hand.
export const paymentRequest = (borrowId: string, price: number, upi: string) =>
  upi
    ? `Great choice! Please pay ₹${price} by UPI to ${upi} (note: ${borrowId}), then send the payment screenshot here.`
    : `Great choice! We'll send you the payment details for ₹${price} shortly (your request: ${borrowId}).`;

export const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
export const who = (member?: Member) => (member ? `${member.name}, Flat ${member.flat}` : "someone");
export const whoIs = (club: Club, telegramId: string) => who(club.members.find((m) => m.telegramId === telegramId));
export const titleOf = (club: Club, bookId: string) => club.books.find((b) => b.id === bookId)?.title ?? bookId;

/** Notifications are best-effort: one blocked chat must not abort the rest. Resolves to whether it was delivered. */
export const tell = (sending: Promise<unknown>) =>
  sending.then(
    () => true,
    (e) => {
      console.error("[bookclub] notify failed", e);
      return false;
    },
  );

/** Sends the book's photo with the text as its caption, or just the text when there is no photo. */
export const post = (api: Api, chat: string, photoFileId: string, text: string, keyboard: InlineKeyboard) =>
  photoFileId
    ? api.sendPhoto(chat, photoFileId, { caption: text, reply_markup: keyboard })
    : api.sendMessage(chat, text, { reply_markup: keyboard });
