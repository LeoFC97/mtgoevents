import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteFooter from "@/components/site-footer";
import {
  findOrganizer,
  ORGANIZERS,
  templatesByOrganizer,
  getAllCommunityEvents,
  type RecurringEventTemplate,
} from "@/lib/community";
import {
  bucketOf,
  breadcrumbStructuredData,
  eventStructuredData,
  googleCalendarUrl,
  type MtgoEvent,
} from "@/lib/events";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "https://mtgoevents.com";

export const revalidate = 900;

export async function generateStaticParams() {
  return ORGANIZERS.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const organizer = findOrganizer(slug);
  if (!organizer) return {};
  const title = `${organizer.name} — MTGO Community Events`;
  const description = organizer.description;
  const url = `${siteUrl}/community/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      url,
      siteName: "MTGO Events",
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function formatDateTimeIn(iso: string, tz: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: tz,
  })} · ${d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  })}`;
}

function ScheduleLine({ template }: { template: RecurringEventTemplate }) {
  const day = [
    "Sundays",
    "Mondays",
    "Tuesdays",
    "Wednesdays",
    "Thursdays",
    "Fridays",
    "Saturdays",
  ][template.dayOfWeek];
  return (
    <div className="text-sm text-zinc-300">
      Every <strong className="text-zinc-100">{day}</strong> at{" "}
      <strong className="text-zinc-100">{template.localTime}</strong>{" "}
      ({template.tz.split("/").pop()?.replace("_", " ")})
    </div>
  );
}

export default async function CommunityOrganizerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const organizer = findOrganizer(slug);
  if (!organizer) notFound();

  const templates = templatesByOrganizer(slug);
  const now = Date.now();
  const allEvents = getAllCommunityEvents();
  const upcoming: MtgoEvent[] = allEvents
    .filter(
      (e) =>
        e.organizerSlug === slug && new Date(e.endUtc).getTime() >= now
    )
    .slice(0, 8);

  const breadcrumbSchema = breadcrumbStructuredData([
    { name: "MTGO Events", url: siteUrl },
    { name: "Community", url: `${siteUrl}/community/${slug}` },
    { name: organizer.name },
  ]);

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: organizer.name,
    description: organizer.description,
    url: `${siteUrl}/community/${slug}`,
    nationality: organizer.country,
    sameAs: [
      organizer.links.twitch,
      organizer.links.youtube,
      organizer.links.twitter,
      organizer.links.website,
    ].filter(Boolean),
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${organizer.name} upcoming MTGO events`,
    numberOfItems: upcoming.length,
    itemListElement: upcoming.map((ev, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: eventStructuredData(ev, siteUrl),
    })),
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
        <Link href="/" className="hover:text-zinc-300 hover:underline">
          ← All events
        </Link>
        <span>/</span>
        <span className="text-zinc-300">Community / {organizer.name}</span>
      </nav>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white"
          style={{ backgroundColor: organizer.color }}
        >
          {organizer.initials}
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {organizer.name}
          </h1>
          <p className="text-sm leading-relaxed text-zinc-300">
            {organizer.description}
          </p>
        </div>
      </header>

      <section className="flex flex-wrap gap-2">
        {organizer.links.twitch && (
          <a
            href={organizer.links.twitch}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:border-rose-500 hover:text-rose-300"
          >
            Twitch ↗
          </a>
        )}
        {organizer.links.youtube && (
          <a
            href={organizer.links.youtube}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:border-rose-500 hover:text-rose-300"
          >
            YouTube ↗
          </a>
        )}
        {organizer.links.twitter && (
          <a
            href={organizer.links.twitter}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:border-sky-500 hover:text-sky-300"
          >
            Twitter ↗
          </a>
        )}
        {organizer.links.telegram && (
          <a
            href={organizer.links.telegram}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:border-sky-500 hover:text-sky-300"
          >
            Telegram ↗
          </a>
        )}
        {organizer.links.signupBase && (
          <a
            href={organizer.links.signupBase}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:border-emerald-500 hover:text-emerald-300"
          >
            Tournament page ↗
          </a>
        )}
      </section>

      {templates.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            Recurring tournaments
          </h2>
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold text-zinc-100">
                  {tpl.name}{" "}
                  <span className="text-sm font-normal text-zinc-400">
                    · {tpl.format}
                  </span>
                </h3>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs uppercase tracking-wide text-emerald-300">
                  {tpl.entryFee}
                </span>
              </div>
              <ScheduleLine template={tpl} />
              <p className="text-sm leading-relaxed text-zinc-300">
                {tpl.description}
              </p>
              <dl className="grid grid-cols-2 gap-y-1 text-xs sm:grid-cols-3">
                <dt className="text-zinc-500">Rounds</dt>
                <dd className="col-span-1 text-zinc-300 sm:col-span-2">
                  {tpl.rounds}
                </dd>
                <dt className="text-zinc-500">Prizes</dt>
                <dd className="col-span-1 text-zinc-300 sm:col-span-2">
                  {tpl.prizes}
                </dd>
              </dl>
            </div>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight">
            Upcoming events
          </h2>
          <a
            href={`/api/feed.ics?source=community`}
            className="text-xs text-zinc-400 underline hover:text-zinc-200"
          >
            Subscribe to community feed (.ics)
          </a>
        </div>
        {upcoming.length === 0 ? (
          <p className="rounded-md border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
            No upcoming events scheduled in the next 60 days.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((ev) => (
              <li
                key={ev.uid}
                className="flex flex-wrap items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900/40 p-3"
              >
                <div className="flex flex-col gap-0.5">
                  <Link
                    href={`/event/${ev.uid}`}
                    className="text-sm font-medium text-zinc-100 hover:text-emerald-300 hover:underline"
                  >
                    {ev.summary}
                  </Link>
                  <time
                    dateTime={ev.startUtc}
                    className="text-xs tabular-nums text-zinc-400"
                  >
                    {formatDateTimeIn(ev.startUtc, "America/Sao_Paulo")} BRT
                  </time>
                </div>
                <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                  {bucketOf(ev.type)}
                </span>
                <div className="ml-auto flex flex-wrap gap-2">
                  {ev.signupUrl && (
                    <a
                      href={ev.signupUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 hover:border-emerald-500 hover:text-emerald-300"
                    >
                      Sign up ↗
                    </a>
                  )}
                  <a
                    href={googleCalendarUrl(ev)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 hover:border-emerald-500 hover:text-emerald-300"
                  >
                    + Calendar
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SiteFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
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
