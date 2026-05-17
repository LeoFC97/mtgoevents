import { bucketOf, fetchEvents } from "@/lib/events";

export const revalidate = 900;

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function toIcsDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.getUTCFullYear().toString() +
    pad2(d.getUTCMonth() + 1) +
    pad2(d.getUTCDate()) +
    "T" +
    pad2(d.getUTCHours()) +
    pad2(d.getUTCMinutes()) +
    pad2(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let rest = line;
  chunks.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 0) {
    chunks.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  return chunks.join("\r\n");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const formats = (url.searchParams.get("formats") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const types = (url.searchParams.get("types") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let events;
  try {
    events = await fetchEvents();
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return new Response(`Upstream feed error: ${message}`, { status: 502 });
  }

  const filtered = events.filter((ev) => {
    if (formats.length && !formats.includes(ev.format)) return false;
    if (types.length && !types.includes(bucketOf(ev.type))) return false;
    return true;
  });

  const isFiltered = formats.length > 0 || types.length > 0;
  const calName = isFiltered ? "MTGO Events (filtered)" : "MTGO Events";
  const dtstamp = toIcsDate(new Date().toISOString());

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//mtgoevents//Filtered MTGO Feed//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(calName)}`,
    "X-PUBLISHED-TTL:PT15M",
    "REFRESH-INTERVAL;VALUE=DURATION:PT15M",
  ];

  for (const ev of filtered) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${ev.uid}@mtgoevents`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART:${toIcsDate(ev.startUtc)}`);
    lines.push(`DTEND:${toIcsDate(ev.endUtc)}`);
    lines.push(foldLine(`SUMMARY:${escapeIcs(ev.summary)}`));
    lines.push(
      foldLine(
        `CATEGORIES:${escapeIcs(ev.format)},${escapeIcs(bucketOf(ev.type))}`
      )
    );
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  const body = lines.join("\r\n") + "\r\n";

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=900, s-maxage=900",
      "Content-Disposition": `inline; filename="mtgoevents${isFiltered ? "-filtered" : ""}.ics"`,
    },
  });
}
