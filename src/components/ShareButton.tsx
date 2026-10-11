"use client";

import { site } from "@/lib/site";

// Opens the native share sheet on phones, falls back to a WhatsApp share link.
export default function ShareButton({ className = "", label = "Share with a parent friend" }: { className?: string; label?: string }) {
  async function share() {
    const url = window.location.origin;
    const text = `Found this for the kids 👇 Story Lab — live storytellers for birthday parties and small online story sessions (ages 3–10). ${site.tagline}.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: site.name, text, url });
        return;
      } catch {
        // user cancelled — fall through to nothing
        return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener");
  }

  return (
    <button type="button" onClick={share} className={className}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.3-.5 0-.9.2-3-.6-2.5-1-4.1-3.6-4.2-3.8-.1-.2-1-1.3-1-2.5s.6-1.8.9-2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2.1 1.3 2.4 1.4.3.2.5.1.6 0l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z" />
      </svg>
      {label}
    </button>
  );
}
