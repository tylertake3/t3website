# Take 3 Agency — Design System

The single source of truth for how the Take 3 site looks and feels. Every new page, section, or component should be built from the tokens and patterns below so the design stays consistent as it grows.

The living implementation of these tokens is `src/styles/global.css`. When you change a value, change it there (as a CSS variable) and update this doc — never hard-code a colour or size that a token already covers.

---

## 1. Brand character

- **Editorial, cinematic, high-contrast.** Dark by default, with a warm off-white ink and a single burnt-terracotta accent.
- **Big condensed display type** (Anton) against **light, airy body text** (Jost 300).
- **Generous whitespace, thin hairline rules**, wide letter-spacing on small labels.
- Imagery does the heavy lifting; UI chrome stays quiet and restrained.

---

## 2. Colour

Colours are CSS variables defined on `:root` (dark, the default) and overridden on `[data-theme="light"]`. Always reference the variable, not the hex.

### Dark theme (default)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#161618` | Page background |
| `--ink` | `#f4f2ee` | Primary text |
| `--sub` | `#c2beb6` | Secondary / body copy |
| `--muted` | `#96928c` | Meta labels, fine print |
| `--hair` | `#35353a` | Hairline borders / dividers |
| `--tileBg` | `#232327` | Empty image plates, logo cells |
| `--accent` | `#c65b40` | Burnt terracotta — kickers, stats, links-of-note |

### Light theme (`[data-theme="light"]`)

| Token | Value |
|---|---|
| `--bg` | `#f4f2ee` |
| `--ink` | `#1a1a1c` |
| `--sub` | `#3a3632` |
| `--hair` | `#d9d6d1` |
| `--tileBg` | `#e2e0dc` |
| `--accent` | `#5d1f16` (deep oxblood) |

### Hero tokens (constant across themes)

The hero is always dark, regardless of theme, so it has its own token set:

| Token | Value |
|---|---|
| `--heroBg` | `#101012` |
| `--heroInk` | `#f4f2ee` |
| `--heroInkSoft` | `rgba(244,242,238,0.7)` |
| `--heroInkFaint` | `rgba(244,242,238,0.35)` |
| `--heroLine` | `rgba(244,242,238,0.25)` |
| `--heroBtnBorder` | `rgba(244,242,238,0.5)` |
| `--heroScrim` | vertical dark gradient over hero imagery |

### Accent rules
- Use `--accent` sparingly — kickers, stat numbers, "view" links, focus rings. It should feel like a highlight, never a fill for large areas.
- The solid CTA button uses the oxblood `#5d1f16` (hover `#7a2f20`) in both themes for a consistent, weighty action colour.

---

## 3. Typography

### Font families
- **`'Jost', sans-serif`** — the default. Body, nav, labels, most headings. Weights loaded: 300, 400, 500, 600 (+ italics 300/400).
- **`'Anton', 'Jost', sans-serif`** — condensed display. Hero title, section titles, big statements. Always `text-transform:uppercase`, weight 400.
- **`'Bebas Neue', 'Jost', sans-serif`** — tall condensed, used for review/testimonial names.
- **`'Cormorant Garamond', serif`** — editorial serif accent (currently used on the Models page). Reach for it only where an elegant serif is intentional.

Load fonts once, in the document head:
```
https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Anton&family=Bebas+Neue&display=swap
```

### Type scale & patterns
All display headings use `font-weight:400` (never bold) and fluid `clamp()` sizing.

| Role | Family | Size | Notes |
|---|---|---|---|
| Hero title | Anton | `clamp(44px, 5.4vw, 92px)` | uppercase, `letter-spacing:2px`, `line-height:1.06` |
| Hero kicker | Jost | `19px` | `letter-spacing:7px` |
| Section title | Anton | `clamp(26px, 3vw, 40px)` | uppercase, `letter-spacing:1px` |
| About title | Jost | `clamp(30px, 3.2vw, 46px)` | uppercase, `line-height:1.18` |
| Footer title | Jost | `clamp(28px, 3.6vw, 50px)` | uppercase |
| Body copy | Jost 300 | `18px` | `line-height:1.7–1.75`, colour `--sub` |
| Stat number | Jost 300 | `clamp(30px, 3vw, 44px)` | colour `--accent`, `line-height:1` |
| Kicker / eyebrow | Jost | `12px` | `letter-spacing:3px`, colour `--accent` |
| Small label / meta | Jost | `11–13px` | `letter-spacing:2–3px`, colour `--muted`, often uppercase |
| Review name | Bebas Neue | `clamp(32px, 3vw, 48px)` | `letter-spacing:2px` |

