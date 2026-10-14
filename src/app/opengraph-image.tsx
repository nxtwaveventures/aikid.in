import { ImageResponse } from "next/og";
import { inr, partyPriceLabel, site } from "@/lib/site";

// Link-preview card shown when the site is shared on WhatsApp, Instagram, etc.
export const alt = "Story Lab — Human touch in the world of AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const card = (bg: string, title: string, sub: string) => (
    <div style={{ display: "flex", flexDirection: "column", background: bg, borderRadius: 32, padding: "32px 40px", width: 470 }}>
      <div style={{ fontSize: 38, fontWeight: 700, color: "#2e3142" }}>{title}</div>
      <div style={{ fontSize: 28, color: "#6b6f80", marginTop: 8 }}>{sub}</div>
    </div>
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 90, background: "#fffdf9" }}>
        <div style={{ fontSize: 88, fontWeight: 700, color: "#2e3142" }}>Story Lab</div>
        <div style={{ fontSize: 36, color: "#6b6f80", marginTop: 16 }}>{`Live storytelling for kids 3–10 · ${site.tagline}`}</div>
        <div style={{ display: "flex", gap: 40, marginTop: 64 }}>
          {card("#fce3d8", "Birthday Parties", partyPriceLabel)}
          {card("#ddf1e6", "Story Lab Online", `${site.online.sessions} sessions · ${inr(site.online.price)}`)}
        </div>
      </div>
    ),
    size,
  );
}
