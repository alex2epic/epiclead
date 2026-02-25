// lookup-lead — Looks up a lead by phone number in Supabase
// Called by Retell AI agent on inbound calls to identify the caller
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const args = body.args || body;
    let phone = args.phone || "";

    if (!phone) {
      return new Response(
        JSON.stringify({ result: "No phone number provided. I can't look up the caller.", found: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize phone to E.164
    phone = phone.replace(/\D/g, "");
    if (phone.length === 10) phone = "1" + phone;
    if (!phone.startsWith("+")) phone = "+" + phone;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up the most recent lead with this phone number
    const { data: lead, error } = await supabase
      .from("leads")
      .select("*")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !lead) {
      return new Response(
        JSON.stringify({
          result: "I don't have this number in our system. This might be a new caller.",
          found: false,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if they have a Calendly event
    let appointmentInfo = "No appointment on file.";
    if (lead.calendly_event_uri) {
      appointmentInfo = `Has a booked appointment (Calendly event: ${lead.calendly_event_uri}).`;
    } else if (lead.status === "ai_booked") {
      appointmentInfo = "Has a booked appointment (booked by AI).";
    }

    return new Response(
      JSON.stringify({
        result: `Found the caller: ${lead.name}, email: ${lead.email || "none on file"}, status: ${lead.status}. ${appointmentInfo}`,
        found: true,
        lead_id: lead.id,
        name: lead.name,
        email: lead.email,
        status: lead.status,
        calendly_event_uri: lead.calendly_event_uri || null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ result: "I had trouble looking up the caller.", found: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
