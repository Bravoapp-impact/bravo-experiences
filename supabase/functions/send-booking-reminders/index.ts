import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate caller. Two paths:
    //  - cron: Bearer = SERVICE_ROLE_KEY (bypass user auth)
    //  - manual: user JWT, must be super_admin
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

    console.log("Starting reminder check at:", new Date().toISOString());

    // Per-company reminder settings
    const { data: allSettings } = await supabase
      .from("email_settings")
      .select("company_id, reminder_enabled, reminder_hours_before");

    const settingsMap = new Map<string, { enabled: boolean; hours: number }>();
    for (const setting of allSettings || []) {
      settingsMap.set(setting.company_id, {
        enabled: setting.reminder_enabled,
        hours: setting.reminder_hours_before,
      });
    }

    const defaultReminderHours = 24;
    const now = new Date();
    const maxHoursAhead = 48;
    const maxTime = new Date(now.getTime() + maxHoursAhead * 60 * 60 * 1000);

    const { data: upcomingDates, error: datesError } = await supabase
      .from("experience_dates")
      .select(
        `
        id,
        start_datetime,
        end_datetime,
        company_id,
        experience_id,
        experiences (
          title,
          description,
          city,
          address,
          association_name,
          category,
          participant_info
        )
      `,
      )
      .gte("start_datetime", now.toISOString())
      .lte("start_datetime", maxTime.toISOString());

    if (datesError) {
      throw new Error(`Error fetching experience dates: ${datesError.message}`);
    }

    let emailsSent = 0;
    let emailsSkipped = 0;

    for (const expDate of upcomingDates || []) {
      // Per-company opt-out gate
      const companySettings = expDate.company_id ? settingsMap.get(expDate.company_id) : null;
      const reminderEnabled = companySettings?.enabled ?? true;
      const reminderHours = companySettings?.hours ?? defaultReminderHours;

      if (!reminderEnabled) continue;

      // Send only inside the configured 1h window before event
      const dateTime = new Date(expDate.start_datetime);
      const hoursUntilEvent = (dateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntilEvent > reminderHours || hoursUntilEvent < reminderHours - 1) {
        continue;
      }

      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, user_id")
        .eq("experience_date_id", expDate.id)
        .eq("status", "confirmed");

      if (bookingsError) {
        console.error(`Error fetching bookings for date ${expDate.id}:`, bookingsError);
        continue;
      }

      for (const booking of bookings || []) {
        // Anti-duplication via email_logs
        const { data: existingLog } = await supabase
          .from("email_logs")
          .select("id")
          .eq("booking_id", booking.id)
          .eq("email_type", "booking_reminder")
          .maybeSingle();

        if (existingLog) {
          emailsSkipped++;
          continue;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email, first_name, last_name, company_id")
          .eq("id", booking.user_id)
          .single();

        if (profileError || !profile) {
          console.error(`Profile not found for user ${booking.user_id}`);
          continue;
        }

        // Email copy comes from the hardcoded React Email template — no per-company overrides.
        const experience = expDate.experiences as any;

        const templateData = {
          firstName: profile.first_name ?? "",
          experienceTitle: experience?.title,
          category: experience?.category,
          associationName: experience?.association_name,
          startDateLong: formatDate(expDate.start_datetime),
          startTime: formatTime(expDate.start_datetime),
          endTime: formatTime(expDate.end_datetime),
          city: experience?.city,
          address: experience?.address,
          participantInfo: experience?.participant_info,
        };

        const { error: invokeError } = await supabase.functions.invoke(
          "send-transactional-email",
          {
            body: {
              templateName: "booking-reminder",
              recipientEmail: profile.email,
              idempotencyKey: `booking-reminder-${booking.id}`,
              templateData,
            },
          },
        );

        if (invokeError) {
          console.error(`Failed to enqueue reminder for ${profile.email}:`, invokeError);
          await supabase.from("email_logs").insert({
            booking_id: booking.id,
            email_type: "booking_reminder",
            status: "failed",
          });
          continue;
        }

        await supabase.from("email_logs").insert({
          booking_id: booking.id,
          email_type: "booking_reminder",
          status: "sent",
        });

        emailsSent++;
      }
    }

    console.log(`Reminder job complete. Sent: ${emailsSent}, Skipped: ${emailsSkipped}`);

    return new Response(
      JSON.stringify({ success: true, emails_sent: emailsSent, emails_skipped: emailsSkipped }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error in send-booking-reminders:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
