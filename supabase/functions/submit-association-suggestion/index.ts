import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Rate limiting in-memory (3 req / 15 min per IP)
const ipCounts = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 3;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    ipCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS) return false;
  entry.count++;
  return true;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateString(val: unknown, maxLen: number): string | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > maxLen) {
    throw new Error(`Campo troppo lungo (max ${maxLen} caratteri)`);
  }
  return trimmed;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token || !UUID_REGEX.test(token)) {
    return json({ error: "Link non valido o scaduto" }, 404);
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Resolve token → company
  const { data: company, error: companyError } = await supabaseAdmin
    .from("companies")
    .select("id, name")
    .eq("suggestion_token", token)
    .maybeSingle();

  if (companyError) {
    console.error("Token lookup error:", companyError);
    return json({ error: "Errore interno" }, 500);
  }

  if (!company) {
    return json({ error: "Link non valido o scaduto" }, 404);
  }

  if (req.method === "GET") {
    return json({ company_name: company.name });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Rate limit applies to POST
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return json(
      { error: "Troppe richieste. Riprova tra qualche minuto." },
      429,
    );
  }

  try {
    const body = await req.json();

    const suggestedName = validateString(body.suggested_name, 200);
    if (!suggestedName) {
      return json({ error: "Il nome dell'ente è obbligatorio" }, 400);
    }
    const suggesterName = validateString(body.suggester_name, 100);
    if (!suggesterName) {
      return json({ error: "Il tuo nome è obbligatorio" }, 400);
    }
    const suggestedCity = validateString(body.suggested_city, 100);
    const suggesterEmail = validateString(body.suggester_email, 255);
    if (suggesterEmail && !EMAIL_REGEX.test(suggesterEmail)) {
      return json({ error: "Email non valida" }, 400);
    }
    const reason = validateString(body.reason, 1000);

    const { error: insertError } = await supabaseAdmin
      .from("association_suggestions")
      .insert({
        company_id: company.id,
        suggested_name: suggestedName,
        suggested_city: suggestedCity,
        suggester_name: suggesterName,
        suggester_email: suggesterEmail,
        reason,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return json({ error: "Errore durante l'invio del suggerimento" }, 500);
    }

    return json({ success: true });
  } catch (error: any) {
    console.error("Error:", error);
    return json({ error: error.message || "Errore interno" }, 400);
  }
});
