import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteFooter from "@/components/site-footer";
import {
  breadcrumbStructuredData,
  bucketOf,
  eventStructuredData,
  FORMAT_DESCRIPTIONS,
  fetchEvents,
  formatToSlug,
  googleCalendarUrl,
  KNOWN_FORMATS,
  slugToFormat,
  type MtgoEvent,
} from "@/lib/events";

export const revalidate = 900;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "https://mtgoevents.com";

export async function generateStaticParams() {
  return KNOWN_FORMATS.map((f) => ({ slug: formatToSlug(f) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const format = slugToFormat(slug);
  if (!format) return {};

  const title = `${format} on Magic Online — Weekly Schedule`;
  const description = `Upcoming ${format} events on MTGO: Challenges, Qualifiers, Preliminaries, and more. Auto-converted to your timezone, with one-click Google Calendar export and a .ics subscribe feed.`;
  const url = `${siteUrl}/format/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: "MTGO Events",
      title,
      description,
    },
    twitter: { card: "summary", title, description },
  };
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })} · ${d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  })} UTC`;
}

export default async function FormatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const format = slugToFormat(slug);
  if (!format) notFound();

  let allEvents: MtgoEvent[] = [];
  try {
    allEvents = await fetchEvents();
  } catch {
    // gracefully degrade — page still renders without events
  }

  const now = Date.now();
  const events = allEvents.filter(
    (e) => e.format === format && new Date(e.endUtc).getTime() >= now
  );

  const description = FORMAT_DESCRIPTIONS[format];

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${format} events on Magic Online`,
    numberOfItems: events.length,
    itemListElement: events.slice(0, 20).map((ev, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: eventStructuredData(ev, siteUrl),
    })),
  };

  const breadcrumbSchema = breadcrumbStructuredData([
    { name: "MTGO Events", url: siteUrl },
    { name: format, url: `${siteUrl}/format/${slug}` },
  ]);

  const otherFormats = KNOWN_FORMATS.filter((f) => f !== format);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
        <Link href="/" className="hover:text-zinc-300 hover:underline">
          ← All events
        </Link>
        <span>/</span>
        <span className="text-zinc-300">{format}</span>
      </nav>

      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {format} on Magic Online
        </h1>
        {description && (
          <p className="text-sm leading-relaxed text-zinc-300">{description}</p>
        )}
        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            href={`/?formats=${encodeURIComponent(format)}`}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:border-emerald-500 hover:text-emerald-300"
          >
            View weekly calendar →
          </Link>
          <a
            href={`/api/feed.ics?formats=${encodeURIComponent(format)}`}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:border-emerald-500 hover:text-emerald-300"
          >
            Subscribe to .ics feed
          </a>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          Upcoming {format} events
        </h2>
        {events.length === 0 ? (
          <p className="rounded-md border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
            No upcoming {format} events scheduled right now. Check back soon —
            the feed refreshes every 15 minutes.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {events.map((ev) => (
              <li
                key={ev.uid}
                className="flex flex-wrap items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900/40 p-3"
              >
                <div className="flex flex-col gap-0.5">
                  <Link
                    href={`/event/${ev.uid}`}
                    className="text-sm font-medium text-zinc-100 hover:text-emerald-300 hover:underline"
                  >
                    {ev.type}
                  </Link>
                  <time
                    dateTime={ev.startUtc}
                    className="text-xs tabular-nums text-zinc-400"
                  >
                    {formatDateTime(ev.startUtc)}
                  </time>
                </div>
                <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                  {bucketOf(ev.type)}
                </span>
                <a
                  href={googleCalendarUrl(ev)}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 hover:border-emerald-500 hover:text-emerald-300"
                >
                  + Google Calendar
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm uppercase tracking-wide text-zinc-400">
          Other formats
        </h2>
        <ul className="flex flex-wrap gap-2">
          {otherFormats.map((f) => (
            <li key={f}>
              <Link
                href={`/format/${formatToSlug(f)}`}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
              >
                {f}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <SiteFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </main>
  );
}
