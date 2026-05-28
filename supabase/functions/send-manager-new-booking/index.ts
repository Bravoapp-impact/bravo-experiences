import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ManagerNewBookingRequest {
  booking_id: string;
}

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

    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { booking_id }: ManagerNewBookingRequest = await req.json();

    if (!booking_id) {
      return new Response(JSON.stringify({ error: "Missing required parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, user_id, experience_date_id, status")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorize: owner OR admin
    if (booking.user_id !== user.id) {
      const { data: userRole } = await supabase.rpc("get_user_role", { user_uuid: user.id });
      if (userRole !== "super_admin" && userRole !== "hr_admin") {
        return new Response(JSON.stringify({ error: "Not authorized" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Anti-duplication: skip if a sent log already exists for this booking + type
    const { data: existingLog } = await supabase
      .from("email_logs")
      .select("id")
      .eq("booking_id", booking_id)
      .eq("email_type", "manager_new_booking")
      .eq("status", "sent")
      .maybeSingle();

    if (existingLog) {
      return new Response(
        JSON.stringify({ success: true, message: "Already sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Profile (need manager_email)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("first_name, last_name, company_id, manager_email")
      .eq("id", booking.user_id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const managerEmail = profile.manager_email?.trim();
    if (!managerEmail) {
      // No manager email set — silent no-op, not an error.
      return new Response(
        JSON.stringify({ success: true, message: "No manager email configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Experience date
    const { data: experienceDate, error: dateError } = await supabase
      .from("experience_dates")
      .select("id, start_datetime, end_datetime")
      .eq("id", booking.experience_date_id)
      .single();

    if (dateError || !experienceDate) {
      return new Response(JSON.stringify({ error: "Experience date not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Company name (optional context)
    let companyName = "";
    if (profile.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", profile.company_id)
        .single();
      companyName = company?.name ?? "";
    }

    const templateData = {
      firstName: profile.first_name ?? "",
      lastName: profile.last_name ?? "",
      eventDateLong: formatDate(experienceDate.start_datetime),
      startTime: formatTime(experienceDate.start_datetime),
      endTime: formatTime(experienceDate.end_datetime),
      companyName,
    };

    const { error: invokeError } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "manager-new-booking",
        recipientEmail: managerEmail,
        idempotencyKey: `manager-new-booking-${booking_id}`,
        templateData,
      },
    });

    if (invokeError) {
      console.error("send-transactional-email failed:", invokeError);
      await supabase.from("email_logs").insert({
        booking_id,
        email_type: "manager_new_booking",
        status: "failed",
      });
      return new Response(JSON.stringify({ error: "Failed to enqueue email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("email_logs").insert({
      booking_id,
      email_type: "manager_new_booking",
      status: "sent",
    });

    return new Response(
      JSON.stringify({ success: true, message: "Manager notification enqueued" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error in send-manager-new-booking:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
