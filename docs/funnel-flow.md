# EpicLead.ai — Funnel Flow

## Overview

The funnel has two stages. Stage 1 captures the lead. Stage 2 books the call. The AI caller only fires if Stage 2 isn't completed within 3 minutes.

## Step-by-Step Flow

### Stage 1 — Lead Capture

1. User clicks Meta ad → lands on `epiclead.ai` landing page
2. User scrolls through sections (hero, problem, solution, etc.)
3. User watches VSL (video sales letter) if present
4. User clicks CTA → scrolls to lead capture form (Section 8, `#lead-form`)
5. User enters **Name + Phone** → hits submit
6. Frontend POSTs to Supabase `handle-lead-submit` edge function
7. Supabase inserts lead row: `status = form_started`
8. Frontend reveals Calendly inline embed below the form

### Stage 2 — Booking (Two Paths)

**Path A — Self-Book (preferred):**
1. Lead sees Calendly embed after form submission
2. Lead books a time slot directly
3. Calendly fires `invitee.created` webhook to Supabase
4. Supabase updates lead: `status = booked`
5. Any pending Retell call is cancelled — lead already converted
6. Done. Appointment is on the calendar.

**Path B — AI Caller (fallback):**
1. 3-minute timer expires after form submission
2. Supabase checks: is lead status still `form_started` or `calendar_shown`?
3. If yes → triggers Retell API outbound call to lead's phone number
4. Retell AI agent calls the lead within 60 seconds
5. AI qualifies the lead conversationally (business type, ad spend, goals)
6. If qualified → AI books them and sends Calendly link via text
7. Supabase updates: `status = ai_booked`
8. If not qualified or no answer → Supabase updates: `status = not_qualified` or `no_answer`

## Status Transitions

```
form_started ──→ booked         (self-booked via Calendly)
form_started ──→ ai_called      (3 min timer expired, Retell triggered)
ai_called    ──→ ai_booked      (Retell call succeeded, appointment set)
ai_called    ──→ not_qualified   (Retell call completed, not a fit)
ai_called    ──→ no_answer       (no pickup, voicemail, hung up)
```

## Why This Flow Works

- **Speed:** AI calls within 60 seconds of the timer. Lead is still warm.
- **Non-intrusive:** Gives the lead 3 minutes to self-book first. AI is only the fallback.
- **No manual work:** The client never touches a lead. System handles everything.
- **Deduplication:** If lead books while timer is running, the Calendly webhook cancels the Retell call. No double-booking.

## Landing Page's Role

The landing page itself is a pre-sell machine:
1. **Hero** — big promise, establishes what EpicLead does
2. **Problem** — agitates pain the lead already feels
3. **Solution** — presents the system as the fix
4. **How It Works** — makes it feel simple and low-risk
5. **What's Included** — shows the full package
6. **Why EpicLead** — differentiates from generic agencies
7. **FAQ** — handles objections before they become blockers
8. **Final CTA** — urgency (limited per market), captures the lead

By the time someone fills out the form, they've been pre-sold. The Calendly embed or AI call is just the final step.
