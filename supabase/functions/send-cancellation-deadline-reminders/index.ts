import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAYS_BEFORE_EVENT = 17;
const CANCELLATION_LOCKOUT_DAYS = 14;
const BOOKINGS_URL = "https://experiences.bravoapp.it/app/bookings";

const formatDateLong = (dateStr: string | Date): string => {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth: cron (service role) OR super_admin user JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.slice("Bearer ".length);
    let isServiceRole = token === supabaseServiceKey;
    if (!isServiceRole) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload?.role === "service_role") isServiceRole = true;
      } catch { /* not a JWT */ }
    }
    if (!isServiceRole) {
      const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userError } = await authSupabase.auth.getUser();
      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Invalid authentication" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: userRole } = await supabase.rpc("get_user_role", { user_uuid: user.id });
      if (userRole !== "super_admin") {
        return new Response(JSON.stringify({ error: "Not authorized" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log("Starting cancellation deadline reminders at:", new Date().toISOString());

    // Window: events whose start_datetime falls in [today + 17, today + 18) UTC
    const now = new Date();
    const todayUtcMidnight = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );
    const windowStart = new Date(todayUtcMidnight + DAYS_BEFORE_EVENT * 86400000);
    const windowEnd = new Date(todayUtcMidnight + (DAYS_BEFORE_EVENT + 1) * 86400000);

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id,
        user_id,
        status,
        experience_date_id,
        experience_dates!inner (
          start_datetime
        )
      `)
      .eq("status", "confirmed")
      .gte("experience_dates.start_datetime", windowStart.toISOString())
      .lt("experience_dates.start_datetime", windowEnd.toISOString());

    if (bookingsError) {
      throw new Error(`Error fetching bookings: ${bookingsError.message}`);
    }

    let emailsSent = 0;
    let emailsSkipped = 0;

    for (const booking of (bookings ?? []) as any[]) {
      const expDate = Array.isArray(booking.experience_dates)
        ? booking.experience_dates[0]
        : booking.experience_dates;
      if (!expDate?.start_datetime) {
        emailsSkipped++;
        continue;
      }

      // Load profile (email + first name)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email, first_name")
        .eq("id", booking.user_id)
        .single();

      if (profileError || !profile?.email) {
        emailsSkipped++;
        continue;
      }

      const recipientEmail = profile.email.trim();
      if (!recipientEmail) {
        emailsSkipped++;
        continue;
      }

      // Anti-duplication
      const { data: existingLog } = await supabase
        .from("email_logs")
        .select("id")
        .eq("booking_id", booking.id)
        .eq("email_type", "cancellation_deadline_reminder")
        .maybeSingle();

      if (existingLog) {
        emailsSkipped++;
        continue;
      }

      // Pre-check suppression
      const { data: suppressed } = await supabase
        .from("suppressed_emails")
        .select("id")
        .eq("email", recipientEmail.toLowerCase())
        .maybeSingle();
      if (suppressed) {
        emailsSkipped++;
        continue;
      }

      const eventDate = new Date(expDate.start_datetime);
      const deadlineDate = new Date(eventDate.getTime() - CANCELLATION_LOCKOUT_DAYS * 86400000);

      const templateData = {
        firstName: profile.first_name ?? "",
        eventDateLong: formatDateLong(eventDate),
        cancellationDeadlineLong: formatDateLong(deadlineDate),
        bookingsUrl: BOOKINGS_URL,
      };

      const { error: invokeError } = await supabase.functions.invoke(
        "send-transactional-email",
        {
          body: {
            templateName: "cancellation-deadline-reminder",
            recipientEmail,
            idempotencyKey: `cancellation-deadline-${booking.id}`,
            templateData,
          },
        },
      );

      if (invokeError) {
        console.error(`Failed to enqueue cancellation deadline reminder for booking ${booking.id}:`, invokeError);
        await supabase.from("email_logs").insert({
          booking_id: booking.id,
          email_type: "cancellation_deadline_reminder",
          status: "failed",
        });
        continue;
      }

      await supabase.from("email_logs").insert({
        booking_id: booking.id,
        email_type: "cancellation_deadline_reminder",
        status: "sent",
      });

      emailsSent++;
    }

    console.log(`Cancellation deadline reminder job complete. Sent: ${emailsSent}, Skipped: ${emailsSkipped}`);

    return new Response(
      JSON.stringify({ success: true, emails_sent: emailsSent, emails_skipped: emailsSkipped }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error in send-cancellation-deadline-reminders:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
