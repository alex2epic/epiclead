// calendly-book — Books an appointment on Calendly for a lead
// Called by Retell AI agent during a live call
// Uses Calendly Scheduling API (POST /invitees) for REAL direct booking
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EVENT_TYPE_URI = "https://api.calendly.com/event_types/ee07aa62-27df-4fa9-ab20-7ca66d0ca262";

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
        JSON.stringify({ result: "I'm unable to book right now. Someone will follow up to get you scheduled." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use a real email or generate a placeholder
    const inviteeEmail = email || `lead-${lead_id || Date.now()}@epiclead.ai`;

    // Book directly via Calendly Scheduling API — POST /invitees
    const bookRes = await fetch("https://api.calendly.com/invitees", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${calendlyPat}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: EVENT_TYPE_URI,
        start_time: start_time,
        invitee: {
          name: name,
          email: inviteeEmail,
          timezone: "America/New_York",
        },
        location: {
          kind: "zoom_conference",
        },
      }),
    });

    if (!bookRes.ok) {
      const errText = await bookRes.text();
      console.error("Calendly booking error:", bookRes.status, errText);
      return new Response(
        JSON.stringify({ result: "I had trouble booking the appointment. Let the caller know someone will follow up to get them scheduled." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bookData = await bookRes.json();
    const eventUri = bookData.resource?.event;
    const cancelUrl = bookData.resource?.cancel_url;
    const rescheduleUrl = bookData.resource?.reschedule_url;

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
            calendly_event_uri: eventUri || null,
            notes: `AI booked Zoom call for ${dayStr} at ${timeStr}`,
          })
          .eq("id", lead_id);
      } catch (e) {
        console.error("Failed to update lead:", e);
      }
    }

    return new Response(
      JSON.stringify({
        result: `The appointment is confirmed for ${dayStr} at ${timeStr}. It's a Zoom meeting — they'll receive a calendar invite with the Zoom link at their email. Let the caller know they're all set and confirmed for ${dayStr} at ${timeStr}.`,
        formatted_time: `${dayStr} at ${timeStr}`,
        event_uri: eventUri,
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
