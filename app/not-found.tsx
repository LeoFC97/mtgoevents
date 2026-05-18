import Link from "next/link";
import type { Metadata } from "next";
import SiteFooter from "@/components/site-footer";
import { formatToSlug, KNOWN_FORMATS } from "@/lib/events";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <div className="text-5xl font-bold tracking-tight text-emerald-400">
          404
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Page not found
        </h1>
        <p className="text-sm text-zinc-400">
          The event or format you&apos;re looking for doesn&apos;t exist, or
          the event has rotated off the MTGO schedule. Jump back to the
          calendar or browse by format below.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/"
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 hover:border-emerald-500 hover:text-emerald-300"
        >
          ← Back to calendar
        </Link>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm uppercase tracking-wide text-zinc-400">
          Browse by format
        </h2>
        <ul className="flex flex-wrap gap-2">
          {KNOWN_FORMATS.map((f) => (
            <li key={f}>
              <Link
                href={`/format/${formatToSlug(f)}`}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
              >
                {f}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <SiteFooter />
    </main>
  );
}
