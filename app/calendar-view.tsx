"use client";

import { useEffect, useMemo, useState } from "react";
import {
  bucketOf,
  googleCalendarUrl,
  KNOWN_FORMATS,
  TYPE_BUCKETS,
  type MtgoEvent,
  type TypeBucket,
} from "@/lib/events";

const FORMAT_COLORS: Record<string, string> = {
  Modern: "bg-purple-500/15 text-purple-300 border-purple-500/40",
  Legacy: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  Standard: "bg-sky-500/15 text-sky-300 border-sky-500/40",
  Pioneer: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  Pauper: "bg-stone-400/15 text-stone-300 border-stone-400/40",
  Vintage: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  Limited: "bg-indigo-500/15 text-indigo-300 border-indigo-500/40",
  Premodern: "bg-yellow-500/15 text-yellow-300 border-yellow-500/40",
  "Duel Commander": "bg-pink-500/15 text-pink-300 border-pink-500/40",
  "Phantom Sealed": "bg-teal-500/15 text-teal-300 border-teal-500/40",
};

const DEFAULT_TZ = "UTC";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function defaultFormatColor(): string {
  return "bg-zinc-500/15 text-zinc-300 border-zinc-500/40";
}

function dayKeyInTz(iso: string | Date, tz: string): string {
  const date = iso instanceof Date ? iso : new Date(iso);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDaysKey(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + n);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

function dowOfKey(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

function startOfWeekKey(key: string): string {
  return addDaysKey(key, -dowOfKey(key));
}

function formatDayLabel(key: string, opts: Intl.DateTimeFormatOptions): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", {
    ...opts,
    timeZone: "UTC",
  });
}

function getAllTimezones(): string[] {
  type IntlWithTz = typeof Intl & {
    supportedValuesOf?: (key: "timeZone") => string[];
  };
  const intl = Intl as IntlWithTz;
  if (typeof intl.supportedValuesOf === "function") {
    return intl.supportedValuesOf("timeZone");
  }
  return ["UTC"];
}

