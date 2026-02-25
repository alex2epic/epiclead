# EpicLead.ai — Style Reference (Perspective.co Patterns)

## What We're Emulating

Perspective.co builds mobile-first funnels that feel like swiping through an app, not scrolling a website. See the screenshots in `example funnels/` for visual reference.

The key visual patterns from those screenshots:

### Layout Pattern
- **Full-viewport sections** — each section fills or nearly fills the screen, creating a "slide deck" feel when scrolling
- **Single column content** — everything stacked vertically, centered, maximum 600-700px content width even on desktop
- **Generous whitespace** — sections breathe, nothing feels cramped
- **Phone mockups as visual anchors** — several Perspective examples use centered phone/device mockups showing the funnel interface as a visual element between text blocks

### Typography Pattern
- **Oversized headlines** — headlines dominate each section, sometimes 40-60% of the visible area
- **High contrast** — white text on dark backgrounds, dark text on light backgrounds, always maximum readability
- **Minimal body text** — subheadlines are 1-2 sentences max, never paragraphs
- **Bold tags/labels** — small uppercase labels above headlines to categorize each section

### Color Blocking Pattern
- **Alternating section backgrounds** — dark, blue, dark, light, dark, blue, dark — creates visual rhythm
- **Each section is a distinct color block** — no gradual gradients between sections, hard color changes
- **Blue sections feel energetic** — used for problem awareness and differentiation (Sections 2 and 6)
- **Dark sections feel premium** — used for hero, solution, features, FAQ, final CTA
- **Light section stands out** — only Section 4 (How It Works) uses light bg, making it visually distinct

### Interaction Pattern
- **Single CTA** — one button, one action, repeated everywhere
- **No navigation** — no header nav links, no footer nav, no sitemap
- **Scroll indicators** — subtle hints to keep scrolling (arrow, "swipe" text)
- **Minimal interactivity** — only the FAQ accordion and CTA buttons are interactive

## What to AVOID

These are patterns from GoHighLevel templates and generic agency sites that we do NOT want:

- **Hero images** — no stock photos of handshakes, office buildings, or people on phones
- **Purple/teal gradients** — no generic SaaS color schemes
- **Multiple nav links** — no "Home / About / Services / Contact" navigation
- **Sidebar content** — no sidebars, ever
- **Multiple CTAs** — no "Learn More" vs "Get Started" vs "Contact Us" — just one action
- **Testimonial carousels** — no auto-sliding testimonial sections
- **Icon grids** — no 4x4 grids of generic line icons with labels
- **Footer mega-menus** — no massive footer with columns of links
- **Floating chat widgets** — no Drift/Intercom-style chat bubbles
- **Cookie banners** — not needed for this page
- **Generic agency stock imagery** — no dashboards, no analytics screenshots, no team photos

## Section Background Rhythm

This alternating pattern creates visual flow:

```
Section 1 (Hero):        #050508  DARK
Section 2 (Problem):     #0066ff  BLUE
Section 3 (Solution):    #050508  DARK
Section 4 (How It Works): #f7f7f7  LIGHT
Section 5 (Included):    #050508  DARK
Section 6 (Why Us):      #0066ff  BLUE
Section 7 (FAQ):         #050508  DARK
Section 8 (Final CTA):   #050508  DARK (with blue glow)
```

## Mobile-First Mentality

The page should look perfect on an iPhone 14/15 viewport (390x844) FIRST. Desktop is the responsive adaptation, not the other way around.

On mobile:
- Headlines fill the width
- CTA buttons are full-width
- Cards stack vertically with full width
- Sections use full viewport height where appropriate
- Touch-friendly tap targets (min 44px)
- No horizontal scrolling ever

On desktop:
- Content centers in a max-width container (1200px)
- Cards can go to 2-column grid
- CTA buttons have max-width and center
- More generous padding
- Headlines are even bigger thanks to clamp()
