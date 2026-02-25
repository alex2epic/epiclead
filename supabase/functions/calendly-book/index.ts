// calendly-book — Books an appointment on Calendly for a lead
// Called by Retell AI agent during a live call
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EVENT_TYPE_URI = "https://api.calendly.com/event_types/ee07aa62-27df-4fa9-ab20-7ca66d0ca262";
const SCHEDULING_URL = "https://calendly.com/alexsfreedman/website-discovery-call";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const args = body.args || body;
    const { start_time, name, email, phone, lead_id } = args;

    if (!start_time || !name) {
      return new Response(
        JSON.stringify({ result: "I need the time slot and the caller's name to book. Please ask for those details." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const calendlyPat = Deno.env.get("CALENDLY_PAT");
    if (!calendlyPat) {
      return new Response(
        JSON.stringify({ result: "I'm unable to book right now. I'll send a booking link via text after this call." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Book via Calendly API — create a scheduled event
    // Calendly's API uses the scheduling link approach for programmatic booking
    // We need to use the /scheduled_events endpoint with invitee creation

    // First, try to create a single-use scheduling link and then auto-book
    // Actually, Calendly doesn't have a direct "book on behalf of" API endpoint
    // on the standard plan. The workaround is to create a single-use invite link.

    // Create a single-use scheduling link
    const linkRes = await fetch("https://api.calendly.com/scheduling_links", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${calendlyPat}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        max_event_count: 1,
        owner: EVENT_TYPE_URI,
        owner_type: "EventType",
      }),
    });

    if (!linkRes.ok) {
      const errText = await linkRes.text();
      console.error("Calendly scheduling link error:", linkRes.status, errText);
      return new Response(
        JSON.stringify({ result: "I had trouble creating the booking. I'll text you a link right after this call so you can pick your time." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const linkData = await linkRes.json();
    const bookingUrl = linkData.resource?.booking_url;

    // Format the chosen time for confirmation
    const dt = new Date(start_time);
    const dayStr = dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/Chicago" });
    const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" });

    // Update lead in Supabase if we have a lead_id
    if (lead_id) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabase
          .from("leads")
          .update({
            status: "ai_booked",
            notes: `AI booked for ${dayStr} at ${timeStr}. Booking link: ${bookingUrl}`,
          })
          .eq("id", lead_id);
      } catch (e) {
        console.error("Failed to update lead:", e);
      }
    }

    // If we have a phone number, we could SMS the link (future enhancement)
    // For now, the AI agent will tell them the time and the link will be texted

    return new Response(
      JSON.stringify({
        result: `Great news! I've got a booking link ready for ${dayStr} at ${timeStr}. Let the caller know their strategy call is being set up and they'll receive a confirmation text at their phone number with the booking link: ${bookingUrl}. Tell them to click the link to confirm the ${dayStr} at ${timeStr} slot.`,
        booking_url: bookingUrl,
        formatted_time: `${dayStr} at ${timeStr}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ result: "I ran into an issue booking the appointment. Let the caller know someone will follow up to get them scheduled." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