**Rule of thumb:** the smaller the text, the wider the tracking. Body copy is normal tracking; labels get `2–3px`; the hero kicker goes to `7px`.

---

## 4. Layout & spacing

- **Content max-width:** `1280px`, centred with `margin:0 auto`.
- **Horizontal page padding:** `40px` desktop → `32px` tablet (≤1024) → `20px` phone (≤640). Nav uses `60px` desktop.
- **Section rhythm:** large vertical padding, e.g. about `96px 0 48px`, clients `96px 0`, footer top `72px 40px`.
- **Section header pattern:** title on the left, a small meta label on the right, sharing a baseline, with a `1px solid var(--hair)` bottom border (`.sectionHead`).
- **Grids:**
  - About: `1fr 1.4fr` two-column, collapses to one column ≤1024.
  - Stats: 3 columns → 1 column on phone.
  - Poster grid: 5 → 3 → 2 columns.
  - Client logos: 6 → 4 → 3 columns.
- **Horizontal scrollers** (`.supplyScroll`): draggable, hidden scrollbar, tiles sized with `flex:0 0 clamp(...)`.

### Breakpoints
| Width | Target |
|---|---|
| `≤1024px` | Tablet — collapse multi-column grids, tighten padding |
| `≤860px` | Mobile nav — hamburger + slide-down panel |
| `≤640px` | Phone — single columns, stacked hero |

---

## 5. Components

### Buttons
- **`.btnSolid`** — oxblood `#5d1f16` fill, ink text, `12px 22px`, `letter-spacing:2px`. Primary action (CTA, "Get in touch").
- **`.btnGhost`** — transparent with `1px solid var(--hair)` border; border darkens to `--ink` on hover. Secondary action.
- **`.navCta`** — outlined pill in the nav, uses hero border tokens.
- All button-ish text is `12–13px`, uppercase-feel, `letter-spacing:2px`.

### Nav (`.nav`)
- Fixed, transparent at top, fades to solid dark on scroll (driven by `site.js`).
- Logo shrinks from `110px` → `52px` height as you scroll (JS).
- Collapses to a hamburger + slide-down panel at ≤860px.

### Hero (`.hero`)
- Min-height `78vh` (`82vh` on phone), dark `--heroBg`.
- Cross-fading background layers (`.heroLayer`, 1.8s opacity) under a gradient scrim (`.heroScrim`).
- Copy bottom-left; production credit bottom-right; a bordered info strip along the bottom.

### Image slots (`.slot`)
- Where artwork isn't in place yet, render a deliberate empty plate: `--tileBg` background with a small uppercase `--muted` label. Not a broken image, an intentional placeholder.

### Cards / tiles
- Reviews carousel (`.revCard`), supply tiles (`.supplyTile`), poster grid — all lean on the same hairline + whitespace language.
- Dots and arrow buttons are circular (`border-radius:50%`), thin border, no fill.

### Footer (`.footer`)
- Big uppercase title, contact line, ghost + solid button pair, then a thin divider and fine print row with the logo.

---

## 6. Motion

- **Easing:** `cubic-bezier(0.3, 0, 0.2, 1)` for carousels; `ease` for fades.
- **Durations:** theme/page transitions `0.5s`; hero layer cross-fade `1.8s`; logo cross-fade `3s`; carousel slide `0.65s`.
- **Nav scroll** is rAF-throttled and proportional to scroll position.
- **Always honour `prefers-reduced-motion: reduce`** — transitions are disabled and smooth scroll turned off in that media query. Any new animation must be wrapped the same way.

---

## 7. Accessibility

- Keep the **skip link** (`.skip`) as the first focusable element.
- **Focus rings** are explicit: `2px solid var(--accent)` (or `--heroInk` over dark areas), `outline-offset:3px`. Never remove focus outlines without an equivalent replacement.
- Maintain contrast: body copy uses `--sub`/`--ink` on `--bg`, not `--muted` for anything longer than a label.
- Provide `alt` text on images, `aria-label`s on icon-only buttons (see the theme toggle and nav toggle).

---

## 8. Conventions for new work

1. **Reference tokens, never raw hex.** If you need a new colour, add a variable to both themes in `global.css` first.
2. **Headings are weight 400 + `clamp()`.** No bold display type.
3. **Match the section-header pattern** (title left, meta right, hairline under) for any new content section.
4. **Respect the max-width (`1280px`) and the padding ladder** (40 / 32 / 20).
5. **Wrap every transition in the reduced-motion guard.**
6. **Empty states are intentional plates**, not blanks or broken images.
7. Keep the accent rare; let imagery and whitespace carry the page.

---

_Last updated 2026-08-25. Update this file whenever a token, type choice, or core pattern changes._
