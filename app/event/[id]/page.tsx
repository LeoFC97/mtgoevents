import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteFooter from "@/components/site-footer";
import {
  breadcrumbStructuredData,
  bucketOf,
  eventStructuredData,
  fetchEvents,
  findEvent,
  formatToSlug,
  googleCalendarUrl,
} from "@/lib/events";

export const revalidate = 900;
export const dynamicParams = true;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "https://mtgoevents.com";

export async function generateStaticParams() {
  try {
    const events = await fetchEvents();
    return events.map((e) => ({ id: e.uid }));
  } catch {
    return [];
  }
}

function formatDateLong(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await findEvent(id);
  if (!event) return {};

  const title = `${event.summary} — ${formatDateLong(event.startUtc)}`;
  const description = `${event.summary} on Magic Online — ${formatDateLong(event.startUtc)} at ${formatTime(event.startUtc)} UTC. Add to your Google Calendar or subscribe to the full feed.`;
  const url = `${siteUrl}/event/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName: "MTGO Events",
      title,
      description,
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await findEvent(id);
  if (!event) notFound();

  const schema = eventStructuredData(event, siteUrl);
  const breadcrumbSchema = breadcrumbStructuredData([
    { name: "MTGO Events", url: siteUrl },
    {
      name: event.format,
      url: `${siteUrl}/format/${formatToSlug(event.format)}`,
    },
    { name: event.summary },
  ]);
  const isPast = new Date(event.endUtc).getTime() < Date.now();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
        <Link href="/" className="hover:text-zinc-300 hover:underline">
          All events
        </Link>
        <span>/</span>
        <Link
          href={`/format/${formatToSlug(event.format)}`}
          className="hover:text-zinc-300 hover:underline"
        >
          {event.format}
        </Link>
        <span>/</span>
        <span className="text-zinc-300">{event.type}</span>
      </nav>

      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {event.summary}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-300">
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs uppercase tracking-wide text-emerald-300">
            {event.format}
          </span>
          <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs uppercase tracking-wide text-zinc-400">
            {bucketOf(event.type)}
          </span>
          {isPast && (
            <span className="text-xs text-zinc-500">(this event has ended)</span>
          )}
        </div>
      </header>

      <section className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="text-sm text-zinc-400">When</div>
        <time dateTime={event.startUtc} className="text-base text-zinc-100">
          {formatDateLong(event.startUtc)}
        </time>
        <div className="text-sm tabular-nums text-zinc-300">
          Starts at {formatTime(event.startUtc)} UTC
        </div>
        <div className="pt-2 text-xs text-zinc-500">
          Click &ldquo;+ Google Calendar&rdquo; below to add this event in your
          local timezone.
        </div>
      </section>

      {!isPast && (
        <section className="flex flex-wrap gap-2">
          <a
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 hover:border-emerald-500 hover:text-emerald-300"
          >
            + Google Calendar
          </a>
          <a
            href={`/api/feed.ics?formats=${encodeURIComponent(event.format)}`}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 hover:border-emerald-500 hover:text-emerald-300"
          >
            Subscribe to {event.format} feed
          </a>
          <Link
            href={`/format/${formatToSlug(event.format)}`}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 hover:border-emerald-500 hover:text-emerald-300"
          >
            More {event.format} events
          </Link>
        </section>
      )}

      <SiteFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </main>
  );
}
