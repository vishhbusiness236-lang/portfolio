import type { Metadata } from "next";
import { Inter, Instrument_Serif, Caveat } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
});
const hand = Caveat({ subsets: ["latin"], variable: "--font-hand" });

export const metadata: Metadata = {
  title: "Vishesh Meena • Portfolio",
  description:
    "Self-taught solo founder from Rajasthan. Building Krato, an AI QA tool for solo developers.",
  openGraph: {
    title: "Vishesh Meena • Portfolio",
    description: "Self-taught solo founder building Krato.",
    type: "website",
  },
  twitter: { card: "summary_large_image", creator: "@Visheshmeena23" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${serif.variable} ${hand.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}