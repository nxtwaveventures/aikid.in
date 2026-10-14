// Points Telegram at the website and sets the bot's commands and descriptions.
// Runs automatically after every production build on Vercel (npm "postbuild"),
// or by hand:  node --env-file=.env.local bin/telegram-setup.mjs https://www.aikid.in
const onVercelProduction = process.env.VERCEL_ENV === "production";
// Telegram does not follow redirects, so this must be the exact canonical host (aikid.in redirects to www).
const site = (process.argv[2] ?? (onVercelProduction ? "https://www.aikid.in" : ""))
  .replace(/\/+$/, "");
const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!site || !token || !secret) {
  if (!process.argv[2]) {
    // Local builds and production builds before the bot settings exist: nothing to do.
    if (onVercelProduction) console.log("Telegram setup skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_WEBHOOK_SECRET not set");
    process.exit(0);
  }
  console.error("Usage: node --env-file=.env.local bin/telegram-setup.mjs https://www.aikid.in (needs TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET)");
  process.exit(1);
}

const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

const steps = [
  ["setWebhook", { url: `${site}/api/telegram`, secret_token: secret, allowed_updates: ["message", "callback_query"] }],
  ["setMyCommands", { commands: [
    { command: "shelf", description: "Browse and borrow books" },
    { command: "add", description: "Share a novel" },
    { command: "mybooks", description: "Your books and earnings" },
    { command: "borrowed", description: "What you have out" },
    { command: "help", description: "How it works" },
  ] }],
  ["setMyShortDescription", { short_description: "Story Lab Book Club — novels shared between families for readers aged 10+." }],
  ["setMyDescription", { description: "Families share novels their kids have finished; other kids borrow them for a week. Owners earn every time their book is borrowed. Tap Start to join." }],
];

for (const [method, body] of steps) {
  const res = await api(method, body).catch((e) => ({ ok: false, description: String(e) }));
  console.log("Telegram", method, res.ok ? "✓" : res.description);
  // A failed Telegram call should never block a website deploy; only fail when run by hand.
  if (!res.ok && process.argv[2]) process.exitCode = 1;
}
