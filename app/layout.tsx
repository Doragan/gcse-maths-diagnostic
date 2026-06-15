import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from "../components/CookieBanner";
import Analytics from "../components/Analytics";
import DevModeToggle from "../components/DevModeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Mathsense — GCSE Maths practice with instant feedback",
    template: "%s — Mathsense",
  },
  description:
    "Practise GCSE Maths with instant feedback, worked solutions, and a learning path that targets your weak spots. Free to try — no signup needed.",
  openGraph: {
    type: "website",
    siteName: "Mathsense",
    title: "Mathsense — GCSE Maths practice with instant feedback",
    description:
      "Practise GCSE Maths with instant feedback, worked solutions, and a learning path that targets your weak spots. Free to try — no signup needed.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mathsense — GCSE Maths practice with instant feedback",
    description:
      "Practise GCSE Maths with instant feedback. Free to try — no signup needed.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

        {/* Google Analytics 4 is loaded by CookieBanner AFTER consent — the
            single GA loader. Page views + events go through lib/analytics. */}

        {children}

        {/* Tracks a page_view event on every route change */}
        <Analytics />

        {/* Dev mode badge + Ctrl+Alt+D shortcut */}
        <DevModeToggle />

        <CookieBanner />
      </body>
    </html>
  );
}
