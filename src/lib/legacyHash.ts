// Old single-page anchors (already shared on WhatsApp) → their new pages.
// "#about" is the Impact section, which stays on Home.
const map: Record<string, string> = {
  parties: "/parties",
  online: "/online",
  faq: "/faq",
  book: "/parties#book",
  founders: "/about#founders",
  reviews: "/about#reviews",
  ages: "/about#ages",
};

export function legacyHashPath(hash: string): string | null {
  const key = hash.replace(/^#/, "").toLowerCase();
  return Object.hasOwn(map, key) ? map[key] : null;
}
