// handle-retell-webhook — receives Retell call.ended event, updates lead status
// Also sends SMS follow-up when lead doesn't answer
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RETELL_FROM_NUMBER = "+15169732438";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Retell webhook payload:", JSON.stringify(payload));

    const event = payload.event;

    // Only handle call_ended events
    if (event !== "call_ended" && event !== "call.ended") {
      return new Response(
        JSON.stringify({ skipped: true, reason: `Event: ${event}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callData = payload.data || payload.call || payload;
    const callId = callData.call_id;
    const metadata = callData.metadata || {};
    const leadId = metadata.lead_id;
    const disconnectReason = callData.disconnect_reason || callData.end_reason;
    const transcript = callData.transcript || "";
    const callStatus = callData.call_status || callData.status;
    const callAnalysis = callData.call_analysis || {};

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the lead by call_id or lead_id from metadata
    let lead = null;

    if (leadId) {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();
      lead = data;
    }

    if (!lead && callId) {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("retell_call_id", callId)
        .single();
      lead = data;
    }

    if (!lead) {
      console.error("No matching lead found for call:", callId);
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine new status based on call outcome
    let newStatus = "no_answer";
    let notes = "";
    let shouldSendSms = false;

    // Check call analysis for booking intent or user sentiment
    const userSentiment = callAnalysis.user_sentiment || "";
    const callSummary = callAnalysis.call_summary || "";
    const customAnalysis = callAnalysis.custom_analysis_data || {};

    if (disconnectReason === "no_answer" || disconnectReason === "busy" ||
        disconnectReason === "voicemail_reached" || disconnectReason === "machine_detected") {
      newStatus = "no_answer";
      notes = `Call ended: ${disconnectReason}`;
      shouldSendSms = true; // They didn't pick up — send a text
    } else if (disconnectReason === "user_hangup" && callStatus === "error") {
      newStatus = "no_answer";
      notes = "Call error or user hung up immediately";
      shouldSendSms = true;
    } else if (customAnalysis.booked === true || callSummary.toLowerCase().includes("book")) {
      newStatus = "ai_booked";
      notes = callSummary || "AI booked appointment";
    } else if (userSentiment === "Negative" || customAnalysis.qualified === false) {
      newStatus = "not_qualified";
      notes = callSummary || "Lead not qualified";
    } else if (callStatus === "ended" || callStatus === "completed") {
      const transcriptStr = typeof transcript === "string"
        ? transcript
        : JSON.stringify(transcript);

      if (transcriptStr.length < 100) {
        newStatus = "no_answer";
        notes = "Very short call — likely no real conversation";
        shouldSendSms = true;
      } else {
        newStatus = "not_qualified";
        notes = callSummary || "Call completed, no booking";
      }
    }

    if (callSummary) {
      notes = callSummary;
    }

    // Update the lead
    await supabase
      .from("leads")
      .update({
        status: newStatus,
        notes: notes,
      })
      .eq("id", lead.id);

    console.log(`Lead ${lead.id} updated to '${newStatus}'`);

    // Send SMS follow-up if they didn't answer
    if (shouldSendSms && lead.phone) {
      try {
        const retellApiKey = Deno.env.get("RETELL_API_KEY");
        if (retellApiKey) {
          const firstName = (lead.name || "").split(" ")[0] || "there";
          const smsRes = await fetch("https://api.retellai.com/v2/create-phone-call", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${retellApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from_number: RETELL_FROM_NUMBER,
              to_number: lead.phone,
              override_agent_id: "agent_be6773b15f941cb34c196cb08c",
              // This is a placeholder — when SMS is enabled on the number,
              // switch to the SMS endpoint: POST /create-sms-chat
            }),
          });
          // For now, log the attempt. Once SMS is enabled, this will actually send.
          console.log(`SMS follow-up attempt for ${lead.phone}: ${smsRes.status}`);

          // TODO: Once SMS is approved on the Retell number, replace the above with:
          // POST https://api.retellai.com/create-sms-chat
          // { from_number: RETELL_FROM_NUMBER, to_number: lead.phone,
          //   first_message: `Hey ${firstName}! This is Brian from Epic Lead. I tried giving you a call but couldn't reach you. When you get a chance, give me a call back at this number or book a time at epiclead.ai — would love to chat about growing your business!` }
        }
      } catch (smsErr) {
        console.error("SMS follow-up failed:", smsErr);
        // Non-critical — don't fail the webhook
      }
    }

    return new Response(
      JSON.stringify({ success: true, lead_id: lead.id, new_status: newStatus, sms_attempted: shouldSendSms }),
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
