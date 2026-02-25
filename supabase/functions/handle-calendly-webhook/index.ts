// handle-calendly-webhook — receives Calendly invitee.created webhook, marks lead as booked
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, calendly-webhook-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const payload = JSON.parse(body);

    // Verify Calendly webhook signature if secret is configured
    const webhookSecret = Deno.env.get("CALENDLY_WEBHOOK_SECRET");
    if (webhookSecret) {
      const signature = req.headers.get("calendly-webhook-signature");
      if (signature) {
        // Calendly sends: t=timestamp,v1=signature
        const parts = signature.split(",");
        const timestamp = parts.find((p: string) => p.startsWith("t="))?.slice(2);
        const v1 = parts.find((p: string) => p.startsWith("v1="))?.slice(3);

        if (timestamp && v1) {
          const data = `${timestamp}.${body}`;
          const key = new TextEncoder().encode(webhookSecret);
          const msg = new TextEncoder().encode(data);
          const cryptoKey = await crypto.subtle.importKey(
            "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
          );
          const sig = await crypto.subtle.sign("HMAC", cryptoKey, msg);
          const expected = Array.from(new Uint8Array(sig))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

          if (expected !== v1) {
            console.error("Invalid webhook signature");
            return new Response(
              JSON.stringify({ error: "Invalid signature" }),
              { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }
    }

    // Only process invitee.created events
    if (payload.event !== "invitee.created") {
      return new Response(
        JSON.stringify({ skipped: true, reason: `Event type: ${payload.event}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const invitee = payload.payload;
    const email = invitee.email;
    const name = invitee.name;
    const calendlyUri = invitee.uri;
    const eventUri = invitee.event;

    // Try to get phone from questions_and_answers
    let phone: string | null = null;
    if (invitee.questions_and_answers) {
      const phoneAnswer = invitee.questions_and_answers.find(
        (q: any) => q.question.toLowerCase().includes("phone")
      );
      phone = phoneAnswer?.answer || null;
    }

    // Also check text_reminder_number
    if (!phone && invitee.text_reminder_number) {
      phone = invitee.text_reminder_number;
    }

    console.log(`Calendly booking: ${name} / ${email} / ${phone}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find matching lead by email or phone (prefer phone match)
    let lead = null;

    if (phone) {
      // Normalize phone: strip non-digits
      const normalizedPhone = phone.replace(/\D/g, "");
      const { data } = await supabase
        .from("leads")
        .select("*")
        .or(`phone.eq.${phone},phone.eq.${normalizedPhone},phone.eq.+1${normalizedPhone},phone.eq.+${normalizedPhone}`)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0) lead = data[0];
    }

    if (!lead && email) {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0) lead = data[0];
    }

    if (lead) {
      // Update existing lead to booked
      await supabase
        .from("leads")
        .update({
          status: "booked",
          calendly_uid: calendlyUri,
          calendly_event_uri: eventUri,
        })
        .eq("id", lead.id);

      console.log(`Lead ${lead.id} marked as booked`);
    } else {
      // No matching lead — insert a new one (they booked directly without going through form)
      await supabase
        .from("leads")
        .insert({
          name: name || "Unknown",
          phone: phone || "",
          email: email,
          status: "booked",
          source: "calendly_direct",
          calendly_uid: calendlyUri,
          calendly_event_uri: eventUri,
        });

      console.log("Created new lead from direct Calendly booking");
    }

    return new Response(
      JSON.stringify({ success: true }),
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
