import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BookingConfirmationRequest {
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
    const { booking_id }: BookingConfirmationRequest = await req.json();

    if (!booking_id) {
      return new Response(JSON.stringify({ error: "Missing required parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, user_id, experience_date_id, status, created_at")
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

    // Profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, first_name, last_name, company_id")
      .eq("id", booking.user_id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Date
    const { data: experienceDate, error: dateError } = await supabase
      .from("experience_dates")
      .select("id, start_datetime, end_datetime, experience_id")
      .eq("id", booking.experience_date_id)
      .single();

    if (dateError || !experienceDate) {
      return new Response(JSON.stringify({ error: "Experience date not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Experience
    const { data: experience, error: expError } = await supabase
      .from("experiences")
      .select("title, description, city, address, association_name, category")
      .eq("id", experienceDate.experience_id)
      .single();

    if (expError || !experience) {
      return new Response(JSON.stringify({ error: "Experience not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Per-company opt-out (kept as company-level gate; suppression list still applies downstream)
    if (profile.company_id) {
      const { data: emailSettings } = await supabase
        .from("email_settings")
        .select("confirmation_enabled")
        .eq("company_id", profile.company_id)
        .single();

      if (emailSettings && !emailSettings.confirmation_enabled) {
        return new Response(
          JSON.stringify({ success: true, message: "Confirmation emails disabled" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Optional company-level template overrides (legacy, kept as fallback)
    let introText: string | undefined;
    let closingText: string | undefined;
    if (profile.company_id) {
      const { data: template } = await supabase
        .from("email_templates")
        .select("intro_text, closing_text")
        .eq("company_id", profile.company_id)
        .eq("template_type", "booking_confirmation")
        .single();
      introText = template?.intro_text ?? undefined;
      closingText = template?.closing_text ?? undefined;
    }

    // Delegate sending to native transactional email pipeline
    const templateData = {
      firstName: profile.first_name ?? "",
      experienceTitle: experience.title,
      category: experience.category,
      associationName: experience.association_name,
      startDateLong: formatDate(experienceDate.start_datetime),
      startTime: formatTime(experienceDate.start_datetime),
      endTime: formatTime(experienceDate.end_datetime),
      city: experience.city,
      address: experience.address,
      description: experience.description,
      introText: introText
        ? introText.replace("${profile.first_name || \"\"}", profile.first_name ?? "")
        : undefined,
      closingText,
    };

    const { error: invokeError } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "booking-confirmation",
        recipientEmail: profile.email,
        idempotencyKey: `booking-confirm-${booking_id}`,
        templateData,
      },
    });

    if (invokeError) {
      console.error("send-transactional-email failed:", invokeError);
      await supabase.from("email_logs").insert({
        booking_id,
        email_type: "booking_confirmation",
        status: "failed",
      });
      return new Response(JSON.stringify({ error: "Failed to enqueue email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("email_logs").insert({
      booking_id,
      email_type: "booking_confirmation",
      status: "sent",
    });

    return new Response(
      JSON.stringify({ success: true, message: "Confirmation email enqueued" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error in send-booking-confirmation:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
