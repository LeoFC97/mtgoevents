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