export default function CalendarView({ events }: { events: MtgoEvent[] }) {
  const [tz, setTz] = useState<string>(DEFAULT_TZ);
  const [autoTz, setAutoTz] = useState<string>(DEFAULT_TZ);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [formatFilter, setFormatFilter] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<Set<TypeBucket>>(new Set());

  useEffect(() => {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setAutoTz(browserTz);
    setTz(browserTz);

    const params = new URLSearchParams(window.location.search);
    const fromUrl = (key: string) =>
      (params.get(key) ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const fmt = fromUrl("formats");
    const typ = fromUrl("types");
    if (fmt.length) setFormatFilter(new Set(fmt));
    if (typ.length)
      setTypeFilter(new Set(typ as TypeBucket[]));
  }, []);

  const filterQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (formatFilter.size) params.set("formats", [...formatFilter].join(","));
    if (typeFilter.size) params.set("types", [...typeFilter].join(","));
    return params.toString();
  }, [formatFilter, typeFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = filterQuery
      ? `${window.location.pathname}?${filterQuery}`
      : window.location.pathname;
    if (url !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, "", url);
    }
  }, [filterQuery]);

  const allTimezones = useMemo(() => getAllTimezones(), []);

  const todayKey = useMemo(() => dayKeyInTz(new Date(), tz), [tz]);

  const weekStartKey = useMemo(
    () => addDaysKey(startOfWeekKey(todayKey), weekOffset * 7),
    [todayKey, weekOffset]
  );

  const dayKeys = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDaysKey(weekStartKey, i)),
    [weekStartKey]
  );

  const availableFormats = useMemo(() => {
    const present = new Set(events.map((e) => e.format));
    return KNOWN_FORMATS.filter((f) => present.has(f));
  }, [events]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return events.filter((ev) => {
      if (new Date(ev.endUtc).getTime() < now) return false;
      if (formatFilter.size && !formatFilter.has(ev.format)) return false;
      if (typeFilter.size && !typeFilter.has(bucketOf(ev.type))) return false;
      return true;
    });
  }, [events, formatFilter, typeFilter]);

  const byDay = useMemo(() => {
    const buckets: Record<string, MtgoEvent[]> = {};
    for (const key of dayKeys) buckets[key] = [];
    for (const ev of filtered) {
      const key = dayKeyInTz(ev.startUtc, tz);
      if (buckets[key]) buckets[key].push(ev);
    }
    return dayKeys.map((k) => buckets[k]);
  }, [dayKeys, filtered, tz]);

  const toggle = <T,>(set: Set<T>, value: T, setter: (next: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  const rangeLabel = `${formatDayLabel(dayKeys[0], {
    month: "short",
    day: "numeric",
  })} – ${formatDayLabel(dayKeys[6], {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset(weekOffset - 1)}
            aria-label="Previous week"
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800"
          >
            ← <span className="hidden sm:inline">Prev</span>
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(weekOffset + 1)}
            aria-label="Next week"
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800"
          >
            <span className="hidden sm:inline">Next</span> →
          </button>
        </div>
        <div className="text-base font-medium sm:text-lg">{rangeLabel}</div>
        <TimezonePicker
          tz={tz}
          autoTz={autoTz}
          allTimezones={allTimezones}
          onChange={setTz}
        />
      </div>

      <div className="flex flex-col gap-3">
        <FilterRow
          label="Format"
          items={availableFormats}
          active={formatFilter}
          onToggle={(v) => toggle(formatFilter, v, setFormatFilter)}
          onClear={() => setFormatFilter(new Set())}
        />
        <FilterRow
          label="Type"
          items={[...TYPE_BUCKETS]}
          active={typeFilter}
          onToggle={(v) =>
            toggle(typeFilter, v as TypeBucket, setTypeFilter)
          }
          onClear={() => setTypeFilter(new Set())}
        />
      </div>

      <SubscribeSection filterQuery={filterQuery} isFiltered={filterQuery.length > 0} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        {dayKeys.map((key, i) => {
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              className={`flex min-h-32 flex-col rounded-lg border ${
                isToday
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-zinc-800 bg-zinc-900/40"
              }`}
            >
              <div className="border-b border-zinc-800 px-3 py-2">
                <div className="flex items-baseline justify-between gap-2 xl:block">
                  <div className="text-xs uppercase tracking-wide text-zinc-400">
                    {DAY_NAMES[dowOfKey(key)]}
                  </div>
                  <div className="text-sm font-medium">
                    {formatDayLabel(key, { month: "short", day: "numeric" })}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-2">
                {byDay[i].length === 0 ? (
                  <div className="px-1 py-2 text-xs text-zinc-500">No events</div>
                ) : (
                  byDay[i].map((ev) => (
                    <EventCard key={ev.uid} event={ev} tz={tz} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimezonePicker({
  tz,
  autoTz,
  allTimezones,
  onChange,
}: {
  tz: string;
  autoTz: string;
  allTimezones: string[];
  onChange: (tz: string) => void;
}) {
  const isAuto = tz === autoTz;
  return (
    <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
      <label className="text-xs text-zinc-400">Timezone</label>
      <select
        value={tz}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 hover:border-zinc-500 sm:flex-none sm:max-w-[16rem]"
      >
        {allTimezones.map((zone) => (
          <option key={zone} value={zone}>
            {zone}
          </option>
        ))}
      </select>
      {!isAuto && (
        <button
          type="button"
          onClick={() => onChange(autoTz)}
          className="shrink-0 text-xs text-zinc-400 underline-offset-2 hover:underline"
          title={`Reset to browser timezone (${autoTz})`}
        >
          auto
        </button>
      )}
    </div>
  );
}

function FilterRow<T extends string>({
  label,
  items,
  active,
  onToggle,
  onClear,
}: {
  label: string;
  items: T[];
  active: Set<T>;
  onToggle: (v: T) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="min-w-14 text-xs uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      {items.map((item) => {
        const on = active.has(item);
        return (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              on
                ? "border-emerald-500 bg-emerald-500/20 text-emerald-200"
                : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            {item}
          </button>
        );
      })}
      {active.size > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-zinc-400 underline-offset-2 hover:underline"
        >
          clear
        </button>
      )}
    </div>
  );
}

function EventCard({ event, tz }: { event: MtgoEvent; tz: string }) {
  const start = new Date(event.startUtc);
  const timeLabel = start.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });
  const formatClass = FORMAT_COLORS[event.format] ?? defaultFormatColor();

  return (
    <div className="flex flex-col gap-1 rounded-md border border-zinc-800 bg-zinc-950/60 p-2 hover:border-zinc-700">
      <div className="flex items-center gap-2">
        <span
          className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${formatClass}`}
        >
          {event.format}
        </span>
        <span className="text-[11px] tabular-nums text-zinc-400">
          {timeLabel}
        </span>
      </div>
      <div className="text-sm leading-snug">{event.type}</div>
      <a
        href={googleCalendarUrl(event)}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-flex items-center justify-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 hover:border-emerald-500 hover:text-emerald-300"
      >
        + Google Calendar
      </a>
    </div>
  );
}

function SubscribeSection({
  filterQuery,
  isFiltered,
}: {
  filterQuery: string;
  isFiltered: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [absoluteUrl, setAbsoluteUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = filterQuery
      ? `/api/feed.ics?${filterQuery}`
      : "/api/feed.ics";
    setAbsoluteUrl(`${window.location.origin}${path}`);
  }, [filterQuery]);

  const googleSubscribeUrl = absoluteUrl
    ? `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(absoluteUrl)}`
    : "#";

  const copyLink = async () => {
    if (!absoluteUrl) return;
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — fallback below shows the URL on hover
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-zinc-200">
          Subscribe to this view {isFiltered ? "(filtered)" : "(all events)"}
        </span>
        <span className="text-[11px] text-zinc-500">
          Updates automatically every 15 min. Works in Google Calendar,
          Apple Calendar, Outlook.
        </span>
      </div>
      <div className="ml-auto flex flex-wrap gap-2">
        <a
          href={googleSubscribeUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:border-emerald-500 hover:text-emerald-300"
        >
          + Google Calendar
        </a>
        <button
          type="button"
          onClick={copyLink}
          title={absoluteUrl}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:border-emerald-500 hover:text-emerald-300"
        >
          {copied ? "Copied!" : "Copy .ics link"}
        </button>
      </div>
    </div>
  );
}
