import Link from "next/link";
import { formatToSlug, KNOWN_FORMATS } from "@/lib/events";
import { ORGANIZERS } from "@/lib/community";

export default function SiteFooter() {
  return (
    <footer className="mt-auto flex flex-col gap-4 border-t border-zinc-800 pt-6 text-xs text-zinc-500">
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-wide text-zinc-500">
          Browse formats
        </span>
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {KNOWN_FORMATS.map((f) => (
            <li key={f}>
              <Link
                href={`/format/${formatToSlug(f)}`}
                className="hover:text-zinc-300 hover:underline"
              >
                {f}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {ORGANIZERS.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wide text-zinc-500">
            Community hosts
          </span>
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {ORGANIZERS.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/community/${o.slug}`}
                  className="hover:text-zinc-300 hover:underline"
                >
                  {o.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
        <a
          href="https://github.com/LeoFC97/mtgoevents"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-zinc-300"
        >
          Source
        </a>
      </div>
    </footer>
  );
}
