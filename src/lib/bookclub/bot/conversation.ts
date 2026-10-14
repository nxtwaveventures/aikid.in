// Runs the join and add-a-book conversations (flow.ts) over Telegram, keeping progress in the Sessions tab.
import { InlineKeyboard, Keyboard, type ChatTypeContext, type Context } from "grammy";
import { advance, type Ask, type Input, type Step } from "@/lib/bookclub/flow";
import { findDuplicate, matchKey } from "@/lib/bookclub/rules";
import * as store from "@/lib/bookclub/store";
import type { Club } from "@/lib/bookclub/store";
import type { Book, Member } from "@/lib/bookclub/types";
import { BUTTON, callback } from "./buttons";
import { HELP, alreadyListed, cfg, post, tell, who, whoIs } from "./messages";

export type ParentContext = ChatTypeContext<Context, "private">;
type Draft = Record<string, string>;

/** Saves the conversation's progress and asks the next question, or finishes it. */
export async function show(ctx: ParentContext, step: Step, club?: Club) {
  const id = String(ctx.from.id);
  // Finish before ending the session, so a failed save leaves the parent something to retry.
  if (step.done) {
    const { flow, draft } = step.done;
    if (flow === "join") await finishJoin(ctx, draft);
    else await finishAdd(ctx, draft, club ?? (await store.readAll()));
    return store.remove("Sessions", id);
  }
  if (step.session) await store.save("Sessions", step.session);
  else await store.remove("Sessions", id);
  if (!step.ask) return ctx.reply(step.error ?? HELP);
  const text = step.error ? `${step.error}\n\n${step.ask.text}` : step.ask.text;
  return ctx.reply(text, { reply_markup: keyboardFor(step.ask) });
}

/** Feeds the parent's answer into their conversation, or shows help if they aren't in one. */
export async function answer(ctx: ParentContext, input: Input) {
  const id = String(ctx.from.id);
  const club = await store.readAll();
  const session = club.sessions.find((s) => s.telegramId === id);
  if (!session) return ctx.reply(HELP);
  const next = advance(session, input);
  if (next.titleAndAuthor) {
    const { title, author } = next.titleAndAuthor;
    const duplicate = findDuplicate(club.books, matchKey(title, author));
    if (duplicate) {
      await store.remove("Sessions", id);
      return ctx.reply(alreadyListed(duplicate.title));
    }
  }
  return show(ctx, next, club);
}

function keyboardFor(ask: Ask) {
  if (ask.contact) return new Keyboard().requestContact("📱 Share my phone number").resized().oneTime();
  if (!ask.options && !ask.skippable) return { remove_keyboard: true as const };
  const keyboard = new InlineKeyboard();
  ask.options?.forEach((option) => keyboard.text(option, callback(BUTTON.choose, option)));
  if (ask.skippable) keyboard.text("Skip", BUTTON.skip);
  return keyboard;
}

async function finishJoin(ctx: ParentContext, draft: Draft) {
  const id = String(ctx.from.id);
  const member: Member = {
    telegramId: id, name: draft.name, flat: draft.flat, phone: draft.phone, childName: draft.childName,
    status: "pending", joinedAt: new Date().toISOString(),
  };
  await store.save("Members", member);
  await ctx.reply("Thanks! Story Lab will approve you shortly — we'll message you here. 🙂", { reply_markup: { remove_keyboard: true } });
  const child = member.childName ? ` (child: ${member.childName})` : "";
  const decide = new InlineKeyboard()
    .text("✅ Approve", callback(BUTTON.approveMember, id))
    .text("❌ Decline", callback(BUTTON.declineMember, id));
  await tell(ctx.api.sendMessage(cfg().team, `🙋 New member: ${who(member)}${child} · ${member.phone}`, { reply_markup: decide }));
}

async function finishAdd(ctx: ParentContext, draft: Draft, club: Club) {
  const ownerId = String(ctx.from.id);
  const book: Book = {
    id: "", title: draft.title, author: draft.author, matchKey: matchKey(draft.title, draft.author), condition: draft.condition,
    photoFileId: draft.photoFileId, ownerId, status: "pending", addedAt: new Date().toISOString(),
  };
  // The sheet refuses a duplicate, including one added since the title was checked.
  const id = await store.insert("Books", book, "B");
  if (!id) return ctx.reply(alreadyListed(book.title));
  await ctx.reply(`Thanks! We'll check “${book.title}” and let you know when it's on the shelf.`);
  const caption = `📖 New book ${id}: “${book.title}” by ${book.author} (${book.condition}) from ${whoIs(club, ownerId)}`;
  const decide = new InlineKeyboard()
    .text("✅ Approve", callback(BUTTON.listBook, id))
    .text("🚫 Not 10+", callback(BUTTON.rejectBook, id));
  await tell(post(ctx.api, cfg().team, book.photoFileId, caption, decide));
}
