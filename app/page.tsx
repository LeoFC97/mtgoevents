import Link from "next/link";
import AdUnit from "@/components/ad-unit";
import CalendarView from "./calendar-view";
import { fetchEvents, type MtgoEvent } from "@/lib/events";

export const revalidate = 900;

export default async function Home() {
  let events: MtgoEvent[] = [];
  let error: string | null = null;
  try {
    events = await fetchEvents();
  } catch (err) {
    error = err instanceof Error ? err.message : "unknown error";
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          MTGO Events
        </h1>
        <p className="text-sm text-zinc-400">
          Weekly calendar of Magic Online scheduled events. Click any event to
          add it to your Google Calendar.
        </p>
      </header>
      <AdUnit
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER}
        className="min-h-[90px]"
      />
      {error ? (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          Failed to load events: {error}
        </div>
      ) : (
        <CalendarView events={events} />
      )}
      <AdUnit
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER}
        className="min-h-[90px]"
      />
      <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-zinc-800 pt-4 text-xs text-zinc-500">
        <span>
          Data:{" "}
          <a className="underline" href="https://www.mtgo.com/calendar.ics">
            mtgo.com/calendar.ics
          </a>
          . Not affiliated with Wizards of the Coast or Daybreak Games.
        </span>
        <Link href="/privacy" className="underline hover:text-zinc-300">
          Privacy
        </Link>
      </footer>
    </main>
  );
}
