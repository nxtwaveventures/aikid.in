# Book Club bot — setup

1. **Reset the bot token** (it was pasted in chat): @BotFather → /revoke → @storylabclub_bot. Keep the new token private.
2. **Channel and team group** (Telegram):
   - New Channel "Story Lab Book Club", public, link e.g. t.me/storylabbookclub. Add @storylabclub_bot as admin (Post messages).
   - New Group "Story Lab Team" with Neha and Anamika. Add @storylabclub_bot. Send `/chatid` in the group once the bot is live (step 6) and note the number (starts with -100…).
3. **Google Sheet** (as storylabkid@gmail.com): follow the comment at the top of `scripts/book-club.gs` — run `setupBookClub`, then deploy as Web app. Note the Web app URL and the secret from the log.
   - If `scripts/book-club.gs` is changed later, redeploy it as a **new version**: Deploy → Manage deployments → edit (pencil) → Version: New version → Deploy. The Web app URL stays the same, so nothing in Vercel needs to change.
4. **Vercel env vars** (Project aikid-in-storylab → Settings → Environment Variables, Production + Preview):
   - TELEGRAM_BOT_TOKEN — from step 1
   - TELEGRAM_WEBHOOK_SECRET — any long random text (e.g. from a password generator)
   - TELEGRAM_CHANNEL_ID — `@` + the channel's public username, e.g. `@storylabbookclub`
   - TELEGRAM_TEAM_CHAT_ID — from step 6 (add it then, and redeploy)
   - UPI_ID — the UPI ID borrowers pay to
   - BOOKCLUB_SCRIPT_URL, BOOKCLUB_SCRIPT_SECRET — from step 3
   - CRON_SECRET — any long random text
5. **Deploy**, then run: `vercel env pull .env.local` and `node --env-file=.env.local scripts/telegram-setup.mjs https://www.aikid.in`
6. In the team group send `/chatid` → put the number in TELEGRAM_TEAM_CHAT_ID → redeploy.
7. **Test** with your own phone: /start → join → approve in team group → /add a book → approve → it appears in the channel and on aikid.in/book-club → borrow it → send any photo as "payment" → 💰 Paid → 📥 Returned.
8. Tell Claude it works → `telegramBot: "storylabclub_bot"` goes into `src/lib/site.ts` and the website switches to "Join on Telegram".

## Rules for editing the sheet by hand

- **Never delete rows** in Books or Borrows. Change the status instead. Payouts depend on these rows.
- **Don't edit the Sessions tab.** The bot uses it to track conversations in progress.
- **Don't rename tabs or reorder columns.** The bot reads them by position and name.
