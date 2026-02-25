# EpicLead.ai — Backend Spec (Supabase + Calendly + Retell AI)

## Architecture Overview

The backend handles lead capture, calendar booking detection, and AI caller triggering. Three systems work together:

1. **Supabase** — Postgres database + Edge Functions (serverless API)
2. **Calendly** — Calendar booking with webhook notifications
3. **Retell AI** — AI outbound caller for leads who don't self-book

## Supabase Schema

### leads Table

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  business_type TEXT,
  status TEXT DEFAULT 'form_started',
  source TEXT,
  retell_call_id TEXT,
  calendly_uid TEXT,
  notes TEXT
);
```

### Lead Status Values

| Status | Meaning |
|--------|---------|
| `form_started` | Name + phone submitted, calendar shown, no booking yet |
| `calendar_shown` | Optional — tracks when Calendly embed was revealed |
| `booked` | Calendly webhook received — lead self-booked |
| `ai_called` | Retell outbound call triggered |
| `ai_booked` | Retell call resulted in a booking |
| `not_qualified` | Retell call completed — lead not a fit |
| `no_answer` | Retell call — no answer, voicemail, or hung up |

## Edge Functions

### 1. handle-lead-submit

**Trigger:** Form POST from frontend
**Actions:**
- Validate name + phone are present
- Insert lead row with status = `form_started`
- Return 200 with lead ID
- Schedule delayed call to `trigger-retell-call` after 3 minutes

### 2. trigger-retell-call

**Trigger:** Delayed invocation (3 minutes after form submit)
**Actions:**
- Check if lead status is still `form_started` or `calendar_shown`
- If already `booked` — exit, do nothing
- Call Retell API: `POST /v2/calls` with agent_id, to_number, from_number, metadata
- Update lead status = `ai_called`, store `retell_call_id`

### 3. handle-calendly-webhook

**Trigger:** Calendly `invitee.created` webhook POST
**Actions:**
- Validate `Calendly-Webhook-Signature` header using `CALENDLY_WEBHOOK_SECRET`
- Extract phone from `questions_and_answers` array
- Find matching lead in Supabase by phone number
- Update lead status = `booked`, store `calendly_uid`
- Cancel any pending Retell call if possible

### 4. handle-retell-webhook

**Trigger:** Retell `call.ended` event POST
**Actions:**
- Match call via `retell_call_id`
- Update lead status based on call outcome
- Store call transcript summary in notes field

## Calendly Integration

### Setup Requirements
- **Plan:** Calendly Standard ($10/mo) — required for webhook support
- **Custom question:** Add "Phone Number" as required field in event type
- **Webhook:** Create at Calendly → Integrations → Webhooks
  - URL: `https://[your-project].supabase.co/functions/v1/handle-calendly-webhook`
  - Event: `invitee.created`
  - Secret: Generate random string, store as `CALENDLY_WEBHOOK_SECRET`

### Embed Code
```html
<!-- Calendly inline widget — hidden by default, revealed after form submit -->
<div class="calendly-inline-widget"
  id="calendly-embed"
  data-url="https://calendly.com/alexsfreedman"
  style="min-width:320px;height:700px;display:none;">
</div>
<script src="https://assets.calendly.com/assets/external/widget.js" async></script>
```

Reveal after form submit:
```javascript
document.getElementById('calendly-embed').style.display = 'block';
```

### Extracting Phone from Webhook Payload
```javascript
const phoneAnswer = payload.questions_and_answers.find(
  q => q.question === "Phone Number"
);
const phone = phoneAnswer?.answer;
```

## Retell AI Integration

### Configuration
- **Platform:** retellai.com
- **Pricing:** $0.07/min flat rate
- **Voice:** ElevenLabs (connected via Retell dashboard)
- **LLM:** Claude or GPT-4o (configured in agent settings)
- **Phone number:** $2/month (purchased in Retell dashboard)
- **Agent type:** Outbound call agent
- **Max call duration:** 5 minutes

### Agent System Prompt
```
You are Alex, a friendly assistant calling on behalf of EpicLead.ai.
You're calling because {{name}} recently expressed interest in our
AI-powered lead generation system for their business.

Your goal: confirm their interest, answer basic questions,
and book them for a free 30-minute strategy call.

Keep it natural and conversational. Don't sound scripted.
If they're not interested, thank them warmly and end the call.
If they want to book, let them know you'll send a booking link
via text message right after this call.

Key qualifying questions to work into conversation naturally:
- What type of business do you run?
- Are you currently running any paid ads?
- Roughly how many leads or jobs are you looking to add per month?
```

### API Call — Trigger Outbound
```
POST https://api.retellai.com/v2/calls
Authorization: Bearer YOUR_RETELL_API_KEY
Content-Type: application/json

{
  "agent_id": "YOUR_AGENT_ID",
  "from_number": "+1XXXXXXXXXX",
  "to_number": "+1XXXXXXXXXX",
  "metadata": {
    "lead_id": "uuid",
    "name": "John Smith"
  }
}
```

## Environment Variables

| Variable | Source |
|----------|--------|
| `SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API |
| `RETELL_API_KEY` | Retell dashboard → API Keys |
| `RETELL_AGENT_ID` | Retell dashboard → after creating agent |
| `RETELL_PHONE_NUMBER` | Retell dashboard → Phone Numbers |
| `CALENDLY_WEBHOOK_SECRET` | Generate random string, paste in Calendly webhook setup |
| `CALENDLY_API_KEY` | Calendly → Integrations → API & Webhooks → Personal Access Token |

**IMPORTANT:** Never commit API keys to git. Store in Supabase Edge Function secrets and frontend `.env` file. Rotate any key that has been shared in a chat, email, or screenshot.

## File Structure

```
/schema.sql                              <- leads table + RLS policies
/supabase/functions/
  handle-lead-submit/index.ts            <- form POST handler
  trigger-retell-call/index.ts           <- outbound call trigger
  handle-calendly-webhook/index.ts       <- Calendly booking handler
  handle-retell-webhook/index.ts         <- post-call data handler
```

All edge functions should be TypeScript, production-ready, and well-commented.
