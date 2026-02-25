# EpicLead.ai — Design System

## Color Palette

Define all colors as CSS custom properties in `:root` so niche versions can swap them easily.

```css
:root {
  /* Core palette */
  --bg-dark: #050508;
  --accent-blue: #0066ff;
  --white: #ffffff;
  --light-bg: #f7f7f7;

  /* Text */
  --text-primary: #ffffff;
  --text-muted: rgba(255, 255, 255, 0.55);
  --text-dark: #050508;
  --text-dark-muted: rgba(5, 5, 8, 0.6);

  /* Cards & borders */
  --card-bg: rgba(255, 255, 255, 0.04);
  --card-border: rgba(255, 255, 255, 0.08);
  --card-bg-blue: rgba(0, 0, 0, 0.15);
  --card-border-blue: rgba(0, 0, 0, 0.2);

  /* CTA */
  --cta-bg: #ffffff;
  --cta-text: #050508;
  --cta-bg-hover: rgba(255, 255, 255, 0.9);

  /* Utility */
  --glow-blue: rgba(0, 102, 255, 0.15);
  --grid-line: rgba(255, 255, 255, 0.03);
  --pulsing-dot: #00ff88;
}
```

## Typography

Load from Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
```

### Headlines — Bebas Neue
- Hero headline: `clamp(3rem, 12vw, 6rem)` — massive, line-height 0.95
- Section headlines: `clamp(2.5rem, 10vw, 5rem)` — line-height 0.95
- All uppercase, letter-spacing: 0.02em
- White on dark/blue backgrounds, `#050508` on light backgrounds

### Body — DM Sans
- Body text: 16px (1rem), weight 400, line-height 1.6
- Subheadlines: 18-20px, weight 400
- Card titles: 18-20px, weight 700
- Card descriptions: 15-16px, weight 400, muted color
- Tags/badges: 12-14px, weight 500, uppercase, letter-spacing 0.1em

## Spacing

- Section padding: `clamp(80px, 15vh, 120px)` top/bottom, `clamp(20px, 5vw, 40px)` left/right
- Max content width: 1200px, centered
- Mobile: sections should feel like full-viewport slides — use `min-height: 100vh` or close to it on key sections (hero, problem, final CTA)
- Between elements within a section: 24-40px
- Between headline and first content block: 48-64px

## Components

### Sticky Top Bar
```
- Position: fixed, top 0, full width, z-index 1000
- Background: rgba(5, 5, 8, 0.9) with backdrop-filter: blur(20px)
- Height: 60-70px
- Logo left: "EpicLead.ai" in white, bold, DM Sans 18-20px, font-weight 700
- CTA right: "Book a Free Call" — small blue pill button
- Border-bottom: 1px solid rgba(255, 255, 255, 0.06)
- Padding: 0 clamp(20px, 5vw, 40px)
```

### CTA Button (Primary)
```
- Background: var(--cta-bg) white
- Text: var(--cta-text) dark, DM Sans 16-18px, weight 700
- Padding: 18px 40px
- Border-radius: 50px (full pill)
- Full width on mobile (max-width: 480px)
- Centered on desktop (max-width: 400px)
- Hover: slight opacity decrease, subtle scale(1.02)
- Transition: all 0.3s ease
- Arrow prefix: → character in the button text
```

### CTA Button (Top Bar — Small)
```
- Background: var(--accent-blue)
- Text: white, DM Sans 14px, weight 600
- Padding: 10px 24px
- Border-radius: 50px
```

### Section Tag/Badge
```
- Display: inline-flex, align-items center
- Background: rgba(255, 255, 255, 0.06) on dark, rgba(0, 0, 0, 0.1) on blue
- Border: 1px solid rgba(255, 255, 255, 0.1)
- Border-radius: 50px
- Padding: 8px 20px
- Font: DM Sans 12-13px, weight 500, uppercase, letter-spacing 0.1em
- On hero: includes pulsing green dot (8px circle, animation: pulse 2s infinite)
```

### Pain/Feature Cards
```
Dark section cards:
- Background: var(--card-bg)
- Border: 1px solid var(--card-border)
- Border-radius: 16px
- Padding: 28px 24px
- Width: 100% on mobile

Blue section cards:
- Background: var(--card-bg-blue)
- Border: 1px solid var(--card-border-blue)
- Same radius and padding

Card content:
- Icon/emoji: 24-28px, margin-bottom 12px
- Title: DM Sans 18px bold, white
- Description: DM Sans 15px, muted color
```

### FAQ Accordion
```
- Container: full width, stacked vertically, 8px gap
- Item background: var(--card-bg)
- Item border: 1px solid var(--card-border)
- Border-radius: 12px
- Question row: padding 20px 24px, cursor pointer, flex between
- Question text: DM Sans 16-17px, weight 600, white
- Toggle icon: + / − or chevron, transition rotate
- Answer: padding 0 24px 20px, DM Sans 15px, muted text, max-height transition
- Only one open at a time
```

### Comparison Table (Section 6)
```
Two columns side by side on desktop, stacked on mobile
Left column (Others): items prefixed with ❌, muted styling
Right column (EpicLead): items prefixed with ✅, bold/white styling
Each item: padding 16px, border-bottom subtle separator
```

## Backgrounds & Effects

### Hero Grid Overlay
```css
/* CSS-only grid background — no images */
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
}
```

### Radial Blue Glow
```css
/* Used on hero and final CTA sections */
.hero::after {
  content: '';
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, var(--glow-blue) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
```

### Scroll Fade-In
```css
.section {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.section.visible {
  opacity: 1;
  transform: translateY(0);
}
```

Use IntersectionObserver in vanilla JS to add `.visible` class when section enters viewport.

## Responsive Breakpoints

```css
/* Mobile first — base styles are mobile */
/* Tablet */
@media (min-width: 768px) { }
/* Desktop */
@media (min-width: 1024px) { }
/* Large desktop */
@media (min-width: 1440px) { }
```

Key responsive behaviors:
- Headlines scale via `clamp()` — no breakpoint jumps
- Cards: single column mobile → 2x2 grid on tablet+ (Section 5)
- Comparison: stacked mobile → side-by-side desktop (Section 6)
- Steps: always single column, numbers get larger on desktop
- CTA button: full width on mobile, max-width centered on desktop
- Top bar: logo + CTA only, no hamburger menu needed (there's no nav)
