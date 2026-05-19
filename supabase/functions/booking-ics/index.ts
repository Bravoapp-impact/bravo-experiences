// Public endpoint that returns a minimal RFC 5545 .ics file for a confirmed booking.
//
// Security model: this endpoint is intentionally public (verify_jwt = false) so it can be
// opened by anyone who clicks the link inside the booking confirmation email — including
// from devices that are not signed in to Bravo!.
// Non-enumeration is enforced by requiring a random UUID v4 booking_id (same pattern used
// by the unsubscribe-token flow): without a valid id, no booking is exposed.
// Bookings that are not in status 'confirmed' or whose date is already in the past return
// a neutral 404 to avoid leaking lifecycle information.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Format a Date as YYYYMMDDTHHMMSSZ in UTC, per RFC 5545 form #2.
function toIcsUtc(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

// Escape RFC 5545 TEXT values: backslash, semicolon, comma, newline.
function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function buildIcs(params: {
  bookingId: string;
  startDatetime: string;
  endDatetime: string;
  title: string;
  associationName: string | null;
  city: string | null;
  address: string | null;
}): string {
  const summary = escapeIcsText(`Volontariato con Bravo! - ${params.title}`);

  const locationParts = [params.city, params.address].filter(
    (p): p is string => Boolean(p && p.trim()),
  );
  const location = escapeIcsText(locationParts.join(", "));

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bravo//Volontariato//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${params.bookingId}@bravoapp.it`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(params.startDatetime)}`,
    `DTEND:${toIcsUtc(params.endDatetime)}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}

const notFound = () =>
  new Response("Not found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const bookingId = url.searchParams.get("booking_id");
    if (!bookingId || !UUID_V4_RE.test(bookingId)) return notFound();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, status, experience_date_id")
      .eq("id", bookingId)
      .maybeSingle();
    if (bookingError || !booking) return notFound();
    if (booking.status !== "confirmed") return notFound();

    const { data: ed, error: edError } = await supabase
      .from("experience_dates")
      .select("id, start_datetime, end_datetime, experience_id")
      .eq("id", booking.experience_date_id)
      .maybeSingle();
    if (edError || !ed) return notFound();

    // Skip past events.
    if (new Date(ed.end_datetime) < new Date()) return notFound();

    const { data: exp, error: expError } = await supabase
      .from("experiences")
      .select("title, city, address, association_name")
      .eq("id", ed.experience_id)
      .maybeSingle();
    if (expError || !exp) return notFound();

    const ics = buildIcs({
      bookingId: booking.id,
      startDatetime: ed.start_datetime,
      endDatetime: ed.end_datetime,
      title: exp.title || "Esperienza di volontariato",
      associationName: exp.association_name ?? null,
      city: exp.city ?? null,
      address: exp.address ?? null,
    });

    const shortId = booking.id.slice(0, 8);
    return new Response(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="bravo-volontariato-${shortId}.ics"`,
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("booking-ics error:", error);
    return notFound();
  }
});
