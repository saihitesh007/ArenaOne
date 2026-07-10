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
    description:
      "AI-powered stadium companion for FIFA World Cup 2026. Fan navigation, multilingual AI assistant, crowd intelligence, incident management, and post-match transport guidance — all in one operational shell.",
    type: "website",
    url: "https://arena-one-6xpd.vercel.app",
    siteName: "ArenaOne",
  },
  twitter: {
    card: "summary_large_image",
    title: "ArenaOne — FIFA World Cup 2026",
    description:
      "AI-powered stadium operations for the FIFA World Cup 2026. Fan navigation, crowd intelligence, and multilingual assistance.",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
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
