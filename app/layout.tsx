import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ArenaOne — FIFA World Cup 2026",
  description:
    "Everything you need. One place. AI-powered stadium operations for the FIFA World Cup 2026 — navigation, crowd intelligence, incident management, and multilingual fan assistance.",
  keywords: [
    "FIFA World Cup 2026",
    "stadium operations",
    "AI assistant",
    "crowd management",
    "fan experience",
    "ArenaOne",
  ],
  authors: [{ name: "ArenaOne Team" }],
  openGraph: {
    title: "ArenaOne — FIFA World Cup 2026",
    description: "AI-powered stadium operations for the FIFA World Cup 2026.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
