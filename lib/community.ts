import type { MtgoEvent } from "./events";

export type OrganizerLinks = {
  twitch?: string;
  youtube?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
  website?: string;
  signupBase?: string;
};

export type Organizer = {
  slug: string;
  name: string;
  description: string;
  links: OrganizerLinks;
  color: string;
  initials: string;
  country?: string;
  language?: string;
};

export type RecurringEventTemplate = {
  id: string;
  organizerSlug: string;
  name: string;
  format: string;
  description: string;
  entryFee: string;
  prizes: string;
  rounds: string;
  signupUrl?: string;
  streamUrls?: { twitch?: string; youtube?: string };
  frequency: "weekly";
  dayOfWeek: number;
  localTime: string;
  durationMinutes: number;
  tz: string;
};

export const ORGANIZERS: Organizer[] = [
  {
    slug: "tiago-fuguete",
    name: "Tiago Fuguete",
    description:
      "Brazilian Pauper content creator hosting weekly Fuguete Champ tournaments on MTGO. Free entry, Top 10 wins Play Points, streamed live every Monday on Twitch and YouTube.",
    links: {
      twitch: "https://www.twitch.tv/tiagofuguete",
      youtube: "https://www.youtube.com/c/TiagoFuguete",
      signupBase: "https://cardsrealm.com/en-us/profile/tiago1690",
    },
    color: "#ec4899",
    initials: "TF",
    country: "Brazil",
    language: "Portuguese",
  },
];

export const RECURRING_EVENTS: RecurringEventTemplate[] = [
  {
    id: "fuguete-champ-weekly",
    organizerSlug: "tiago-fuguete",
    name: "Fuguete Champ",
    format: "Pauper",
    description:
      "Weekly free-entry Pauper tournament hosted by Tiago Fuguete. 5 Swiss rounds, Top 10 wins Play Points. Streamed live on Twitch and YouTube every Monday at 20:00 BRT.",
    entryFee: "FREE",
    prizes: "Top 10 win Play Points",
    rounds: "5 Swiss Rounds",
    signupUrl: "https://cardsrealm.com/en-us/profile/tiago1690",
    streamUrls: {
      twitch: "https://www.twitch.tv/tiagofuguete",
      youtube: "https://www.youtube.com/c/TiagoFuguete/live",
    },
    frequency: "weekly",
    dayOfWeek: 1,
    localTime: "20:00",
    durationMinutes: 180,
    tz: "America/Sao_Paulo",
  },
];

export function findOrganizer(slug: string): Organizer | null {
  return ORGANIZERS.find((o) => o.slug === slug) ?? null;
}

export function templatesByOrganizer(slug: string): RecurringEventTemplate[] {
  return RECURRING_EVENTS.filter((t) => t.organizerSlug === slug);
}

function dateKeyInTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function dowOfKey(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

function utcInstantForLocalTime(
  dateKey: string,
  localTime: string,
  tz: string
): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [h, mi] = localTime.split(":").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, h, mi));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(guess);
  const hourPart = parts.find((p) => p.type === "hour")!.value;
  const minPart = parts.find((p) => p.type === "minute")!.value;
  const tzHour = parseInt(hourPart, 10) % 24;
  const tzMin = parseInt(minPart, 10);
  const wanted = h * 60 + mi;
  const got = tzHour * 60 + tzMin;
  const deltaMin = wanted - got;
  return new Date(guess.getTime() + deltaMin * 60_000);
}

export function expandRecurringEvents(
  template: RecurringEventTemplate,
  rangeStart: Date,
  rangeEnd: Date
): MtgoEvent[] {
  const out: MtgoEvent[] = [];
  const dayMs = 24 * 60 * 60 * 1000;
  let cur = new Date(rangeStart);
  let safety = 0;
  while (cur <= rangeEnd && safety < 200) {
    safety++;
    const key = dateKeyInTz(cur, template.tz);
    if (dowOfKey(key) === template.dayOfWeek) {
      const startUtc = utcInstantForLocalTime(
        key,
        template.localTime,
        template.tz
      );
      const endUtc = new Date(
        startUtc.getTime() + template.durationMinutes * 60_000
      );
      out.push({
        uid: `community-${template.organizerSlug}-${template.id}-${key}`,
        summary: `${template.format} ${template.name}`,
        format: template.format,
        type: template.name,
        startUtc: startUtc.toISOString(),
        endUtc: endUtc.toISOString(),
        source: "community",
        organizerSlug: template.organizerSlug,
        signupUrl: template.signupUrl,
        streamUrls: template.streamUrls,
      });
      cur = new Date(cur.getTime() + 7 * dayMs);
    } else {
      cur = new Date(cur.getTime() + dayMs);
    }
  }
  return out;
}

export function getAllCommunityEvents(
  rangeStart: Date = new Date(),
  rangeEnd: Date = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
): MtgoEvent[] {
  const events: MtgoEvent[] = [];
  for (const tpl of RECURRING_EVENTS) {
    events.push(...expandRecurringEvents(tpl, rangeStart, rangeEnd));
  }
  return events.sort((a, b) => a.startUtc.localeCompare(b.startUtc));
}
