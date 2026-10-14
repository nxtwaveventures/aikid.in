import { timingSafeEqual } from "node:crypto";
import { webhookCallback } from "grammy";
import { getBot } from "@/lib/bookclub/bot";

// Telegram calls this for every message and button press.
export async function POST(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
  // Without a secret grammY would accept anyone, so refuse to run.
  if (!token || !secretToken) return new Response("Bot not configured", { status: 503 });
  // Check the secret before anything else (grammY would call Telegram's getMe first).
  const sent = Buffer.from(req.headers.get("x-telegram-bot-api-secret-token") ?? "");
  const want = Buffer.from(secretToken);
  if (sent.length !== want.length || !timingSafeEqual(sent, want)) return new Response("Unauthorized", { status: 401 });
  const handle = webhookCallback(getBot(token), "std/http", { secretToken, onTimeout: "return", timeoutMilliseconds: 9000 });
  return handle(req);
}
