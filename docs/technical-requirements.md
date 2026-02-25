# EpicLead.ai — Technical Requirements (Frontend)

## Core Constraints

- **Single HTML file** — everything in one `index.html`. All CSS in a `<style>` tag, all JS in a `<script>` tag at the bottom.
- **No frameworks** — vanilla HTML, CSS, and JS only. No React, no Tailwind, no jQuery, no GSAP.
- **No external images** — all visual elements (grid, glow, icons) are CSS-only or emoji. The VSL placeholder is just a styled container.
- **Google Fonts only** — Bebas Neue + DM Sans loaded via `<link>` tag.

## HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EpicLead.ai — AI-Native Lead Generation</title>
  <meta name="description" content="We run your ads. AI books your appointments. Done-for-you lead generation for home service businesses.">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  <style>/* All CSS here */</style>
</head>
<body>
  <!-- Sticky top bar -->
  <nav class="topbar">...</nav>

  <!-- Section 1: Hero -->
  <section class="section section-hero" id="hero">...</section>

  <!-- Section 2: Problem -->
  <section class="section section-problem" id="problem">...</section>

  <!-- Section 3: Solution -->
  <section class="section section-solution" id="solution">...</section>

  <!-- Section 4: How It Works -->
  <section class="section section-steps" id="steps">...</section>

  <!-- Section 5: What's Included -->
  <section class="section section-included" id="included">...</section>

  <!-- Section 6: Why EpicLead -->
  <section class="section section-why" id="why">...</section>

  <!-- Section 7: FAQ -->
  <section class="section section-faq" id="faq">...</section>

  <!-- Section 8: Final CTA -->
  <section class="section section-cta" id="cta">...</section>

  <script>/* All JS here */</script>
</body>
</html>
```

## CSS Approach

### Reset & Base
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
body { font-family: 'DM Sans', sans-serif; color: var(--text-primary); background: var(--bg-dark); overflow-x: hidden; }
```

### CSS Variables
Define all colors, fonts, and key sizes in `:root`. See `design-system.md` for the full variable list. This makes niche-specific color swaps trivial — just override the variables.

### Mobile-First
All base styles target mobile (375-390px viewport width). Use `min-width` media queries to enhance for larger screens. Never use `max-width` queries.

### Clamp for Typography
Use `clamp()` for all headline sizes so they scale smoothly without breakpoint jumps:
```css
.headline { font-size: clamp(3rem, 12vw, 6rem); }
```

### Section Layout
Each section should be:
```css
.section {
  width: 100%;
  padding: clamp(80px, 15vh, 120px) clamp(20px, 5vw, 40px);
  position: relative;
  overflow: hidden;
}
.section-inner {
  max-width: 1200px;
  margin: 0 auto;
}
```

## JavaScript Behavior

### Scroll Fade-In (IntersectionObserver)
```javascript
// Observe all sections, add 'visible' class when in viewport
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.section').forEach(section => {
  observer.observe(section);
});
```

### FAQ Accordion
```javascript
// Click to toggle, only one open at a time
document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-question').addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});
```

### Sticky Top Bar Behavior
The top bar is always fixed/sticky. Optionally add a subtle background opacity increase on scroll (goes from slightly transparent to more opaque as user scrolls).

### CTA Links
All CTA buttons (top bar, hero, final section) should use:
```html
<a href="[CALENDLY_LINK]" class="cta-button">→ Book Your Free Strategy Call</a>
```
`[CALENDLY_LINK]` is a placeholder — will be replaced with the actual Calendly scheduling URL.

### VSL Placeholder
```html
<div class="vsl-container">
  <!-- Replace [VIDEO_EMBED_URL] with actual embed -->
  <iframe src="[VIDEO_EMBED_URL]" frameborder="0" allowfullscreen></iframe>
</div>
```
Style with 16:9 aspect ratio, rounded corners (16px), and a dark background fallback.

## Responsive Behavior

### Mobile (< 768px)
- CTA buttons: full width, padding 18px
- Cards: single column, full width
- Headlines: `clamp()` handles sizing
- Sections: generous vertical padding
- Comparison (Section 6): stacked vertically — "Others" block above "EpicLead" block

### Tablet (768px - 1023px)
- Cards: 2-column grid where applicable (Section 5)
- CTA buttons: auto width, centered
- Content max-width kicks in

### Desktop (1024px+)
- Full 2x2 grids
- Comparison side by side
- Larger headline sizes via clamp
- More horizontal padding
- Content comfortably within 1200px max-width

## Performance

- No external JS libraries — small footprint
- Google Fonts loaded with `display=swap` to prevent FOIT
- CSS animations use `transform` and `opacity` only (GPU-accelerated)
- No images to load (except the VSL iframe when URL is set)
- IntersectionObserver is lightweight and efficient

## Accessibility Basics

- Semantic HTML: `<nav>`, `<section>`, `<h1>`-`<h3>`, `<button>` for FAQ toggles
- Proper heading hierarchy (one `<h1>` in hero, `<h2>` for section headlines)
- CTA links have descriptive text
- FAQ buttons have `aria-expanded` attribute
- Color contrast meets WCAG AA (white on dark blue, dark on light)
- Focus styles for keyboard navigation
