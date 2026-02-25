# EpicLead.ai — Project Context

## What This Is

EpicLead.ai is an AI-native lead generation agency. We run Meta ads, build conversion funnels, and deploy AI caller systems that follow up with leads and book appointments automatically. The client just shows up and closes.

This repo contains the agency's own website and funnel — not a client deployment.

## Current Phase: Landing Page Build

**Priority #1:** Build the landing page (`index.html`) as a single self-contained HTML file. This is the generic homepage. Niche-specific versions come later.

Read `spec.md` first for the full landing page specification. Then review the files in `docs/` for deep detail on each aspect.

## Documentation Map

| File | What It Covers |
|------|---------------|
| `spec.md` | Complete landing page spec — sections, copy, layout, technical requirements |
| `docs/design-system.md` | Color palette, typography, spacing, component styles (CSS variables, card styles, button styles) |
| `docs/style-reference.md` | Perspective.co design patterns — what to emulate, what to avoid. Reference screenshots in `example funnels/` |
| `docs/section-content.md` | Exact copy for every section — headlines, subheadlines, card text, FAQ answers |
| `docs/technical-requirements.md` | Frontend implementation details — HTML structure, CSS approach, JS behavior, responsive rules |
| `docs/backend-spec.md` | Supabase schema, edge functions, Calendly webhooks, Retell AI integration |
| `docs/funnel-flow.md` | Lead capture flow — from ad click to booked appointment, status transitions |

## Tech Stack

- **Frontend:** Vanilla HTML + CSS + JS (single file, no frameworks)
- **Backend:** Supabase (Postgres + Edge Functions)
- **Calendar:** Calendly Standard ($10/mo) — inline embed
- **AI Caller:** Retell AI
- **Voice:** ElevenLabs (via Retell)
- **Hosting:** Vercel or Netlify
- **Ads:** Meta (Facebook/Instagram)

## Key Design Rules

1. **Perspective.co style, NOT GoHighLevel.** Look at the screenshots in `example funnels/` — mobile-first, full-viewport color-blocked sections, bold oversized typography, minimal UI. No sidebars, no nav links, no stock photos, no generic gradients.
2. **Mobile-first.** Design for iPhone viewport first, then scale up to desktop.
3. **Single CTA throughout.** Every CTA button links to `[CALENDLY_LINK]` placeholder. One action: book a call.
4. **Bebas Neue for headlines, DM Sans for body.** Load from Google Fonts.
5. **Color palette defined in `:root` CSS variables** for easy niche swapping later.

## File Structure Target

```
/index.html                              <- full landing page, single file
/schema.sql                              <- Supabase table + RLS policies
/supabase/functions/
  handle-lead-submit/index.ts            <- form POST handler
  trigger-retell-call/index.ts           <- outbound call trigger
  handle-calendly-webhook/index.ts       <- Calendly booking handler
  handle-retell-webhook/index.ts         <- post-call data handler
```

## Build Order

1. **index.html** — the landing page (START HERE)
2. **schema.sql** — Supabase leads table
3. **Edge functions** — handle-lead-submit, then the rest

## What NOT to Build

- No GoHighLevel integration
- No payment processing or invoicing
- No client dashboard or multi-tenant system
- No admin panel (use Supabase dashboard)
- No email/SMS sequences (Retell handles follow-up)
- No niche-specific pages yet

## Agency Details

- **Offer:** Done-for-you AI lead generation system
- **Target:** Home service businesses (roofing, HVAC, solar, etc.)
- **Pricing:** $3,500-4,000 setup + $1,500-2,000/month retainer + ad spend
- **Differentiator:** AI caller follows up within 60 seconds
- **Tagline:** We run your ads. AI books your appointments. You just show up and close.
- **Instagram:** @epiclead.ai
