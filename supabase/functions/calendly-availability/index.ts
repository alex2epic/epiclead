// calendly-availability — Returns available time slots from Calendly
// Called by Retell AI agent during a live call
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
    // Retell sends tool call args inside body.args
    const args = body.args || body;
    const requestedDate = args.date; // e.g. "2026-02-26" or "tomorrow" or "next Monday"

    const calendlyPat = Deno.env.get("CALENDLY_PAT");
    if (!calendlyPat) {
      return new Response(
        JSON.stringify({ result: "Sorry, I'm unable to check the calendar right now. Please try booking online at epiclead.ai" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the requested date into a range
    let startDate: Date;
    let endDate: Date;
    const now = new Date();

    if (!requestedDate || requestedDate === "today") {
      startDate = now;
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 1);
    } else if (requestedDate === "tomorrow") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    } else if (requestedDate === "this week") {
      startDate = now;
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 7);
    } else {
      // Try parsing as a date string
      const parsed = new Date(requestedDate);
      if (!isNaN(parsed.getTime())) {
        startDate = new Date(parsed);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
      } else {
        // Default: next 3 days
        startDate = now;
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 3);
      }
    }

    // Ensure start is not in the past — Calendly requires start_time in the future
    const minStart = new Date(now.getTime() + 5 * 60 * 1000); // 5 min buffer
    if (startDate < minStart) startDate = minStart;

    const startTime = startDate.toISOString();
    const endTime = endDate.toISOString();

    // Query Calendly availability
    const url = `https://api.calendly.com/event_type_available_times?event_type=${encodeURIComponent(EVENT_TYPE_URI)}&start_time=${startTime}&end_time=${endTime}`;

    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${calendlyPat}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Calendly API error:", res.status, errText);
      return new Response(
        JSON.stringify({ result: "I'm having trouble checking the calendar. Could you try booking online at epiclead.ai instead?" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    const slots = data.collection || [];

    if (slots.length === 0) {
      return new Response(
        JSON.stringify({ result: `No available slots found for ${requestedDate || "today"}. Try asking about tomorrow or later this week.` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format slots in a human-readable way, limit to 6
    const formatted = slots.slice(0, 6).map((slot: any) => {
      const dt = new Date(slot.start_time);
      const day = dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/Chicago" });
      const time = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" });
      return { day, time, start_time: slot.start_time };
    });

    const slotList = formatted.map((s: any) => `${s.day} at ${s.time}`).join(", ");

    return new Response(
      JSON.stringify({
        result: `Available times: ${slotList}. Ask the caller which one works best for them.`,
        slots: formatted,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ result: "I had trouble checking availability. Let me have someone follow up with you to get that scheduled." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
