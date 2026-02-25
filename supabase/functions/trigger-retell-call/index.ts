// trigger-retell-call — waits 3 min, checks if lead is still unbooked, then fires Retell AI outbound call
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { lead_id, delay_ms } = await req.json();

    if (!lead_id) {
      return new Response(
        JSON.stringify({ error: "lead_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Wait the delay (default 3 min) — Deno edge functions support up to 150s on free plan
    // For longer delays, we check if enough time has passed since lead creation
    const actualDelay = Math.min(delay_ms || 180000, 140000); // Cap at 140s for safety
    console.log(`Waiting ${actualDelay}ms before checking lead ${lead_id}...`);
    await sleep(actualDelay);

    // Re-fetch the lead — check if they've already booked
    const { data: lead, error: fetchError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (fetchError || !lead) {
      console.error("Lead not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If lead already booked or already called — bail out
    if (["booked", "ai_called", "ai_booked", "not_qualified", "no_answer"].includes(lead.status)) {
      console.log(`Lead ${lead_id} status is '${lead.status}' — skipping call.`);
      return new Response(
        JSON.stringify({ skipped: true, reason: `Lead status is ${lead.status}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fire the Retell outbound call
    const retellApiKey = Deno.env.get("RETELL_API_KEY");
    const retellAgentId = Deno.env.get("RETELL_AGENT_ID");
    const retellFromNumber = Deno.env.get("RETELL_PHONE_NUMBER");

    if (!retellApiKey || !retellAgentId || !retellFromNumber) {
      console.error("Missing Retell configuration");
      return new Response(
        JSON.stringify({ error: "Retell not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Calling lead ${lead_id} at ${lead.phone}...`);

    const retellRes = await fetch("https://api.retellai.com/v2/create-phone-call", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${retellApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from_number: retellFromNumber,
        to_number: lead.phone,
        override_agent_id: retellAgentId,
        metadata: {
          lead_id: lead.id,
          name: lead.name,
        },
        retell_llm_dynamic_variables: {
          name: lead.name,
        },
      }),
    });

    const retellData = await retellRes.json();
    console.log("Retell response:", JSON.stringify(retellData));

    if (!retellRes.ok) {
      console.error("Retell API error:", retellData);
      return new Response(
        JSON.stringify({ error: "Retell API call failed", details: retellData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update lead status and store call ID
    await supabase
      .from("leads")
      .update({
        status: "ai_called",
        retell_call_id: retellData.call_id,
      })
      .eq("id", lead_id);

    return new Response(
      JSON.stringify({ success: true, call_id: retellData.call_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
