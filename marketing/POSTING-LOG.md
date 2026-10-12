# Story Lab — content & launch log

## Instagram @storylabkid

| # | Date | Post | Cover | Music | Caption | Notes |
|---|------|------|-------|-------|---------|-------|
| 1 | 2026-10-10 | Reel — "Come, visit Story Lab" (`reels/03-come-visit-story-lab`) | Plain green first frame | None (silent) | Posted by Anamika as "Introduction"; replaced with full caption on 2026-10-11 | Video says **ages 0–10** (old range). Cover can only be changed in the app. |
| 2 | 2026-10-11 | Reel — "No return gift is better than a better child" (`reels/01-birthday-parties`) | "No return gift…" frame | Story Lab jingle | Full caption + hashtags | Video says **ages 0–10** |
| 3 | 2026-10-11 | Reel — "Screens tell stories. Humans tell better ones." (`reels/02-story-lab-online`) | Hook frame | Story Lab jingle | Full caption + hashtags | Video says **ages 0–10** |
| 4 | 2026-10-12 | Carousel (6 slides) — "5 things a story does for your child's brain" (`posts/carousel-brain`) | Slide 1 | — | Full caption, "save this", "tag a parent" | Ages 3–10 ✅ |
| 5 | 2026-10-12 | Reel — "Meet our mentors" (Pradnya & Dr. Tamanna) (`reels/04-meet-our-mentors`) | "Meet our mentors 💛" | Story Lab jingle | Full caption + hashtags | Ages 3–10 ✅ |

**Profile:** logo set as profile photo; bio "Live storytelling for kids 3–10 📖 / 🎂 Birthday story parties · 💻 Online ₹999 / Hindi & English · Women-founded 💛 / Human touch in the world of AI 👇" (updated to 3–10 on 2026-10-12).

**Pending in the Instagram app (mobile only):** bio link → `aikid.in`; display name "Story" → "Story Lab"; Reel 1 cover → signpost frame.

**Open decision:** re-make posts 1–3 at ages 3–10 and repost (then delete the old ones)?

Captions for posts 1–3: `reels/CAPTIONS.md`. Music: `reels/make_music.py` (original, royalty-free). Rendered `.mp4`/`.png`/`.jpg`/`.wav` files are gitignored — rebuild from the HTML sources.

## Website — aikid.in

- Live on Vercel (project `aikid-in-storylab`), repo `github.com/nxtwaveventures/aikid.in`, DNS at GoDaddy. Deploy with `vercel deploy --prod`.
- 2026-10-10: launched — signpost landing with clear CTAs, impact numbers, founders (Neha & Anamika), party quote (price hidden: `showPrice: false`), Story Lab Online ₹999, reviews (samples hidden in production), FAQ, Google Forms, scarcity ticker, logo + favicon, Instagram link.
- 2026-10-11: mentors Pradnya & Dr. Tamanna added with matching cards; nav kept on one line.
- 2026-10-12: age range changed to **3–10** everywhere (removed 0–2 group and under-4 FAQ).

## Google Forms (owned by storylabkid@gmail.com, email alerts on)

| Form | Link |
|------|------|
| Birthday party quote | https://forms.gle/R26R456sNMzwUhgE7 |
| Story Lab Online booking (₹999) | https://forms.gle/NCrVSHGXqoptdeKq5 |
| Feedback | https://forms.gle/LQFDAWVhdFHDLoj46 |
| Parent survey | https://forms.gle/hUa1dPuvPMP9qfyS8 |
| Storyteller hiring | https://forms.gle/H16w75e7eEk1u88y6 |

**Pending:** forms still offer ages 0–2 / "Under 1". Run `updateAgesTo3to10()` from `scripts/create-google-forms.gs` in the "Story Lab forms" Apps Script project (storylabkid). Do **not** re-run `createStoryLabForms` — it would create duplicate forms.

## Placeholders still to replace (src/lib/site.ts)

- WhatsApp number and email (not shown on the site right now)
- Impact numbers (100 stories, 200 kids…), `reviewCount: 100` — confirm they're real
- Availability: dates left, seats left, next batch date — keep true and update weekly
