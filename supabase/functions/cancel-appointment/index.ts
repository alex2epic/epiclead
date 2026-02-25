// cancel-appointment — Cancels a Calendly appointment for a lead
// Called by Retell AI agent when a caller wants to cancel
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
    const { lead_id, calendly_event_uri, reason } = args;

    const calendlyPat = Deno.env.get("CALENDLY_PAT");
    if (!calendlyPat) {
      return new Response(
        JSON.stringify({ result: "I'm unable to cancel right now. Please ask them to use the cancellation link in their email." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!calendly_event_uri && !lead_id) {
      return new Response(
        JSON.stringify({ result: "I don't have enough info to find the appointment. Use lookup_lead first to get the caller's details." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let eventUri = calendly_event_uri;

    // If no event URI, look it up from the lead
    if (!eventUri && lead_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: lead } = await supabase
        .from("leads")
        .select("calendly_event_uri, name")
        .eq("id", lead_id)
        .single();

      if (!lead?.calendly_event_uri) {
        return new Response(
          JSON.stringify({ result: "I couldn't find an appointment for this caller. They may not have one booked." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      eventUri = lead.calendly_event_uri;
    }

    // Get the event to find the invitee URI (needed for cancellation)
    const eventRes = await fetch(`${eventUri}/invitees`, {
      headers: { "Authorization": `Bearer ${calendlyPat}` },
    });

    if (!eventRes.ok) {
      console.error("Failed to get invitees:", eventRes.status, await eventRes.text());
      return new Response(
        JSON.stringify({ result: "I had trouble finding the appointment details. Please ask them to cancel via the email link." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const eventData = await eventRes.json();
    const invitees = eventData.collection || [];

    if (invitees.length === 0) {
      return new Response(
        JSON.stringify({ result: "No invitees found for this appointment. It may already be cancelled." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cancel the event via the scheduled_event cancellation endpoint
    const cancelRes = await fetch(`${eventUri}/cancellation`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${calendlyPat}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason: reason || "Cancelled by caller via phone" }),
    });

    if (!cancelRes.ok) {
      const errText = await cancelRes.text();
      console.error("Cancel error:", cancelRes.status, errText);

      if (cancelRes.status === 403) {
        return new Response(
          JSON.stringify({ result: "This appointment has already been cancelled." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ result: "I had trouble cancelling the appointment. Please ask them to use the cancellation link in their email." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update lead status in Supabase
    if (lead_id) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabase
          .from("leads")
          .update({
            status: "cancelled",
            notes: `Appointment cancelled by caller. Reason: ${reason || "none given"}`,
          })
          .eq("id", lead_id);
      } catch (e) {
        console.error("Failed to update lead:", e);
      }
    }

    return new Response(
      JSON.stringify({
        result: "The appointment has been successfully cancelled. Let the caller know they're all set and the appointment is cancelled. If they want to rebook in the future, they can visit epic lead dot A I or call back anytime.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ result: "I ran into an issue cancelling. Please ask them to use the cancellation link from their email." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
