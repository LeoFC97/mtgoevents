"use client";

import { useMemo, useState } from "react";
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

function defaultFormatColor(): string {
  return "bg-zinc-500/15 text-zinc-300 border-zinc-500/40";
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarView({ events }: { events: MtgoEvent[] }) {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [formatFilter, setFormatFilter] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<Set<TypeBucket>>(new Set());

  const availableFormats = useMemo(() => {
    const present = new Set(events.map((e) => e.format));
    return KNOWN_FORMATS.filter((f) => present.has(f));
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((ev) => {
      if (formatFilter.size && !formatFilter.has(ev.format)) return false;
      if (typeFilter.size && !typeFilter.has(bucketOf(ev.type))) return false;
      return true;
    });
  }, [events, formatFilter, typeFilter]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const byDay = useMemo(() => {
    return days.map((day) =>
      filtered.filter((e) => sameDay(new Date(e.startUtc), day))
    );
  }, [days, filtered]);

  const toggle = <T,>(set: Set<T>, value: T, setter: (next: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  const tz =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "local";

  const rangeLabel = `${days[0].toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} – ${days[6].toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800"
          >
            Next →
          </button>
        </div>
        <div className="text-lg font-medium">{rangeLabel}</div>
        <div className="ml-auto text-xs text-zinc-400">Timezone: {tz}</div>
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
        {days.map((day, i) => {
          const isToday = sameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={`flex min-h-32 flex-col rounded-lg border ${
                isToday
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-zinc-800 bg-zinc-900/40"
              }`}
            >
              <div className="border-b border-zinc-800 px-3 py-2">
                <div className="text-xs uppercase tracking-wide text-zinc-400">
                  {DAY_NAMES[day.getDay()]}
                </div>
                <div className="text-sm font-medium">
                  {day.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-2 p-2">
                {byDay[i].length === 0 ? (
                  <div className="px-1 py-2 text-xs text-zinc-500">No events</div>
                ) : (
                  byDay[i].map((ev) => <EventCard key={ev.uid} event={ev} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
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
      <span className="w-16 text-xs uppercase tracking-wide text-zinc-400">
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

function EventCard({ event }: { event: MtgoEvent }) {
  const start = new Date(event.startUtc);
  const end = new Date(event.endUtc);
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
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
          {fmtTime(start)}–{fmtTime(end)}
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
