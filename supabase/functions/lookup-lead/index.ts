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
    console.log("lookup-lead received:", JSON.stringify(body));

    const args = body.args || body;
    let phone = args.phone || "";
    const email = args.email || "";
    const name = args.name || "";

    // Retell includes call metadata with from_number — use as fallback
    const callFromNumber = body.call?.from_number || body.from_number || "";
    if (!phone && callFromNumber) {
      phone = callFromNumber;
      console.log("Using caller's phone from call metadata:", phone);
    }

    // Also check dynamic_variables for phone
    const dynPhone = body.call?.dynamic_variables?.phone || body.dynamic_variables?.phone || "";
    if (!phone && dynPhone) {
      phone = dynPhone;
      console.log("Using phone from dynamic variables:", phone);
    }

    console.log("Searching with - phone:", phone, "email:", email, "name:", name);

    if (!phone && !email && !name) {
      return new Response(
        JSON.stringify({ result: "I need a phone number, email, or name to look up the caller.", found: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let lead = null;
    let error = null;

    // Try phone first
    if (phone) {
      phone = phone.replace(/\D/g, "");
      if (phone.length === 10) phone = "1" + phone;
      if (!phone.startsWith("+")) phone = "+" + phone;

      const res = await supabase
        .from("leads")
        .select("*")
        .eq("phone", phone)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      lead = res.data;
      error = res.error;
    }

    // If not found by phone, try email
    if (!lead && email) {
      const res = await supabase
        .from("leads")
        .select("*")
        .ilike("email", email.trim())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      lead = res.data;
      error = res.error;
    }

    // If still not found, try name (partial match)
    if (!lead && name) {
      const res = await supabase
        .from("leads")
        .select("*")
        .ilike("name", `%${name.trim()}%`)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      lead = res.data;
      error = res.error;
    }

    if (!lead) {
      console.log("No lead found. Last error:", error?.message);
      return new Response(
        JSON.stringify({
          result: `I could not find any record matching the info provided (phone: ${phone || "none"}, email: ${email || "none"}, name: ${name || "none"}). This might be a new caller. Ask if they want to book a new appointment.`,
          found: false,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("Found lead:", lead.id, lead.name, lead.status);

    // Check if they have a Calendly event and get appointment details
    let appointmentInfo = "No appointment on file.";
    let appointmentTime = "";
    if (lead.calendly_event_uri) {
      // Fetch the actual appointment details from Calendly
      try {
        const calendlyPat = Deno.env.get("CALENDLY_PAT");
        if (calendlyPat) {
          const eventRes = await fetch(lead.calendly_event_uri, {
            headers: { "Authorization": `Bearer ${calendlyPat}` },
          });
          if (eventRes.ok) {
            const eventData = await eventRes.json();
            const event = eventData.resource;
            if (event && event.start_time) {
              const dt = new Date(event.start_time);
              const day = dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/Chicago" });
              const time = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" });
              appointmentTime = `${day} at ${time}`;
              appointmentInfo = `Has a booked appointment on ${appointmentTime}.`;
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch Calendly event details:", e);
        appointmentInfo = "Has a booked appointment but I could not fetch the exact time.";
      }
    } else if (lead.status === "ai_booked") {
      appointmentInfo = "Has a booked appointment (booked by AI) but no Calendly link on file.";
    }

    return new Response(
      JSON.stringify({
        result: `Found the caller: ${lead.name}, email: ${lead.email || "none on file"}, status: ${lead.status}. ${appointmentInfo}`,
        found: true,
        lead_id: lead.id,
        name: lead.name,
        email: lead.email,
        status: lead.status,
        appointment_time: appointmentTime || null,
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
