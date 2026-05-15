import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth: this function is meant to run via scheduled cron with the
    // service-role key. Reject any unauthenticated public call.
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!supabaseServiceKey || authHeader !== `Bearer ${supabaseServiceKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find bookings for events that ended ~24h ago (between 20h and 28h ago)
    const now = new Date();
    const windowStart = new Date(now.getTime() - 28 * 60 * 60 * 1000).toISOString();
    const windowEnd = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString();

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id,
        user_id,
        experience_date_id,
        experience_dates (
          end_datetime,
          experience_id,
          experiences (
            title,
            association_name
          )
        )
      `)
      .in("status", ["confirmed", "completed"]);

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      return new Response(JSON.stringify({ error: "Failed to fetch bookings" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eligibleBookings = (bookings || []).filter((b: any) => {
      const endDatetime = b.experience_dates?.end_datetime;
      if (!endDatetime) return false;
      return endDatetime >= windowStart && endDatetime <= windowEnd;
    });

    if (eligibleBookings.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No eligible bookings" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const bookingIds = eligibleBookings.map((b: any) => b.id);

    // Anti-duplication via email_logs
    const { data: existingLogs } = await supabase
      .from("email_logs")
      .select("booking_id")
      .in("booking_id", bookingIds)
      .eq("email_type", "feedback_request");
    const alreadySent = new Set((existingLogs || []).map((l: any) => l.booking_id));

    // Skip if user already left a review
    const { data: existingReviews } = await supabase
      .from("experience_reviews")
      .select("booking_id")
      .in("booking_id", bookingIds);
    const alreadyReviewed = new Set((existingReviews || []).map((r: any) => r.booking_id));

    const toSend = eligibleBookings.filter(
      (b: any) => !alreadySent.has(b.id) && !alreadyReviewed.has(b.id),
    );

    if (toSend.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "All already processed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userIds = [...new Set(toSend.map((b: any) => b.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, first_name")
      .in("id", userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    let sentCount = 0;

    for (const booking of toSend) {
      const profile = profileMap.get(booking.user_id);
      if (!profile?.email) continue;

      const experienceTitle =
        (booking as any).experience_dates?.experiences?.title || "l'esperienza";
      const associationName =
        (booking as any).experience_dates?.experiences?.association_name || "";

      const { error: invokeError } = await supabase.functions.invoke(
        "send-transactional-email",
        {
          body: {
            templateName: "feedback-request",
            recipientEmail: profile.email,
            idempotencyKey: `feedback-${booking.id}`,
            templateData: {
              firstName: profile.first_name ?? "",
              experienceTitle,
              associationName,
              feedbackUrl: "https://experiences.bravoapp.it/app/bookings",
            },
          },
        },
      );

      if (invokeError) {
        console.error(`Failed to enqueue feedback for ${profile.email}:`, invokeError);
        await supabase.from("email_logs").insert({
          booking_id: booking.id,
          email_type: "feedback_request",
          status: "failed",
        });
        continue;
      }

      await supabase.from("email_logs").insert({
        booking_id: booking.id,
        email_type: "feedback_request",
        status: "sent",
      });
      sentCount++;
    }

    console.log(`Feedback requests enqueued: ${sentCount}/${toSend.length}`);
    return new Response(
      JSON.stringify({ success: true, sent: sentCount, total: toSend.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error in send-feedback-request:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
