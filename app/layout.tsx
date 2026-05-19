import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "https://mtgoevents.vercel.app";
const defaultTitle =
  "MTGO Events — Magic Online Schedule, Challenges & Qualifiers";
const description =
  "Free weekly calendar of every Magic Online scheduled event — Challenges, Qualifiers, Preliminaries. Add to Google Calendar or subscribe via .ics.";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s — MTGO Events",
  },
  description,
  applicationName: "MTGO Events",
  keywords: [
    "MTGO",
    "Magic Online",
    "Magic the Gathering",
    "MTG schedule",
    "MTGO calendar",
    "MTGO schedule",
    "MTGO events",
    "Modern",
    "Legacy",
    "Pauper",
    "Standard",
    "Pioneer",
    "Vintage",
    "Challenge",
    "Qualifier",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "MTGO Events",
    title: defaultTitle,
    description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        {adsenseClient && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
