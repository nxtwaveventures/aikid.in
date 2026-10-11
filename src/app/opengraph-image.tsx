import { ImageResponse } from "next/og";
import { partyPriceLabel, site } from "@/lib/site";

// Link-preview card shown when the site is shared on WhatsApp, Instagram, etc.
export const alt = "Story Lab — Human touch in the world of AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const sign = (text: string, sub: string, rotate: string) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "#a8846c",
        borderRadius: 18,
        padding: "18px 36px",
        boxShadow: "0 8px 0 #7d5c47",
        transform: `rotate(${rotate})`,
        width: 440,
      }}
    >
      <div style={{ fontSize: 36, fontWeight: 800, color: "#3a2216" }}>{text}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#5a3b2a", marginTop: 4 }}>{sub}</div>
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(180deg, #3f9469 0%, #3f9469 55%, #2b5c48 55%, #1e4536 100%)",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: 560 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#f2a531", letterSpacing: 4 }}>STORY LAB</div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 76, fontWeight: 900, color: "white", lineHeight: 1.05, marginTop: 16 }}>
            <span>Come, visit</span>
            <span>Story Lab</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 30, color: "rgba(255,255,255,0.9)", marginTop: 24 }}>
            <span>Human touch in the world of AI</span>
            <span>Storytelling for ages 3–10</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 34 }}>
          {sign("Birthday Story Parties", `${partyPriceLabel} · we come to you`, "2deg")}
          {sign("Story Lab Online", `5 live sessions · ₹${site.online.price}`, "-3deg")}
        </div>
      </div>
    ),
    size,
  );
}
