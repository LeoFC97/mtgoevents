import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "https://mtgoevents.vercel.app";
const description =
  "Weekly calendar of Magic Online scheduled events. Subscribe by .ics or add any event to Google Calendar in one click.";

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
    default: "MTGO Events — Magic Online weekly schedule",
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
    "Modern",
    "Legacy",
    "Pauper",
    "Standard",
    "Challenge",
    "Qualifier",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "MTGO Events",
    title: "MTGO Events — Magic Online weekly schedule",
    description,
  },
  twitter: {
    card: "summary",
    title: "MTGO Events — Magic Online weekly schedule",
    description,
  },
  robots: { index: true, follow: true },
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
      </body>
    </html>
  );
}
