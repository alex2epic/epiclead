// handle-inbound-call — Retell inbound webhook
// Fires BEFORE the call connects. Looks up the caller by phone number
// and returns dynamic variables so the AI knows who's calling.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const payload = await req.json();
    console.log("Inbound call webhook:", JSON.stringify(payload));

    const fromNumber = payload.from_number || "";
    const agentId = payload.agent_id || "";

    if (!fromNumber) {
      // No caller ID — just let the call through with defaults
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Normalize phone to E.164 for lookup
    let phone = fromNumber.replace(/\D/g, "");
    if (phone.length === 10) phone = "1" + phone;
    if (!phone.startsWith("+")) phone = "+" + phone;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up the most recent lead with this phone number
    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (lead) {
      // Known caller — pass their info as dynamic variables
      console.log(`Inbound call from known lead: ${lead.name} (${lead.id})`);
      return new Response(
        JSON.stringify({
          call_inbound: {
            dynamic_variables: {
              name: lead.name || "",
              email: lead.email || "",
              phone: phone,
              lead_id: lead.id,
              is_known_lead: "true",
              lead_status: lead.status || "",
              calendly_event_uri: lead.calendly_event_uri || "",
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      // Unknown caller
      console.log(`Inbound call from unknown number: ${phone}`);
      return new Response(
        JSON.stringify({
          call_inbound: {
            dynamic_variables: {
              name: "",
              email: "",
              phone: phone,
              lead_id: "",
              is_known_lead: "false",
              lead_status: "",
              calendly_event_uri: "",
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("Inbound webhook error:", err);
    // Return 200 with empty response so the call still goes through
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
