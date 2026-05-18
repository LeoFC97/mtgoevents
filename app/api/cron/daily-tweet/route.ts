import { NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { fetchEvents } from "@/lib/events";
import { composeDailyTweet, eventsForDay } from "@/lib/twitter";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function unauthorized() {
  return new NextResponse("Unauthorized", { status: 401 });
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return unauthorized();
  }

  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    return NextResponse.json(
      { ok: false, error: "missing twitter credentials" },
      { status: 500 }
    );
  }

  let events;
  try {
    events = await fetchEvents();
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { ok: false, error: `fetchEvents: ${message}` },
      { status: 502 }
    );
  }

  const now = new Date();
  const text = composeDailyTweet(events, now);
  const todayCount = eventsForDay(events, now).length;

  if (!text) {
    return NextResponse.json({
      ok: true,
      posted: false,
      reason: "no events today",
      todayCount,
    });
  }

  // Dry run support (preview without posting): ?dry=1
  const url = new URL(req.url);
  if (url.searchParams.get("dry") === "1") {
    return NextResponse.json({
      ok: true,
      posted: false,
      reason: "dry run",
      todayCount,
      length: text.length,
      text,
    });
  }

  const client = new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken,
    accessSecret,
  });

  try {
    const result = await client.v2.tweet(text);
    return NextResponse.json({
      ok: true,
      posted: true,
      tweetId: result.data.id,
      todayCount,
      length: text.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { ok: false, error: `tweet failed: ${message}`, text, length: text.length },
      { status: 502 }
    );
  }
}
