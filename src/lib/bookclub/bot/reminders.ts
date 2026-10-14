// Daily reminders, sent by the cron route.
import type { Bot } from "grammy";
import { reminders } from "@/lib/bookclub/rules";
import * as store from "@/lib/bookclub/store";
import type { Borrow } from "@/lib/bookclub/types";
import { cfg, date, tell, titleOf, whoIs } from "./messages";

export async function sendReminders(bot: Bot) {
  const club = await store.readAll();
  const { dueSoon, overdue } = reminders(club.borrows, new Date());
  const title = (b: Borrow) => titleOf(club, b.bookId);
  const messages = [
    ...dueSoon.map((b) => ({ chat: b.borrowerId, text: `⏰ “${title(b)}” is due back by ${date(b.dueAt)}.` })),
    ...overdue.map((b) => ({ chat: b.borrowerId, text: `📚 “${title(b)}” was due on ${date(b.dueAt)} — please return it soon.` })),
  ];
  if (overdue.length) {
    const list = overdue.map((b) => `• ${title(b)} — ${whoIs(club, b.borrowerId)}`).join("\n");
    messages.push({ chat: cfg().team, text: `Overdue today:\n${list}` });
  }
  let failed = 0;
  for (const { chat, text } of messages) {
    if (!(await tell(bot.api.sendMessage(chat, text)))) failed++;
  }
  return { dueSoon: dueSoon.length, overdue: overdue.length, failed };
}
