// handle-lead-submit — receives form POST from frontend, inserts lead, schedules AI call
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, phone: rawPhone, email, source } = await req.json();

    if (!name || !rawPhone) {
      return new Response(
        JSON.stringify({ error: "Name and phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize phone to E.164 format (+1XXXXXXXXXX)
    let phone = rawPhone.replace(/\D/g, ""); // strip non-digits
    if (phone.length === 10) phone = "1" + phone; // add country code
    if (!phone.startsWith("+")) phone = "+" + phone;

    // Use service role to insert + read
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check for duplicate by phone in last 24 hours
    const { data: existing } = await supabase
      .from("leads")
      .select("id, status")
      .eq("phone", phone)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      // Return existing lead ID — don't create duplicate
      return new Response(
        JSON.stringify({ lead_id: existing[0].id, status: existing[0].status, duplicate: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert new lead
    const { data: lead, error: insertError } = await supabase
      .from("leads")
      .insert({ name, phone, email: email || null, source: source || "website", status: "form_started" })
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save lead" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Schedule the AI call after 3 minutes
    // We invoke trigger-retell-call via a delayed fetch using Deno.alarm or setTimeout
    const leadId = lead.id;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Fire-and-forget: call trigger-retell-call after 3 min delay
    // EdgeRuntime doesn't support long setTimeout, so we use a separate approach:
    // We'll update call_scheduled_at and trigger-retell-call will be invoked by a cron or
    // we invoke it immediately and it handles the delay internally.
    const scheduledAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();
    await supabase
      .from("leads")
      .update({ call_scheduled_at: scheduledAt })
      .eq("id", leadId);

    // Invoke trigger-retell-call immediately — it will check timing internally
    // Using EdgeRuntime's ability to invoke another function
    fetch(`${supabaseUrl}/functions/v1/trigger-retell-call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ lead_id: leadId, delay_ms: 10 * 1000 }),
    }).catch((err) => console.error("Failed to schedule retell call:", err));

    return new Response(
      JSON.stringify({ lead_id: leadId, status: "form_started" }),
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
