import Link from "next/link";
import type { Metadata } from "next";
import SiteFooter from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Privacy Policy — MTGO Events",
  description: "How MTGO Events handles data and cookies.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Privacy Policy
        </h1>
        <p className="text-xs text-zinc-500">
          Last updated: {new Date().toISOString().slice(0, 10)}
        </p>
      </header>

      <section className="flex flex-col gap-3 text-sm leading-relaxed text-zinc-300">
        <p>
          MTGO Events is a public weekly calendar of Magic Online scheduled
          events. We do not require an account, do not collect personal
          information directly, and do not sell any data.
        </p>

        <h2 className="mt-4 text-lg font-semibold text-zinc-100">
          What we load
        </h2>
        <p>
          The event data is fetched from the public Magic Online calendar feed
          at <code>mtgo.com/calendar.ics</code>. We do not send any information
          about you to Magic Online or Daybreak Games.
        </p>

        <h2 className="mt-4 text-lg font-semibold text-zinc-100">
          Advertising and cookies
        </h2>
        <p>
          This site displays ads served by Google AdSense. Google and its
          partners may use cookies and similar technologies to serve ads based
          on your prior visits to this site and other sites on the internet,
          and to measure ad performance.
        </p>
        <p>
          You can review and adjust Google&apos;s use of advertising cookies at{" "}
          <a
            className="underline"
            href="https://adssettings.google.com/"
            target="_blank"
            rel="noreferrer"
          >
            adssettings.google.com
          </a>{" "}
          and learn more about how Google uses data at{" "}
          <a
            className="underline"
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noreferrer"
          >
            policies.google.com/technologies/partner-sites
          </a>
          . If you are visiting from the European Economic Area, the UK, or
          Brazil, a consent prompt is shown before personalized ads are served,
          managed via Google&apos;s Funding Choices messaging.
        </p>

        <h2 className="mt-4 text-lg font-semibold text-zinc-100">
          Google Calendar links
        </h2>
        <p>
          The &quot;+ Google Calendar&quot; button on each event links to{" "}
          <code>calendar.google.com</code> with the event details pre-filled in
          the URL. We do not have access to your Google account; the link only
          opens Google&apos;s standard event-creation page in your browser.
        </p>

        <h2 className="mt-4 text-lg font-semibold text-zinc-100">Contact</h2>
        <p>
          Questions about this policy can be sent to the email associated with
          the operator of this site.
        </p>
      </section>

      <p className="text-sm">
        <Link href="/" className="underline hover:text-zinc-300">
          ← Back to calendar
        </Link>
      </p>
      <SiteFooter />
    </main>
  );
}
