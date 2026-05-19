import type { MetadataRoute } from "next";
import {
  fetchEvents,
  formatToSlug,
  KNOWN_FORMATS,
  type MtgoEvent,
} from "@/lib/events";
import { ORGANIZERS } from "@/lib/community";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "https://mtgoevents.com";

export const revalidate = 900;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ];

  const formatPages: MetadataRoute.Sitemap = KNOWN_FORMATS.map((f) => ({
    url: `${SITE_URL}/format/${formatToSlug(f)}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const communityPages: MetadataRoute.Sitemap = ORGANIZERS.map((o) => ({
    url: `${SITE_URL}/community/${o.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  let events: MtgoEvent[] = [];
  try {
    events = await fetchEvents();
  } catch {
    // skip event entries on upstream failure
  }
  const upcoming = events.filter(
    (e) => new Date(e.endUtc).getTime() >= Date.now()
  );

  const eventPages: MetadataRoute.Sitemap = upcoming.map((ev) => ({
    url: `${SITE_URL}/event/${ev.uid}`,
    lastModified: new Date(ev.startUtc),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...base, ...formatPages, ...communityPages, ...eventPages];
}
