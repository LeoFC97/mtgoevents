import { NextResponse } from "next/server";
import { fetchEvents } from "@/lib/events";

export const revalidate = 900;

export async function GET() {
  try {
    const events = await fetchEvents();
    return NextResponse.json({ events, fetchedAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
