import type { Metadata } from "next";
import Link from "next/link";
import AdUnit from "@/components/ad-unit";
import SiteFooter from "@/components/site-footer";
import CalendarView from "./calendar-view";
import {
  eventStructuredData,
  fetchEvents,
  formatToSlug,
  KNOWN_FORMATS,
  type MtgoEvent,
} from "@/lib/events";
import { ORGANIZERS } from "@/lib/community";

export const revalidate = 900;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "https://mtgoevents.com";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  let events: MtgoEvent[] = [];
  let error: string | null = null;
  try {
    events = await fetchEvents();
  } catch (err) {
    error = err instanceof Error ? err.message : "unknown error";
  }

  const now = Date.now();
  const upcomingFormats = new Set(
    events
      .filter((e) => new Date(e.endUtc).getTime() >= now)
      .map((e) => e.format)
  );
  const visibleFormats = KNOWN_FORMATS.filter((f) => upcomingFormats.has(f));

  const upcoming = events.filter((e) => new Date(e.endUtc).getTime() >= now);

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "MTGO Events",
        description:
          "Weekly calendar of Magic Online scheduled events with one-click Google Calendar export and .ics subscription.",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "MTGO Events",
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/icon.svg`,
        },
      },
      {
        "@type": "ItemList",
        name: "Upcoming MTGO events",
        numberOfItems: upcoming.length,
        itemListElement: upcoming.slice(0, 25).map((ev, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: eventStructuredData(ev, siteUrl),
        })),
      },
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          MTGO Events
        </h1>
        <p className="text-sm text-zinc-400">
          Weekly calendar of Magic Online scheduled events. Click any event to
          add it to your Google Calendar, or subscribe to a filtered .ics feed.
        </p>
      </header>

      {visibleFormats.length > 0 && (
        <nav
          aria-label="Browse by format"
          className="flex flex-wrap items-center gap-2"
        >
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Browse by format
          </span>
          {visibleFormats.map((f) => (
            <Link
              key={f}
              href={`/format/${formatToSlug(f)}`}
              className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
            >
              {f}
            </Link>
          ))}
        </nav>
      )}

      {ORGANIZERS.length > 0 && (
        <nav
          aria-label="Community organizers"
          className="flex flex-wrap items-center gap-2"
        >
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Community hosts
          </span>
          {ORGANIZERS.map((o) => (
            <Link
              key={o.slug}
              href={`/community/${o.slug}`}
              className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
            >
              <span
                className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white"
                style={{ backgroundColor: o.color }}
              >
                {o.initials}
              </span>
              {o.name}
            </Link>
          ))}
        </nav>
      )}

      <AdUnit
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER}
        className="min-h-[90px]"
      />
      {error ? (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          Failed to load events: {error}
        </div>
      ) : (
        <CalendarView events={events} />
      )}
      <AdUnit
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER}
        className="min-h-[90px]"
      />
      <SiteFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
    </main>
  );
}
