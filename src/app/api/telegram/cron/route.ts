import { getBot } from "@/lib/bookclub/bot";
import { sendReminders } from "@/lib/bookclub/bot/reminders";

// Vercel Cron, 9:00 IST daily (see vercel.json).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return new Response("Bot not configured", { status: 503 });
  return Response.json(await sendReminders(getBot(token)));
}
