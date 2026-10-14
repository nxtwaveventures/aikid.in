import type { Metadata } from "next";
import { Fraunces, Nunito } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const description =
  "Human touch in the world of AI. Live storytelling for kids aged 3–10: birthday party shows and Story Lab Online, 5 live sessions for ₹999.";

export const metadata: Metadata = {
  // TODO: set NEXT_PUBLIC_SITE_URL to your real domain so link previews resolve
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Story Lab — Human touch in the world of AI", template: "%s · Story Lab" },
  description,
  openGraph: {
    title: "Story Lab — live storytelling for kids",
    description,
    type: "website",
    locale: "en_IN",
    siteName: "Story Lab",
  },
  twitter: { card: "summary_large_image", title: "Story Lab — live storytelling for kids", description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${nunito.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
