# EpicLead.ai — Landing Page Spec

## Overview

Single-page landing page for EpicLead.ai, an AI-native lead generation agency. This is the generic homepage — niche-specific versions will be built separately later.

The page is a conversion funnel. One goal: get visitors to book a free strategy call. Every section drives toward that single CTA.

## Design Direction

**Perspective.co style, NOT GoHighLevel.** See `docs/style-reference.md` for detailed patterns and `example funnels/` for reference screenshots.

Key principles:
- Mobile-first, full-viewport sections that feel like slides
- Bold, oversized typography — Bebas Neue headlines
- High contrast color blocking — dark/blue/white sections
- Minimal clutter — no sidebars, no nav links, no distractions
- One CTA repeated consistently throughout
- Smooth scroll with subtle section fade-ins
- Phone mockup graphics or bold stat callouts as visual anchors
- NO stock photo hero images, NO generic purple gradients, NO typical GHL look

See `docs/design-system.md` for the full color palette, typography, and component specs.

## Page Structure

### Section 1 — Hero
- **Background:** `#050508` with subtle CSS grid overlay and radial blue glow center
- **Top bar:** Logo left (`EpicLead.ai` white bold) — no nav links — CTA button top right (`Book a Free Call`, blue pill)
- **Badge:** Animated pulsing green dot + `AI-Native Lead Generation`
- **Headline:** `WE RUN YOUR ADS. AI BOOKS YOUR APPOINTMENTS.`
- **Subheadline:** You focus on delivering the work. We build and run the entire system that fills your calendar — ads, funnel, and AI follow-up included.
- **VSL placeholder:** Rounded video container with `[VIDEO_EMBED_URL]` placeholder
- **CTA Button:** `→ Book Your Free Strategy Call` (full width mobile, centered desktop)
- **Social proof:** `Trusted by home service businesses across the US`
- **Scroll indicator:** `SWIPE →` or down arrow

### Section 2 — The Problem
- **Background:** `#0066ff` (bold blue)
- **Tag:** `Sound familiar?`
- **Headline:** `YOU'RE PAYING FOR LEADS THAT GO NOWHERE.`
- **Pain cards** (dark pill/card style on blue):
  - You buy lead packs and half never pick up
  - You're running ads with no real follow-up system
  - Your calendar is empty while competitors stay booked
- **Transition:** `There's a better way.`

### Section 3 — The Solution
- **Background:** `#050508`
- **Tag:** `The Epic System`
- **Headline:** `A DONE-FOR-YOU MACHINE THAT RUNS 24/7`
- **Feature blocks** (column layout — large icon, bold title, one-line description):
  - AI-Generated Meta Ads — Scroll-stopping video ads created and managed for you, targeting the right people in your market
  - High-Converting Funnel — Your leads land on a page built to pre-sell your offer before they ever speak to you
  - AI Caller & Booking System — If they don't self-book, our AI calls within 60 seconds, qualifies them, and locks in an appointment automatically

### Section 4 — How It Works
- **Background:** `#f7f7f7` (light gray)
- **Tag:** `Simple process`
- **Headline:** `FROM AD CLICK TO BOOKED CALL IN 3 STEPS`
- **Steps** (large numbered, bold):
  - **01 — We Build & Launch** — Your ads, funnel, and AI system are live within 7–10 days of onboarding. Zero tech headaches on your end.
  - **02 — Traffic Hits Your Funnel** — Prospects see your offer, watch your VSL, and either book themselves or submit their info.
  - **03 — AI Does the Follow-Up** — Our AI caller contacts every lead within 60 seconds, qualifies them on the phone, and puts them on your calendar.

### Section 5 — What's Included
- **Background:** `#050508`
- **Tag:** `Everything. Done for you.`
- **Headline:** `ONE SYSTEM. ZERO GUESSWORK.`
- **2x2 card grid:**
  - AI Ad Creatives — AI-generated UGC-style video ads built and managed
  - Full Funnel Build — VSL page, offer page, and calendar booking flow
  - AI Caller System — Calls, qualifies, and books leads 24/7 automatically
  - Campaign Management — Monthly reporting, optimization, and scaling
- **Promise line:** "We don't just run ads. We build the system that turns clicks into customers — automatically."

### Section 6 — Why EpicLead
- **Background:** `#0066ff`
- **Tag:** `Why we're different`
- **Headline:** `NOT ANOTHER ADS AGENCY.`
- **Two-column comparison:**
  - Other Agencies: Hand you leads and disappear / Generic templates and copy-paste campaigns / You chase cold leads manually / Monthly retainer, no accountability
  - EpicLead.ai: We follow up until they're booked / Custom AI content for your market / AI calls every lead within 60 seconds / We only win when you win

### Section 7 — FAQ
- **Background:** `#050508`
- **Headline:** `Common Questions`
- **Accordion items** (4 questions, vanilla JS toggle):
  - Q: Do you replace my existing phone system or CRM? — A: No. We plug our AI caller into your existing setup. We don't touch what's already working for you.
  - Q: How fast can we go live? — A: Most clients are fully live within 7–10 business days after onboarding.
  - Q: What markets do you work in? — A: We work across the US. We do limit to one client per market per niche — book a call to check your area.
  - Q: What kind of results should I expect? — A: Every market is different. What we guarantee is a complete system built and running — ads live, funnel converting, AI following up every lead. The more we optimize, the better it gets.

### Section 8 — Final CTA / Lead Capture
- **Background:** `#050508` with large blue radial glow from bottom
- **Headline:** `READY TO WAKE UP TO BOOKED APPOINTMENTS?`
- **Subtext:** We work with a limited number of businesses per market. Book your free strategy call to see if your area is still available.
- **CTA Button:** `→ Book Your Free Strategy Call` (large, full width mobile)
- **Trust line:** `No contracts. No fluff. Just a system that works.`
- **Footer:** `@epiclead.ai` muted text

## Technical Requirements

See `docs/technical-requirements.md` for full implementation details. Summary:

- Single HTML file, fully self-contained
- Mobile-first responsive — iPhone first, scales to desktop
- Google Fonts: Bebas Neue + DM Sans
- Sticky top bar with logo and CTA
- All CTAs link to `[CALENDLY_LINK]` placeholder
- FAQ accordion — click to expand/collapse
- Scroll-triggered fade-in on each section
- No external JS frameworks — vanilla JS and CSS only
- VSL section uses `[VIDEO_EMBED_URL]` placeholder
- CSS-only grid background on hero
- Color variables in `:root` for niche swapping

## Backend Integration

See `docs/backend-spec.md` for Supabase, Calendly, and Retell AI integration details. The landing page needs:

- Form POST to Supabase `handle-lead-submit` edge function
- Calendly inline embed revealed after form submit
- Placeholder URLs for all webhook endpoints
