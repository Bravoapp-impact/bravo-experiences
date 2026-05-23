import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const formatDateLong = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
};

// True iff `eventTime` falls within the day [todayUTC + advanceDays, todayUTC + advanceDays + 1).
// Days are measured in UTC midnight boundaries (the cron runs daily at 08:00 UTC,
// so the "today UTC midnight" reference is stable across the window).
const isInAdvanceWindow = (eventDateIso: string, advanceDays: number): boolean => {
  const now = new Date();
  const todayUtcMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const windowStart = todayUtcMidnight + advanceDays * 24 * 60 * 60 * 1000;
  const windowEnd = windowStart + 24 * 60 * 60 * 1000;
  const t = new Date(eventDateIso).getTime();
  return t >= windowStart && t < windowEnd;
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

    console.log("Starting manager absence notifications at:", new Date().toISOString());

    // Range scan: today to today + 30 days (max advance_days)
    const now = new Date();
    const todayUtcMidnight = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );
    const maxDate = new Date(todayUtcMidnight + 31 * 24 * 60 * 60 * 1000);

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id,
        user_id,
        status,
        experience_date_id,
        experience_dates!inner (
          start_datetime,
          end_datetime
        )
      `)
      .eq("status", "confirmed")
      .gte("experience_dates.start_datetime", new Date(todayUtcMidnight).toISOString())
      .lt("experience_dates.start_datetime", maxDate.toISOString());

    if (bookingsError) {
      throw new Error(`Error fetching bookings: ${bookingsError.message}`);
    }

    let emailsSent = 0;
    let emailsSkipped = 0;

    // Cache company settings to avoid repeated queries
    const companyCache = new Map<string, { name: string; advanceDays: number }>();

    for (const booking of (bookings ?? []) as any[]) {
      const expDate = Array.isArray(booking.experience_dates)
        ? booking.experience_dates[0]
        : booking.experience_dates;
      if (!expDate?.start_datetime) {
        emailsSkipped++;
        continue;
      }

      // Load profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, manager_email, company_id")
        .eq("id", booking.user_id)
        .single();

      if (profileError || !profile) {
        emailsSkipped++;
        continue;
      }

      const managerEmail = (profile.manager_email ?? "").trim();
      if (!managerEmail || !profile.company_id) {
        emailsSkipped++;
        continue;
      }

      // Load company config (advance days + name), cached
      let companyInfo = companyCache.get(profile.company_id);
      if (!companyInfo) {
        const { data: company } = await supabase
          .from("companies")
          .select("name, manager_notification_advance_days")
          .eq("id", profile.company_id)
          .single();
        if (!company) {
          emailsSkipped++;
          continue;
        }
        companyInfo = {
          name: company.name,
          advanceDays: company.manager_notification_advance_days ?? 7,
        };
        companyCache.set(profile.company_id, companyInfo);
      }

      // Check if event falls within the advance window for this company
      if (!isInAdvanceWindow(expDate.start_datetime, companyInfo.advanceDays)) {
        continue;
      }

      // Anti-duplication
      const { data: existingLog } = await supabase
        .from("email_logs")
        .select("id")
        .eq("booking_id", booking.id)
        .eq("email_type", "manager_absence_notification")
        .maybeSingle();

      if (existingLog) {
        emailsSkipped++;
        continue;
      }

      // Pre-check suppression
      const { data: suppressed } = await supabase
        .from("suppressed_emails")
        .select("id")
        .eq("email", managerEmail.toLowerCase())
        .maybeSingle();
      if (suppressed) {
        emailsSkipped++;
        continue;
      }

      const templateData = {
        firstName: profile.first_name ?? "",
        lastName: profile.last_name ?? "",
        eventDateLong: formatDateLong(expDate.start_datetime),
        startTime: formatTime(expDate.start_datetime),
        endTime: formatTime(expDate.end_datetime),
        companyName: companyInfo.name,
      };

      const { error: invokeError } = await supabase.functions.invoke(
        "send-transactional-email",
        {
          body: {
            templateName: "manager-absence-notification",
            recipientEmail: managerEmail,
            idempotencyKey: `manager-absence-${booking.id}`,
            templateData,
          },
        },
      );

      if (invokeError) {
        console.error(`Failed to enqueue manager notification for booking ${booking.id}:`, invokeError);
        await supabase.from("email_logs").insert({
          booking_id: booking.id,
          email_type: "manager_absence_notification",
          status: "failed",
        });
        continue;
      }

      await supabase.from("email_logs").insert({
        booking_id: booking.id,
        email_type: "manager_absence_notification",
        status: "sent",
      });

      emailsSent++;
    }

    console.log(`Manager absence job complete. Sent: ${emailsSent}, Skipped: ${emailsSkipped}`);

    return new Response(
      JSON.stringify({ success: true, emails_sent: emailsSent, emails_skipped: emailsSkipped }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error in send-manager-absence-notifications:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
