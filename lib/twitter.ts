import type { MtgoEvent } from "./events";
import { bucketOf } from "./events";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "https://mtgoevents.com";
const MAX_TWEET = 280;
const FOOTER = `\n\n${SITE_URL.replace(/^https?:\/\//, "")}`;

function utcDayKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatDateHuman(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function eventLine(event: MtgoEvent): string {
  const d = new Date(event.startUtc);
  const time = `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
  return `• ${time} ${event.summary}`;
}

function hasHighlight(events: MtgoEvent[]): boolean {
  return events.some(
    (e) =>
      /Showcase|Super Qualifier|Championship/i.test(e.type)
  );
}

export function eventsForDay(events: MtgoEvent[], date: Date): MtgoEvent[] {
  const target = utcDayKey(date);
  return events
    .filter((e) => utcDayKey(new Date(e.startUtc)) === target)
    .sort((a, b) => a.startUtc.localeCompare(b.startUtc));
}

export function composeDailyTweet(events: MtgoEvent[], date: Date): string | null {
  const todays = eventsForDay(events, date);
  if (todays.length === 0) return null;

  const emoji = hasHighlight(todays) ? "🏆" : "📅";
  const header = `${emoji} Today on MTGO (${formatDateHuman(date)} UTC):\n\n`;

  const lines: string[] = [];
  let total = header.length + FOOTER.length;

  for (const ev of todays) {
    const line = eventLine(ev) + "\n";
    if (total + line.length > MAX_TWEET) break;
    lines.push(line);
    total += line.length;
  }

  const shown = lines.length;
  const remaining = todays.length - shown;
  if (remaining > 0) {
    const more = `+${remaining} more\n`;
    if (total + more.length <= MAX_TWEET) {
      lines.push(more);
    } else {
      // remove the last event line to fit the "+N more"
      while (lines.length && total + more.length > MAX_TWEET) {
        const dropped = lines.pop()!;
        total -= dropped.length;
      }
      lines.push(more);
    }
  }

  return header + lines.join("") + FOOTER;
}
