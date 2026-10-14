// One-off: points Telegram at the website and sets the bot's commands and descriptions.
// Run after `vercel env pull .env.local`:  node --env-file=.env.local scripts/telegram-setup.mjs https://www.aikid.in
const site = process.argv[2];
const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
if (!site || !token || !secret) {
  console.error("Usage: node --env-file=.env.local scripts/telegram-setup.mjs https://www.aikid.in (needs TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET)");
  process.exit(1);
}
const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

const steps = [
  ["setWebhook", { url: `${site}/api/telegram`, secret_token: secret, allowed_updates: ["message", "callback_query"], drop_pending_updates: true }],
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
  const res = await api(method, body);
  console.log(method, res.ok ? "✓" : res);
}
