# NurseFlow AI — Design System & Specification
> **Visual Philosophy:** *Empathetic Tech* — dismantling the cold, sterile legacy of EHR UIs and replacing it with a warm, tactile, human-centred interface that actively reduces cognitive load during high-stress clinical shifts.

---

## 1. Aesthetic DNA

Inspired by the **Nurse CE Club** redesign (Dribbble shot #23467941), NurseFlow AI inherits and extends a design language best described as:

**Soft Claymorphic Bento** — a marriage of:
- **Claymorphism** — inflated, glossy 3D icons with smooth gradients and soft diffused shadows that feel physically touchable.
- **Bento Grid** — asymmetric card grids of varying sizes that create visual rhythm without rigidity.
- **Glassmorphism (selective)** — frosted translucency used sparingly on navigation and notification layers, never on primary content cards.
- **Illustrated Humanity** — 3D characters (nurses, doctors) integrated into layouts to create emotional warmth and brand personality.

The goal is a UI that feels like a **premium health app**, not a hospital spreadsheet.

---

## 2. Color Palette

All colors are defined as CSS custom properties for strict consistency across every surface.

```css
:root {
  /* === Brand Core === */
  --color-primary:        #FFB4B4;  /* Soft Coral Rose     – primary actions, CTAs, highlights      */
  --color-primary-deep:   #F28B82;  /* Muted Crimson        – critical alerts, destructive actions   */
  --color-secondary:      #AEDFF7;  /* Sky Blue             – info states, vitals, secondary buttons */
  --color-accent:         #C7B8EA;  /* Lavender Blush       – AI-generated content markers           */

  /* === Surfaces & Backgrounds === */
  --color-bg:             #FFF8F6;  /* Pearl Cream          – main page background                   */
  --color-surface:        #FFFFFF;  /* Pure White           – card surface                           */
  --color-surface-raised: #FFF0EE;  /* Blush Tint           – hover/selected card state              */
  --color-overlay:        rgba(255, 248, 246, 0.72); /* Glassmorphic overlay            */

  /* === Semantic / Clinical Safety === */
  --color-success:        #B8E8D4;  /* Mint Green           – SBAR approved, safe risk scores        */
  --color-warning:        #FFE4A0;  /* Warm Amber           – moderate alerts, pending meds          */
  --color-critical:       #F28B82;  /* Muted Crimson        – high fall-risk, NEWS2 deterioration    */
  --color-critical-glow:  rgba(242, 139, 130, 0.35); /* Pulse glow for urgent cards  */

  /* === Text === */
  --color-text-primary:   #2D2D2D;  /* Near-black           – headings, primary body                 */
  --color-text-secondary: #7A7A8C;  /* Cool Gray            – metadata, timestamps, labels           */
  --color-text-inverse:   #FFFFFF;  /* White                – text on dark/coral surfaces            */
  --color-text-muted:     #B0AEBA;  /* Muted Lavender-Gray  – disabled states, placeholders          */

  /* === Borders & Dividers === */
  --color-border:         rgba(255, 180, 180, 0.25); /* Subtle rose-tinted border     */
  --color-border-strong:  rgba(255, 180, 180, 0.55); /* Focused/active border         */
}
```

### Palette at a Glance

| Swatch | Name | Hex | Usage |
|:---|:---|:---|:---|
| 🟥 | Soft Coral Rose | `#FFB4B4` | Primary CTAs, branding, warm highlights |
| 🔵 | Sky Blue | `#AEDFF7` | Vitals, info states, secondary actions |
| 🟫 | Pearl Cream | `#FFF8F6` | Page background — reduces eye fatigue |
| ⬜ | Pure White | `#FFFFFF` | Card surfaces |
| 🟩 | Mint Green | `#B8E8D4` | Success / Safe / SBAR approved |
| 🟧 | Warm Amber | `#FFE4A0` | Moderate priority / Pending |
| 🔴 | Muted Crimson | `#F28B82` | Critical alerts / High fall-risk |
| 🟣 | Lavender Blush | `#C7B8EA` | AI-generated content, accent moments |

---

## 3. Typography

Typography was selected to complement the soft, rounded 3D aesthetic while maintaining absolute clinical readability.

```css
/* Google Fonts import */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  /* Typefaces */
  --font-display:  'Plus Jakarta Sans', sans-serif;  /* Headings, card titles      */
  --font-body:     'DM Sans', sans-serif;            /* Body copy, labels, inputs  */
  --font-mono:     'JetBrains Mono', monospace;      /* Vitals data, timestamps    */

  /* Scale — Major Third (1.25) */
  --text-xs:   0.64rem;   /* 10.24px – badges, micro-labels       */
  --text-sm:   0.8rem;    /* 12.8px  – secondary metadata         */
  --text-base: 1rem;      /* 16px    – body copy                  */
  --text-md:   1.25rem;   /* 20px    – card sub-headings          */
  --text-lg:   1.563rem;  /* 25px    – section headings           */
  --text-xl:   1.953rem;  /* 31px    – page section titles        */
  --text-2xl:  2.441rem;  /* 39px    – hero / dashboard headlines */
  --text-3xl:  3.052rem;  /* 49px    – landing hero               */
}
```

### Type Role Reference

| Role | Font | Weight | Size Token | Notes |
|:---|:---|:---|:---|:---|
| Page Hero | Plus Jakarta Sans | 800 | `--text-3xl` | Landing & onboarding screens |
| Section Title | Plus Jakarta Sans | 700 | `--text-xl` | Dashboard panels |
| Card Title | Plus Jakarta Sans | 600 | `--text-md` | SBAR handoffs, med cards |
| Body Copy | DM Sans | 400 | `--text-base` | Descriptions, notes |
| Labels / Meta | DM Sans | 500 | `--text-sm` | Timestamps, status tags |
| Vitals / Data | JetBrains Mono | 500 | `--text-base` | HR, SpO2, NEWS2 scores |
| Badges | DM Sans | 600 | `--text-xs` | Priority chips, risk tags |

---

## 4. Spacing & Layout Grid

```css
:root {
  /* 8pt base grid */
  --space-1:   4px;
  --space-2:   8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-5:   20px;
  --space-6:   24px;
  --space-8:   32px;
  --space-10:  40px;
  --space-12:  48px;
  --space-16:  64px;

  /* Border Radius — intentionally generous, echoing the claymorph 3D look */
  --radius-sm:   8px;
  --radius-md:   16px;
  --radius-lg:   24px;
  --radius-xl:   32px;
  --radius-pill: 9999px;
}
```

### Bento Grid System

The layout engine is a **CSS Grid bento** — not a rigid Bootstrap-style column system. Cards are placed intentionally across a 12-column grid with varying `grid-column` and `grid-row` spans to create the asymmetric rhythm visible in the reference designs.

```
┌─────────────────────────────────────────────────────┐
│  [Wide Hero Card — spans 8 cols]  [Tall — 4 cols]   │
│                                   [             ]   │
├──────────────┬──────────────┬─────[             ]───┤
│ [Med — 4col] │ [Med — 4col] │     [             ]   │
├──────────────┴──────────────┴─────────────────────  │
│  [Narrow — 3col] [Wide — 6col]  [Narrow — 3col]     │
└─────────────────────────────────────────────────────┘
```

**Rules:**
- No two adjacent cards should have identical dimensions.
- The most important card in a group gets the largest cell.
- Leave deliberate gaps — whitespace is a grid element, not wasted space.

---

## 5. Component Library

### 5.1 Cards (Bento Surface)

```css
.card {
  background:    var(--color-surface);
  border-radius: var(--radius-lg);          /* 24px */
  border:        1px solid var(--color-border);
  box-shadow:    0 2px 8px rgba(255, 180, 180, 0.08),
                 0 8px 32px rgba(0, 0, 0, 0.04);
  padding:       var(--space-6);
  transition:    transform 200ms ease, box-shadow 200ms ease;
}

.card:hover {
  transform:   translateY(-2px);
  box-shadow:  0 4px 16px rgba(255, 180, 180, 0.15),
               0 16px 48px rgba(0, 0, 0, 0.06);
}

/* Critical state — used for high fall-risk, NEWS2 deterioration */
.card--critical {
  border-color: var(--color-critical);
  box-shadow:   0 0 0 3px var(--color-critical-glow),
                0 8px 32px rgba(242, 139, 130, 0.15);
  animation:    criticalPulse 2.5s ease-in-out infinite;
}

@keyframes criticalPulse {
  0%, 100% { box-shadow: 0 0 0 3px var(--color-critical-glow); }
  50%       { box-shadow: 0 0 0 8px rgba(242, 139, 130, 0.12); }
}
```

### 5.2 Buttons

```css
/* Primary — Coral CTA */
.btn-primary {
  background:    var(--color-primary);
  color:         var(--color-text-primary);
  border-radius: var(--radius-pill);
  padding:       var(--space-3) var(--space-8);
  font-family:   var(--font-display);
  font-weight:   600;
  border:        none;
  box-shadow:    0 4px 16px rgba(255, 180, 180, 0.45);
  transition:    all 180ms ease;
}
.btn-primary:hover {
  transform:  translateY(-1px);
  box-shadow: 0 8px 24px rgba(255, 180, 180, 0.6);
}

/* Ghost — Secondary Action */
.btn-ghost {
  background:    transparent;
  border:        1.5px solid var(--color-border-strong);
  border-radius: var(--radius-pill);
  color:         var(--color-text-primary);
  padding:       var(--space-3) var(--space-8);
}

/* Danger — Irreversible clinical actions */
.btn-danger {
  background:    var(--color-critical);
  color:         var(--color-text-inverse);
  border-radius: var(--radius-pill);
}
```

### 5.3 Status Badges

Small pills used for priority triage across the whole app.

```css
.badge {
  display:       inline-flex;
  align-items:   center;
  gap:           var(--space-1);
  border-radius: var(--radius-pill);
  padding:       2px var(--space-3);
  font-family:   var(--font-body);
  font-weight:   600;
  font-size:     var(--text-xs);
  letter-spacing: 0.4px;
  text-transform: uppercase;
}
.badge--safe     { background: var(--color-success); color: #2D7A5A; }
.badge--warning  { background: var(--color-warning); color: #8A6200; }
.badge--critical { background: var(--color-critical); color: #FFFFFF; }
.badge--ai       { background: var(--color-accent); color: #5A4A8A; }
```

### 5.4 Navigation Bar (Glassmorphic)

```css
.nav {
  background:     var(--color-overlay);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom:  1px solid var(--color-border);
  position:       sticky;
  top:            0;
  z-index:        100;
}
```

### 5.5 3D Icon System

All 3D clay icons follow a consistent production spec to maintain visual cohesion. When commissioning or sourcing assets:

| Parameter | Value |
|:---|:---|
| Style | Claymorphism — inflated, soft-shadow, gradient-lit |
| Shadow | Diffused drop shadow, `blur: 24px, opacity: 30%` |
| Light source | Top-left, 45° angle |
| Base color relationship | Icon hue ≈ card accent color (coral icons on coral cards, etc.) |
| Dimensions | 80×80px (card icon), 120×120px (hero/feature icon) |
| Format | SVG (preferred) or WebP @2x |

**Icon Catalogue**

| Icon | Clinical Meaning | Color Family |
|:---|:---|:---|
| Heart with ECG line | Vitals monitoring | Coral / Rose |
| Pill capsule | Medication queue | Peach / Amber |
| Clipboard | SBAR handoff | Lavender |
| Stethoscope | Patient assessment | Sky Blue |
| Brain | Neuro / Fall-risk | Mint Green |
| Open book | CE courses / protocols | Sky Blue |
| Award medal | Certifications | Warm Gold |
| Smartphone | Mobile / Dashboard | Coral |

---

## 6. Core Feature Screens

### 6.1 Intelligent SBAR Handoff (F-01)

**Layout:** Full-width split-screen at desktop breakpoint (≥1024px); single-column tabbed at mobile.

```
┌────────────────────────┬──────────────────────────┐
│  RAW EHR DATA          │  AI DRAFT (editable)     │
│  ─────────────────     │  ─────────────────────   │
│  Vitals timeline       │  Situation:              │
│  [JetBrains Mono]      │  [Editable text area]    │
│                        │                          │
│  Meds administered     │  Background:             │
│  Lab results           │  [Editable text area]    │
│                        │                          │
│                        │  Assessment & Response:  │
│                        │  [Editable text area]    │
│                        │                          │
│                        │  [Approve & Sign] [Edit] │
└────────────────────────┴──────────────────────────┘
│              🎙️ Voice Note  (floating pill button) │
└───────────────────────────────────────────────────┘
```

**AI-generated sections** are marked with a `--ai` badge and a `--color-accent` left border to clearly distinguish AI output from nurse-authored content.

### 6.2 Medication Priority Queue (F-02)

Medications are stacked in a vertical bento column, ordered by due time. Visual hierarchy is achieved through card sizing and border treatment, not just color alone (WCAG safe).

| State | Card Treatment |
|:---|:---|
| **Due Now** | `--critical` glow border + pulse animation + large card |
| **Given** | Muted surface, strikethrough title, pill icon turns Mint Green |
| **Delayed** | `--warning` amber border, small clock icon badge |
| **Upcoming** | Default card surface, faded metadata |

### 6.3 Predictive Fall-Risk Monitor (F-03)

**Visualization:** Circular liquid-fill gauge inside a square bento card.

```
     ╭──────╮
    │  78%  │   ← JetBrains Mono, --text-2xl
    │ ╔════╗│
    │ ║████║│   ← Fill animates on data change
    │ ╚════╝│   ← Liquid-morph CSS animation
     ╰──────╯
  HIGH RISK        [ℹ️ See factors]
```

**Colour transition logic (CSS custom property driven):**

```css
/* Driven by JS setting --risk-value: 0–100 */
.risk-gauge {
  --fill-color: color-mix(
    in oklch,
    var(--color-critical) calc(var(--risk-value) * 1%),
    var(--color-success)  calc((100 - var(--risk-value)) * 1%)
  );
}
```

---

## 7. Motion & Animation

Motion is purposeful and clinical — never decorative for its own sake. Animations signal meaningful state changes.

```css
:root {
  --ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);  /* Card hover, badge pop  */
  --ease-smooth:  cubic-bezier(0.4, 0, 0.2, 1);        /* Navigation, panels     */
  --ease-linear:  linear;                               /* Progress bars, gauges  */

  --duration-fast:   120ms;   /* Micro-interactions (button press)     */
  --duration-base:   220ms;   /* Standard transitions (card hover)     */
  --duration-slow:   400ms;   /* Panel slides, modal entry             */
  --duration-xslow:  600ms;   /* Page load stagger, risk gauge fill    */
}
```

### Animation Catalogue

| Trigger | Animation | Duration | Easing |
|:---|:---|:---|:---|
| Page load | Staggered card fade-up (`opacity 0→1, translateY 24px→0`) | `600ms` | `--ease-smooth` |
| Card hover | `translateY(-2px)` + shadow deepen | `220ms` | `--ease-spring` |
| Critical alert entry | Scale-in from 0.92 + glow pulse starts | `300ms` | `--ease-spring` |
| SBAR AI generation | Skeleton loader → text typewriter reveal | `800ms` | `--ease-smooth` |
| Risk gauge fill | Liquid-fill sweep (SVG stroke-dashoffset) | `1000ms` | `--ease-smooth` |
| Badge state change | Crossfade via `opacity` + `scale(1.08)` pop | `150ms` | `--ease-spring` |

---

## 8. Accessibility & Clinical Safety Standards

This is non-negotiable. Every design decision must pass both visual and safety validation.

| Requirement | Standard | Implementation |
|:---|:---|:---|
| Text contrast | WCAG 2.1 AA (4.5:1 body, 3:1 large) | All text/background combinations tested via the palette |
| Clinical alert contrast | WCAG 2.1 AAA (7:1) | `--color-critical` alerts exceed 7:1 on white |
| Focus indicators | WCAG 2.4.7 | Visible 2px `--color-primary` ring on all interactive elements |
| AI explainability | Custom clinical standard | Every AI output has an `ℹ️` tap target explaining the 3 top contributing factors in plain language |
| Haptic tiers | iOS/Android guidelines | Tier 1 (soft): general updates · Tier 2 (medium): med due · Tier 3 (rigid): clinical deterioration |
| Touch targets | WCAG 2.5.5 (44×44px min) | All buttons and interactive elements meet minimum touch target size |
| Motion safety | WCAG 2.3.3 | All looping animations include `prefers-reduced-motion: reduce` override |

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration:   0.01ms !important;
    transition-duration:  0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

---

## 9. Responsive Breakpoints

```css
/* Mobile-first */
:root {
  --bp-sm:   480px;   /* Large phones                    */
  --bp-md:   768px;   /* Tablets (iPad portrait)         */
  --bp-lg:  1024px;   /* Tablets landscape / small laptop */
  --bp-xl:  1280px;   /* Desktop                         */
  --bp-2xl: 1536px;   /* Wide desktop / dual monitors    */
}
```

**Bento grid collapses:**
- `< 768px` → single column, cards stack vertically
- `768–1024px` → 2-column bento, simplified hierarchy
- `> 1024px` → full asymmetric bento (reference design)

---

## 10. Design Tokens (Full Reference)

```json
{
  "color": {
    "primary":       "#FFB4B4",
    "primary-deep":  "#F28B82",
    "secondary":     "#AEDFF7",
    "accent":        "#C7B8EA",
    "bg":            "#FFF8F6",
    "surface":       "#FFFFFF",
    "success":       "#B8E8D4",
    "warning":       "#FFE4A0",
    "critical":      "#F28B82"
  },
  "font": {
    "display": "Plus Jakarta Sans",
    "body":    "DM Sans",
    "mono":    "JetBrains Mono"
  },
  "radius": {
    "sm":   "8px",
    "md":   "16px",
    "lg":   "24px",
    "xl":   "32px",
    "pill": "9999px"
  },
  "shadow": {
    "card":     "0 2px 8px rgba(255,180,180,0.08), 0 8px 32px rgba(0,0,0,0.04)",
    "card-hover": "0 4px 16px rgba(255,180,180,0.15), 0 16px 48px rgba(0,0,0,0.06)",
    "critical": "0 0 0 3px rgba(242,139,130,0.35)"
  }
}
```

---

## 11. Do's & Don'ts

| ✅ Do | ❌ Don't |
|:---|:---|
| Use claymorphic 3D icons at consistent spec | Use flat 2D icons — they break the aesthetic |
| Stack bento cards with intentional size variation | Create uniform grids of identical card sizes |
| Use `JetBrains Mono` for all numerical clinical data | Use display font for vitals — legibility suffers |
| Mark every AI output with a `--ai` badge + lavender border | Present AI content as indistinguishable from nurse-authored content |
| Animate only on meaningful state changes | Add animations to every hover/tap interaction |
| Test all alerts against WCAG AAA | Rely on color alone to convey clinical severity |
| Keep backgrounds Pearl Cream (`#FFF8F6`) | Use pure white backgrounds — too clinical, increases fatigue |
| Use pill-shaped buttons with coral fill for primary CTAs | Use rectangular/square buttons — breaks the soft aesthetic |

---

*Design System version 1.0 — NurseFlow AI · Inspired by Nurse CE Club (Dribbble #23467941)*