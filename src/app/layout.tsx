import type { Metadata } from "next";
import { Fraunces, Lilita_One, Nunito } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const lilita = Lilita_One({
  variable: "--font-lilita",
  subsets: ["latin"],
  weight: "400",
});

const description =
  "Human touch in the world of AI. Live storytelling for kids aged 3–10: birthday party shows and Story Lab Online, 5 live sessions for ₹999.";

export const metadata: Metadata = {
  // TODO: set NEXT_PUBLIC_SITE_URL to your real domain so link previews resolve
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Story Lab — Human touch in the world of AI",
  description,
  openGraph: {
    title: "Come, visit Story Lab 🎂📖",
    description,
    type: "website",
    locale: "en_IN",
    siteName: "Story Lab",
  },
  twitter: { card: "summary_large_image", title: "Come, visit Story Lab", description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${nunito.variable} ${lilita.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* lets CSS hide .reveal elements only when JS will reveal them */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
