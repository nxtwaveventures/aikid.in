// Story Lab Book Club bot. Parents chat privately; Story Lab acts from the team group.
import { Bot } from "grammy";
import { TEAM_BUTTON } from "./buttons";
import { cfg } from "./messages";
import { parents } from "./parents";
import { teamActions } from "./team";

export function createBot(token: string) {
  const bot = new Bot(token);
  // Errors must never escape handleUpdate (a 500 makes Telegram redeliver the update).
  const safe = bot.errorBoundary(async (err) => {
    console.error("[bookclub]", err.error);
    try {
      await err.ctx.reply("Something went wrong — please try again in a minute.");
    } catch {}
  });

  // In any group: tells the team the chat id to put in TELEGRAM_TEAM_CHAT_ID.
  safe.chatType(["group", "supergroup"]).command("chatid", (ctx) => ctx.reply(`Chat ID: ${ctx.chat.id}`));

  const dm = safe.chatType("private");
  const team = safe.filter((ctx) => String(ctx.chat?.id) === cfg().team);
  dm.use(parents);
  team.use(teamActions);
  // Any team button pressed outside the team chat.
  safe.callbackQuery(TEAM_BUTTON, (ctx) => ctx.answerCallbackQuery("Only the Story Lab team can do that."));

  return bot;
}

let cached: { token: string; bot: Bot } | undefined;
/** One bot per server instance, so grammY's getMe call isn't repeated on every update. */
export function getBot(token: string) {
  if (!cached || cached.token !== token) cached = { token, bot: createBot(token) };
  return cached.bot;
}
