export type MtgoEvent = {
  uid: string;
  summary: string;
  format: string;
  type: string;
  startUtc: string;
  endUtc: string;
};

const FORMATS = [
  "Duel Commander",
  "Phantom Sealed",
  "Premodern",
  "Pioneer",
  "Modern",
  "Legacy",
  "Limited",
  "Pauper",
  "Standard",
  "Vintage",
  "Commander",
  "Cube",
];

export const KNOWN_FORMATS = FORMATS;

export const TYPE_BUCKETS = [
  "Preliminary",
  "Challenge",
  "Showcase",
  "Qualifier",
  "Super Qualifier",
  "Trial",
  "Championship",
] as const;

export type TypeBucket = (typeof TYPE_BUCKETS)[number] | "Other";

export function bucketOf(type: string): TypeBucket {
  if (/Preliminary/i.test(type)) return "Preliminary";
  if (/Showcase/i.test(type)) return "Showcase";
  if (/Super Qualifier/i.test(type)) return "Super Qualifier";
  if (/Qualifier/i.test(type)) return "Qualifier";
  if (/Challenge/i.test(type)) return "Challenge";
  if (/Trial/i.test(type)) return "Trial";
  if (/Championship/i.test(type)) return "Championship";
  return "Other";
}

function parseSummary(summary: string): { format: string; type: string } {
  for (const fmt of FORMATS) {
    if (summary.startsWith(fmt + " ") || summary === fmt) {
      return { format: fmt, type: summary.slice(fmt.length).trim() || "Event" };
    }
  }
  return { format: "Other", type: summary };
}

function parseIcsDate(value: string): string {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!m) throw new Error(`Bad ICS date: ${value}`);
  const [, y, mo, d, h, mi, s] = m;
  return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)).toISOString();
}

export function parseIcs(ics: string): MtgoEvent[] {
  const blocks = ics.split(/BEGIN:VEVENT/).slice(1);
  const events: MtgoEvent[] = [];
  for (const raw of blocks) {
    const body = raw.split("END:VEVENT")[0];
    const get = (key: string) => {
      const re = new RegExp(`^${key}:(.+)$`, "m");
      const match = body.match(re);
      return match ? match[1].trim() : "";
    };
    const uid = get("UID");
    const summary = get("SUMMARY");
    const dtStart = get("DTSTART");
    const dtEnd = get("DTEND");
    if (!uid || !summary || !dtStart || !dtEnd) continue;
    const { format, type } = parseSummary(summary);
    events.push({
      uid,
      summary,
      format,
      type,
      startUtc: parseIcsDate(dtStart),
      endUtc: parseIcsDate(dtEnd),
    });
  }
  return events.sort((a, b) => a.startUtc.localeCompare(b.startUtc));
}

export async function fetchEvents(): Promise<MtgoEvent[]> {
  const res = await fetch("https://www.mtgo.com/calendar.ics", {
    next: { revalidate: 900 },
  });
  if (!res.ok) throw new Error(`MTGO feed responded ${res.status}`);
  const text = await res.text();
  return parseIcs(text);
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function toGcalDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

export function googleCalendarUrl(event: MtgoEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.summary,
    dates: `${toGcalDate(event.startUtc)}/${toGcalDate(event.endUtc)}`,
    details: `MTGO scheduled event.\nSource: https://www.mtgo.com/calendar`,
    location: "Magic Online",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function formatToSlug(format: string): string {
  return format.toLowerCase().replace(/\s+/g, "-");
}

export function slugToFormat(slug: string): string | null {
  const found = KNOWN_FORMATS.find((f) => formatToSlug(f) === slug);
  return found ?? null;
}

export const FORMAT_DESCRIPTIONS: Record<string, string> = {
  Modern:
    "Modern is a competitive non-rotating constructed format using cards from Eighth Edition forward. On Magic Online, Modern Challenges run multiple times per week and feed the Regional Championship Qualifier circuit. Modern Super Qualifiers offer direct paths to live events and Pro Tour invitations. The metagame ranges from linear aggressive decks like Burn and Hammer Time to interactive control and combo strategies.",
  Pauper:
    "Pauper is a constructed format where only cards printed at common rarity in any Magic set are legal. On Magic Online, Pauper Challenges and Qualifiers run weekly, with the Pauper Format Panel maintaining the banlist. The format rewards efficient interaction, tribal aggressive shells, and brewer creativity — popular archetypes include Mono-Black Control, Affinity, Faeries, and Burn.",
  Legacy:
    "Legacy on Magic Online is the highest-power constructed format with virtually no rotation. Weekly Legacy Challenges and occasional Super Qualifiers draw a dedicated grinder community. Tier-one decks like Reanimator, Delver variants, and Show and Tell define the metagame, with Force of Will and Wasteland acting as format pillars.",
  Standard:
    "Standard is the rotating constructed format featuring cards from the most recent Magic sets. On Magic Online, Standard Challenges run frequently with Showcase Challenge and Super Qualifier paths available throughout the season. The format rewards adapting quickly to new releases and reading the metagame as fresh cards reshape the top tables.",
  Pioneer:
    "Pioneer is a non-rotating format that includes cards from Return to Ravnica forward. MTGO hosts weekly Pioneer Challenges with Showcase and Qualifier structures attached. Pioneer often serves as a bridge between Standard and Modern, with decks like Mono-Green Devotion, Rakdos Vampires, and Phoenix populating the upper tables.",
  Vintage:
    "Vintage is the broadest constructed format on Magic Online, allowing nearly every card ever printed with a small restricted list capping certain cards to one copy. Vintage Challenges run weekly and showcase iconic Power Nine and Bazaar of Baghdad strategies alongside modern designs.",
  Limited:
    "Limited events on Magic Online include Sealed Deck and Booster Draft formats. Phantom Sealed events use virtual packs with no card ownership, ideal for low-cost set practice. Limited Challenges, Showcase Limited events, and Super Qualifiers feature the latest set and Cube Drafts rotate through curated lists.",
  Premodern:
    "Premodern is a fan-supported eternal format using cards printed from Fourth Edition through Scourge. On Magic Online, Premodern Challenges and Championship Week events run on a regular cadence and capture the texture of early-2000s Magic.",
  "Duel Commander":
    "Duel Commander is the 1v1 variant of the Commander format with its own banlist tuned for two-player play. MTGO runs scheduled Duel Commander Trials and other events on a regular cadence.",
  "Phantom Sealed":
    "Phantom Sealed events on Magic Online use virtual booster packs that do not transfer card ownership — the cards exist only for the duration of the event, making them ideal for low-cost set practice ahead of paper events.",
  Commander:
    "Commander is the 100-card multiplayer format built around a legendary creature commander. Scheduled Commander events appear on Magic Online from time to time.",
  Cube:
    "Cube events on Magic Online use a curated card list assembled by the cube designer, drafted by participants. Cube format and frequency varies by event.",
};

export function eventStructuredData(
  event: MtgoEvent,
  siteUrl: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.summary,
    startDate: event.startUtc,
    endDate: event.endUtc,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: {
      "@type": "VirtualLocation",
      url: "https://www.mtgo.com/",
    },
    organizer: {
      "@type": "Organization",
      name: "Daybreak Games",
      url: "https://www.mtgo.com/",
    },
    url: `${siteUrl}/event/${event.uid}`,
  };
}

export async function findEvent(uid: string): Promise<MtgoEvent | null> {
  const events = await fetchEvents();
  return events.find((e) => e.uid === uid) ?? null;
}
