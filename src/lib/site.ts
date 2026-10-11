// Business details used across the site. Update these before going live.
export const site = {
  name: "Story Lab",
  tagline: "Human touch in the world of AI",
  reviewCount: 100, // TODO: your real number of parent reviews (shown as "100+ reviews" in the nav)
  whatsapp: "919999999999", // TODO: real WhatsApp number, country code first, no "+"
  email: "hello@storylab.in", // TODO: real contact email
  city: "Bengaluru", // TODO: cities you serve
  instagram: "storylabkid",
  languages: ["English", "Hindi"],
  // Google Forms owned by storylabkid@gmail.com (responses go to a linked Sheet for each)
  forms: {
    party: "https://forms.gle/R26R456sNMzwUhgE7",
    online: "https://forms.gle/NCrVSHGXqoptdeKq5",
    feedback: "https://forms.gle/LQFDAWVhdFHDLoj46",
    survey: "https://forms.gle/hUa1dPuvPMP9qfyS8",
    hiring: "https://forms.gle/H16w75e7eEk1u88y6",
  },
  party: {
    // While false, parties show "Get a free quote" (via the Google Form) instead of a price.
    showPrice: false,
    price: 10000,
    duration: "60–75 minutes",
    kids: "up to 30 kids",
    ages: "3–10 years",
    // Availability shown across the site. Keep this TRUE and up to date —
    // fake scarcity is a "false urgency" dark pattern (illegal under India's CCPA 2023 guidelines).
    status: "Weekends are almost fully booked", // TODO: update weekly
    slotsLeftThisMonth: 2, // TODO: real number of open weekend dates; 0 shows "Fully booked"
  },
  online: {
    price: 999,
    sessions: 5,
    perSession: "40 minutes",
    ages: "3–10 years",
    // Next batch — same honesty rule as above.
    nextBatch: "Sat 7 Nov", // TODO: real start date
    seatsTotal: 6,
    seatsLeft: 3, // TODO: update as parents book; 0 shows "Batch full — join the waitlist"
  },
};

// Founders. To add a photo, put it in /public/founders/ and set `photo: "/founders/neha.jpg"`.
export const founders: { name: string; role: string; photo?: string }[] = [
  { name: "Neha", role: "Co-founder · Storyteller · Story Lab" },
  { name: "Anamika", role: "Co-founder · Storyteller · Story Lab" },
];

// Mentors. Same photo rule as founders: /public/mentors/<name>.jpg
export const mentors: { name: string; role: string; bio: string; photo?: string }[] = [
  {
    name: "Pradnya",
    role: "Storytelling mentor",
    bio: "Our storytelling guru and a mother of two. She guides how every story leaves kids with real learning — mental models they keep, and smart use of modern tech.",
  },
  {
    name: "Dr. Tamanna",
    role: "Radiologist · Mentor",
    bio: "A radiologist and a mother of two. She guides how we turn tricky scientific concepts into simple stories kids actually understand and remember.",
  },
];

// Impact counters for the second section. TODO: confirm these are your real
// totals before launch, and bump them as you grow — they're shown as "100+" etc.
export const impact = [
  { value: 100, label: "Stories told", emoji: "📖" },
  { value: 200, label: "Kids who leaned in", emoji: "🧒" },
  { value: 10, label: "Birthday parties", emoji: "🎂" },
  { value: 500, label: "Happy parents", emoji: "💛" },
  { value: 1000, label: "Happy relatives", emoji: "👵" },
];

// Parent reviews. Entries marked `sample: true` are placeholders: they show in
// local dev with a SAMPLE badge and are never rendered in production.
// Replace them with real feedback (with the parent's permission).
export type Review = {
  quote: string;
  name: string;
  detail: string; // e.g. "Mother of Aarav, 6 · Birthday party"
  kind: "party" | "online";
  sample?: boolean;
};

export const reviews: Review[] = [
  {
    quote: "The kids were glued for the full hour — even the ones who never sit still. My son still asks for 'his' story every night.",
    name: "Sample parent",
    detail: "Parent of a 6-year-old · Birthday party",
    kind: "party",
    sample: true,
  },
  {
    quote: "By the fifth session she performed her own story for the whole family. Her confidence has really grown.",
    name: "Sample parent",
    detail: "Parent of an 8-year-old · Story Lab Online",
    kind: "online",
    sample: true,
  },
  {
    quote: "Even the shy 4-year-olds joined in by the end. A calm, happy party for once.",
    name: "Sample parent",
    detail: "Parent of a 4-year-old · Birthday party",
    kind: "party",
    sample: true,
  },
];

// Sessions you've run. Same `sample` rule as reviews.
export type PastSession = {
  title: string;
  kind: "party" | "online";
  when: string; // e.g. "Sep 2026"
  where: string; // e.g. "Whitefield, Bengaluru" or "Online"
  kids: number;
  emoji: string;
  sample?: boolean;
};

export const pastSessions: PastSession[] = [
  { title: "Gappu the Grumpy Elephant — 5th birthday", kind: "party", when: "Sample date", where: "Sample venue", kids: 22, emoji: "🐘", sample: true },
  { title: "Story Makers batch — 5 sessions", kind: "online", when: "Sample date", where: "Online", kids: 6, emoji: "💻", sample: true },
  { title: "Rani and the Rain Dragon — 8th birthday", kind: "party", when: "Sample date", where: "Sample venue", kids: 18, emoji: "🐉", sample: true },
  { title: "Story Explorers circle", kind: "online", when: "Sample date", where: "Online", kids: 5, emoji: "🌙", sample: true },
];

const showSamples = process.env.NODE_ENV !== "production";
export const visibleReviews = reviews.filter((r) => !r.sample || showSamples);
export const visibleSessions = pastSessions.filter((s) => !s.sample || showSamples);

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

// What to show wherever the party price would appear.
export const partyPriceLabel = site.party.showPrice ? inr(site.party.price) : "Free quote";

export const whatsappLink = (text: string) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
