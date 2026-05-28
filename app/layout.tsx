import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  title: "Mathsense",
  description: "GCSE Maths Diagnostic Tool",
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

        {/* ── Google Analytics 4 ───────────────────────────────────────────────
            Only loaded when NEXT_PUBLIC_GA_ID is set in .env.local.
            send_page_view is disabled here — the Analytics component handles
            all page views (including the initial load) so SPA navigations
            are tracked correctly.
        ─────────────────────────────────────────────────────────────────────── */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { send_page_view: false });
              `}
            </Script>
          </>
        )}

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
