import { getBot, sendReminders } from "@/lib/bookclub/bot";

// Vercel Cron, 9:00 IST daily (see vercel.json).
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return new Response("Bot not configured", { status: 503 });
  return Response.json(await sendReminders(getBot(token)));
}
