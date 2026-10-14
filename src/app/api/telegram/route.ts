import { webhookCallback } from "grammy";
import { createBot } from "@/lib/bookclub/bot";

// Telegram calls this for every message and button press.
export async function POST(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return new Response("Bot not configured", { status: 503 });
  const handle = webhookCallback(createBot(token), "std/http", { secretToken: process.env.TELEGRAM_WEBHOOK_SECRET });
  return handle(req);
}
