# Take 3 Agency — Design System

The single source of truth for how the Take 3 site looks and feels. Every new page, section, or component should be built from the tokens and patterns below so the design stays consistent as it grows.

The living implementation of these tokens is `src/styles/global.css`. When you change a value, change it there (as a CSS variable) and update this doc — never hard-code a colour or size that a token already covers.

---

## 1. Brand character

- **Editorial, cinematic, high-contrast.** Dark by default, with a warm off-white ink and a single burnt-terracotta accent.
- **Big condensed display type** (Anton) against **clean, airy body text** (Jost 400).
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
| `--muted` | `#96928c` | Meta labels, fine print. 5.84:1 on `--bg`, 5.06:1 on `--tileBg` |
| `--hair` | `#35353a` | Hairline borders / dividers |
| `--tileBg` | `#232327` | Empty image plates, logo cells |
| `--accent` | `#d4704f` | Burnt terracotta — kickers, stats, links-of-note. 5.36:1 on `--bg`, 5.16:1 on the `#1a1a1c` reviews band, 4.65:1 on `--tileBg` |
| `--ctrlBorder` | `#6f6f77` | Control outlines (buttons, sub-list rules) — 3.63:1 on `--bg`, clearing WCAG 1.4.11 |

### Light theme (`[data-theme="light"]`)

| Token | Value |
|---|---|
| `--bg` | `#f4f2ee` |
| `--ink` | `#1a1a1c` |
| `--sub` | `#3a3632` |
| `--hair` | `#d9d6d1` |
| `--muted` | `#605d57` (5.87:1 on `--bg`, 4.98:1 on `--tileBg`) |
| `--tileBg` | `#e2e0dc` |
| `--ctrlBorder` | `#8a8781` |
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
| `--intimacyHeroBackdrop` | Theme-independent grey studio sweep for the intimacy portrait |

### Layout & utility tokens (on `:root`)

| Token | Value | Use |
|---|---|---|
| `--coverH` | `clamp(440px, 46vw, 720px)` | Height of flat, text-only page covers (About, Credits, Contact…) |
| `--coverPhotoH` | `clamp(440px, 56vw, 88vh)` | Height of covers carrying a photograph (home, Dancers…). Ceiling is the window height so wide screens never letterbox the picture |
| `--revGap` | `56px` | Gap between review cards; the card width is derived from it |
| `--logoFilter` | `invert(1)` dark / `none` light | Applied to the mono logo so one asset works in both themes |

### Dark band surface

Sections that stay dark in both themes (`.reviews`, `.bandDark`) use a fixed `#1a1a1c` background with `#f4f2ee` ink and `#c7c3bd` body copy, bounded by `--hair` rules. They are not tokens on purpose: they must not flip with the theme. Any accent or muted text placed on them has to be checked against `#1a1a1c`, not `--bg`.

### Accent rules
- Use `--accent` sparingly — kickers, stat numbers, "view" links, focus rings. It should feel like a highlight, never a fill for large areas.
- Both `--accent` and `--muted` are used at body/label size, so any change to either must keep **≥4.5:1 against `--bg`, against `--tileBg`, and against the `#1a1a1c` reviews band** in the theme it belongs to.
- The solid CTA button uses the oxblood `#5d1f16` (hover `#7a2f20`) in both themes for a consistent, weighty action colour.

---

## 3. Typography

### Font families
- **`'Jost', sans-serif`** — the default. Body, nav, labels, most headings. Weights loaded: 300, 400, 500, 600. **Body copy is 400** — 300 is reserved for large display figures (stat numbers) and large tracked display headings, never for reading text.
- **`'Anton', 'Jost', sans-serif`** — condensed display. Hero title, section titles, review/testimonial names, big statements. Always `text-transform:uppercase`, weight 400, and **`letter-spacing:0`**.
- **`'Cormorant Garamond', serif`** — editorial serif accent (currently used on the Models page). Reach for it only where an elegant serif is intentional.
- The intimacy title uses the same regular Cormorant Garamond face, served locally as `Intimacy Display` and preloaded to preserve the measured arm/letter alignment. Its condensed proportions are specific to that composition.

Load fonts once, in the document head:
```
https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&family=Anton&display=swap
```

### Type scale & patterns
All display headings use `font-weight:400` (never bold) and fluid `clamp()` sizing.

| Role | Family | Size | Notes |
|---|---|---|---|
| Hero / page cover title | Anton | `clamp(44px, 5.4vw, 92px)` | uppercase, `letter-spacing:0`, `line-height:1.06` (`.heroTitle`, `.pageHeroTitle`) |
| Page cover lede | Jost 400 | `clamp(17px, 1.6vw, 21px)` | `line-height:1.7`, colour `--heroInkSoft`, max `56ch` |
| Display title (bands) | Anton | `clamp(30px, 3.6vw, 52px)` | uppercase, `letter-spacing:0`, `line-height:1.1` (`.displayTitle`) |
| Hero kicker | Jost | `19px` | `letter-spacing:7px` |
| Section title | Anton | `clamp(26px, 3vw, 40px)` | uppercase, `letter-spacing:0` |
| About title | Jost | `clamp(30px, 3.2vw, 46px)` | uppercase, `line-height:1.18` |
| Footer title | Jost | `clamp(28px, 3.6vw, 50px)` | uppercase |
| Body copy | Jost 400 | `18px` | `line-height:1.7–1.75`, colour `--sub` |
| Stat / count number | Jost 300 | `clamp(28px, 2.6vw, 42px)` | colour `--accent`, `line-height:1`, `letter-spacing:1px`, `font-variant-numeric:tabular-nums` (`.statNum`, `.whereCountNum`, `.creditsCountNum`) |
| Category name | Jost | `17px` | `letter-spacing:3px`, uppercase, colour `--ink`, accent on hover |
| Kicker / eyebrow | Jost | `12px` | `letter-spacing:3px`, colour `--accent` |
| Small label / meta | Jost | `11–13px` | `letter-spacing:2–3px`, colour `--muted`, often uppercase |
| Review name | Anton | `clamp(32px, 3vw, 48px)` | uppercase, `letter-spacing:0` |

**Rule of thumb:** the smaller the text, the wider the tracking. Anton display type is always `letter-spacing:0`; Jost body copy is normal tracking; small labels get `2–3px`; the hero kicker goes to `7px`.

---

## 4. Layout & spacing

- **Content max-width:** `1280px`, centred with `margin:0 auto`.
- **Horizontal page padding:** `40px` desktop → `32px` tablet (≤1024) → `20px` phone (≤640). Nav uses `60px` desktop.
- **Section rhythm:** large vertical padding, e.g. about `96px 0 48px`, clients `96px 0`, footer top `72px 40px`.
- **Bands** (`.band`) are the generic content section on inner pages: `96px 0`, and consecutive bands drop their top padding so the rhythm stays even. `.bandDark` is `88px 0`. `.bandInner` carries the max-width and padding ladder; `.bandSplit` is the `1fr 1.4fr` two-column pairing, collapsing at ≤1024.
- **Page covers** use `--coverH` (text-only) or `--coverPhotoH` (photo). Both share a 440px floor so phones are never over-cropped.
- **Section header pattern:** title on the left, a small meta label on the right, sharing a baseline, with a `1px solid var(--hair)` bottom border (`.sectionHead`).
  - **The rule ends where the words do.** It runs the width of the text column, not of the padded box — so it starts under the first letter of the title and finishes under the last character of the meta label. `.sectionHead` paints its border on the padded box, so a section whose header carries its own padding draws the hairline on an inset pseudo-element instead (see the homepage).
- **One left edge per page.** Every band, header, body column and standfirst starts on the same line: the 1280px column, 40px in (40 / 40 / 20 down the ladder). That includes the copy over a full-bleed photograph — the home hero's kicker, title and production credit sit on the column, not on the header's wider 60px edge — and any link under a full-bleed grid, such as the homepage's "see all credits". Artwork may bleed past it; type may not.
- **Grids:**
  - About: `1fr 1.4fr` two-column, collapses to one column ≤1024.
  - Stats: 3 columns → 1 column on phone.
  - Poster grid: 5 → 3 → 2 columns.
  - Client logos: 6 → 4 → 3 columns.
  - Category grid (`.catGrid`): 4 → 2 → 1 columns, `24px` gap.
- **Horizontal scrollers** (`.supplyScroll`): draggable, hidden scrollbar, tiles sized with `flex:0 0 clamp(...)`. The page padding belongs to the scroller, not to the section around it, or the section's header is pushed off the column by it.
- **A tile's caption and its link are one group** (name, then the `view` link beside it), left-aligned within the tile. Spread to the tile's full width they read as pairs across the gap — each `view` sitting closer to the next tile's name than to its own.

### Breakpoints
| Width | Target |
|---|---|
| `≤1024px` | Tablet — collapse multi-column grids, tighten padding |
| `≤860px` | Tighter header padding, smaller logo and Get in touch button |
| `≤640px` | Phone — single columns, stacked hero |
| `≤999px` | Timecode slate drops its city label |
| `(hover: none)` | Touch — hover-revealed labels (poster names) are shown permanently |

---

## 5. Components

### Buttons
- **`.btnSolid`** — oxblood `#5d1f16` fill, ink text, `12px 22px`, `letter-spacing:2px`. Primary action (CTA, "Get in touch").
- **`.btnGhost`** — transparent with a `1px solid var(--ctrlBorder)` border; border darkens to `--ink` on hover. Secondary action. The outline of a control is not a hairline: it has to clear 3:1 against the surface behind it (WCAG 1.4.11), which `--hair` does not.
- **`.navCta`** — outlined, square-cornered button in the nav, uses hero border tokens.
- All button-ish text is `12–13px`, uppercase-feel, `letter-spacing:2px`.
- **Corners: every rectangular button, chip or tag is square (`border-radius:0`).** No pills, no soft radii. The only round controls on the site are icon-only ones — carousel arrows, dots and the theme toggle — which are full circles (`border-radius:50%`). Native `<button>` elements must carry the same reset so browsers never add their own rounding.

### Header (`.nav`)
- Fixed, with its own gradient scrim (`.nav::before`) so controls stay legible over any hero photograph. The scrim is removed on light pages (`.navOnLight`) and while the overlay menu is open.
- Contents: logo, timecode slate, then theme toggle, Get in touch and Menu on the right. The theme toggle and Get in touch stay visible at every width and while the menu is open.
- Background fades to solid on scroll (driven by `site.js`); logo shrinks `110px → 52px` on desktop, `72px → 44px` at ≤860px.

### Timecode slate (`.slate`)
- Clapperboard icon, city label and a live `HH:MM:SS:FF` readout at 24fps on `Europe/London`, in tabular monospace inside a fixed `11ch` box so digits never jitter.
- A labelled button (`aria-label="Clock: <city>. Change city"`), so it is reachable from the keyboard; only the ticking digits and the city label inside it are `aria-hidden`, so a screen reader is never read a running number. Pauses in a background tab; falls back to a once-a-second readout under `prefers-reduced-motion`.
- Hides the city label below `1000px`, and the whole slate below `640px`.

### Overlay menu (`.menu`)
- Full-screen on desktop as well as mobile, opened from the Menu button. Primary client list in Anton `clamp(30px, 4vw, 58px)`; Artists carries a permanently visible indented sub-list (never a hover state).
- A quieter "For performers" area holds the single performer-facing link, separated by a hairline.
- Escape and any link close it, focus is trapped, background scroll is locked, and the page behind is `inert`.
- Menu hierarchy and URLs are independent: categories keep flat top-level paths.
- Clicking a link navigates straight away; there is no wash or highlight on the chosen item. The "Join" link in the aside lifts its letters one by one and swaps its hairline rule for an accent one on hover. All of it is stilled under reduced motion.

### Theme toggle (`.themeBtn`)
- A 36px circular icon button using the hero border tokens; switches to `--ctrlBorder` / `--ink` over light surfaces (`.navOnLight`) and while the menu is open. Also drives the logo wall and mono logos via `--logoFilter`.

### Author notes (`.todoNote`)
- A small accent-coloured, accent-ruled note for copy that still needs supplying. It is a visible reminder in the layout, not a permanent pattern — remove it once the content lands.

### Hero (`.hero`)
- Min-height `78vh` (`82vh` on phone), dark `--heroBg`.
- Cross-fading background layers (`.heroLayer`, 1.8s opacity) under a gradient scrim (`.heroScrim`).
- Copy bottom-left on the page's content column; production credit bottom-right, ending on the same column; a bordered info strip along the bottom.
- In the genre strip each label and the `/` after it are one unwrappable unit (`.genreItem`), so a wrapped row on a phone can never open with a stray separator.

### Page cover (`.pageHero`)
- The inner-page counterpart to the home hero: always `--heroBg` / `--heroInk` regardless of theme, `min-height:var(--coverH)`, content aligned to the bottom, padding `170px 0 64px` → `150px 0 56px` (≤1024) → `130px 0 48px` (≤640).
- Stack is kicker (`--accent`) → `.pageHeroTitle` → optional `.pageHeroLede`. Every page gets the same cover height so the menu and header land in the same place site-wide.
- Specialist pages (Circus, Stunt, Intimacy, Unique talent, Stand-ins…) are built from this cover plus a run of `.band` sections; they share one template rather than bespoke layouts.

### Category grid (`.catGrid` / `.catLink`)
- Square `.catSlot` plates (a `.slot` with the artwork or an intentional empty plate), `.catName` beneath in tracked uppercase. Hover outlines the plate in `--ctrlBorder` and turns the name `--accent`. Used for the specialist category listings.

### Poster grid (`.posterGrid`)
- Production artwork in a tight `4px`-gutter grid, 5 → 3 → 2 columns, each cell on a `--tileBg` plate. The title (`.posterName`) is revealed on hover/focus with a gentle `scale(1.04)` on the image; on touch devices the name is always visible. `.posterMore` is the tracked-uppercase link to the full Credits page.
- Poster data lives in `src/data/posters.json`; never hand-place artwork in a page.

### Client logo wall (`.logoStack` / `.logoCell`)
- A grid of `.logoCell` tiles that swap between `data-dark` / `data-light` artwork with the theme, cycling through the roster in pages: outgoing cells lift, blur and fade (`.is-turning`), incoming ones settle. Clicking the wall advances it; `.logoHint` says so. Tiles without a dark asset sit on `--tileBg`.
- **Optical sizing.** Each mark's height in `src/data/clients.json` is worked out for it, not shared: every logo is rendered and measured for its shape and ink density, then scaled so the ink it puts on the page roughly matches its neighbours' (dense slabs like hulu or HBO drawn smaller, airy or hairline marks larger), inside the 160×56 desktop cell. The rule lives in `scripts/lib/optical-size.mjs`; re-run `node scripts/size-client-logos.mjs` after swapping a logo. Never hand-tune a height to make one brand bigger.

### Counters (`data-countup`)
- Any number wrapped in `data-countup` (stat row, Credits count, Where-we-work country count) counts up digit-by-digit as it scrolls into view, keeping its prefix/suffix and grouping. Years tick only their last stretch rather than starting from zero. The final width is held so the row never reflows, and the counter is skipped entirely under `prefers-reduced-motion` or without IntersectionObserver — the plain figure is always in the markup.

### Where we work (`.whereBand`)
- A cropped world map with `--accent` pins (dot + soft halo) for every country worked in, a full country list beside it, and a counter. Pins arrive one by one when the section scrolls into view; hovering or focusing a country highlights its pin and updates an `aria-live` readout. Reduced motion shows every pin at once.

### Reviews band (`.reviews`)
- Always-dark `#1a1a1c` band. Cards slide in a track (`.revTrack`, gap `--revGap`, three across), with Anton names, the quote, role, then a `.revCredits` row of production logos that fade in with the card. Arrows and dots are the thin circular controls; focus rings are pinned to `#f4f2ee`.
- Production logos beside a quote are sized by the same optical rule as the client wall: measured sizes live in `src/data/production-logo-sizes.json` (18–48px tall, at most 215px wide) and are read by `src/lib/productionLogos.ts`; re-run `node scripts/measure-production-logos.mjs` after adding a logo. An unmeasured logo falls back to a footprint match from its file until then.
- One card at a time on a phone, which makes the dots a long ragged double row of tiny targets: below 640px they are dropped and the `n / total` count and arrows carry the position. A horizontal drag pages the cards there; anything closer to vertical is left to scroll the page.

### Image slots (`.slot`)
- Where artwork isn't in place yet, render a deliberate empty plate: `--tileBg` background with a small uppercase `--muted` label. Not a broken image, an intentional placeholder.

### Cards / tiles
- Reviews carousel (`.revCard`), supply tiles (`.supplyTile`), poster grid — all lean on the same hairline + whitespace language.
- Dots and arrow buttons are circular (`border-radius:50%`), thin border, no fill.

### Insights cards (`.insightGrid` / `.insightCard`)
- The listing at `/insights` and the "more insights" row at the foot of an article share one card: hairline top border, 3:2 image (or a `.slot` plate), accent topic label, 22px title, excerpt, then a `--muted` meta line. Grid is 3 → 2 → 1 columns.
- Topic filters (`.insightChip`) are pill buttons carrying `aria-pressed`; they are progressive enhancement, so every article stays visible without JavaScript.
- Article prose (`.insightProse`) is capped at `68ch`, 18px/1.8 in `--sub`; `h2` is uppercase Jost at `clamp(22px,2.2vw,30px)`; list items take a 8x1px accent dash instead of a bullet; a `blockquote` becomes the hairline-ruled pull quote.
- Reading time is counted from the body in `src/lib/insights.ts`, never authored.

### Footer (`.footer`)
- Big uppercase title, contact line, ghost + solid button pair, then a thin divider and fine print row with the logo.

---

## 6. Motion

- **Easing:** `cubic-bezier(0.3, 0, 0.2, 1)` for carousels; `ease` for fades.
- **Durations:** theme/page transitions `0.5s`; hero layer cross-fade `1.8s`; logo cross-fade `3s`; carousel slide `0.65s`; menu items stagger in over `0.5s` (aside delayed `340ms`); poster hover `scale(1.04)`.
- **Scroll-triggered reveals** (counters, map pins) are armed with IntersectionObserver and run once. If the observer or `customElements` is unavailable, the final state is simply shown.
- **Nav scroll** is rAF-throttled and proportional to scroll position.
- **Always honour `prefers-reduced-motion: reduce`** — transitions are disabled and smooth scroll turned off in that media query. Any new animation must be wrapped the same way.

---

## 7. Accessibility

- Keep the **skip link** (`.skip`) as the first focusable element.
- **Focus rings** are explicit: `2px solid var(--accent)` (or `--heroInk` over dark areas), `outline-offset:3px`. Never remove focus outlines without an equivalent replacement.
  - The ring must be picked for the surface *behind* it, not the theme: `.navOnLight` (pages with `navOverDark={false}`) switches to `--ink` in light theme, and the always-dark `.reviews` band pins its ring to `#f4f2ee` in both themes.
- Maintain contrast: body copy uses `--sub`/`--ink` on `--bg`, not `--muted` for anything longer than a label. Every text token must clear **4.5:1** on the surfaces it is used on, in both themes.
- **Links in prose must not be colour-only.** `a { text-decoration:none }` is site-wide, so body-copy blocks (`.aboutBody`, `.clientsBody`, `.footerIntro`) re-add `text-decoration:underline` with `text-underline-offset:3px`. Nav, buttons and tile links stay undecorated.
- **Minimum target size is 24x24px** (WCAG 2.2 AA). Small visual controls carry the extra size as padding — e.g. `.revDot` paints a 9px circle inside a 24x24 button using `background-clip:content-box`.
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
8. **New inner pages start from the page cover + bands template**, not a bespoke layout. Pick `--coverH` or `--coverPhotoH` by whether the cover carries a photo.
9. **Numbers that should count up get `data-countup`** — the markup keeps the real figure so it reads correctly without JavaScript.
10. **Content comes from data, not markup:** posters, clients, production logos, categories and reviews live in `src/data` / `src/content`, and pages read from there.

---

_Last updated 2026-08-25. Update this file whenever a token, type choice, or core pattern changes._


### Launch studio (the slate on /laural)

The Laural cover is a WebGL scene (`src/lib/clapperStudio.js`, painted faces in
`src/lib/clapperArt.js`, shell `src/components/ClapperBoard.astro`): a bevelled
aluminium chassis with an acrylic insert, solid painted sticks on a real hinge,
a recessed LED behind glass, hovering over a fine-grained charcoal floor that
runs, in one continuous surface, into a paper backdrop. It is lit like a still
life: one soft front key (the only shadow-caster), a cool rim from behind and
above, a bare lamp hidden behind the board pooling on the paper, and quiet fill
— the slate falls out of focus as it recedes and the room darkens to black at
the edges and foreground. The room follows the site theme through the
`t3:themechange` event — charcoal by default, a pale slate studio in light — and
a theme change repaints the rear plate and relights the room without rebuilding
anything.

On /laural the board is one screen tall and does not scroll: the LED counts
down to the launch (`src/lib/countdown.js`, DD:HH:MM:SS, clamped at zero), a
clap counts the take up, and the board turns in the hand: drag it sideways to
spin it round, up or down to tip it; it stays where it hangs, coasts a little
when let go and settles to the nearest face, level again. "Turn it over" turns
the same axis, and flips it to a rear that carries the
Laural mark — tinted white on the dark plate, black on the pale one — and the
date, nothing else. The front prints "PRESENTS" over the mark, "COMING SOON" in Jost
capitals across the title band, and the date on the credit line. All the words come from the `launch` block in
`laural.json`. Until launch the board is the whole page: the platform sections
that used to follow are held back (their copy stays in `laural.json`).

The launch board idles `lively`: a fuller hover with a slow turn, nod and roll,
a sideways wander, lamps that breathe like tungsten, a camera that is never
quite still, and dust rising through the beam (150 soft additive points in the
dark room, faint grey specks in the pale one). The credits variant keeps its
`calm` idle. All of it is off under reduced motion.

The page paints only what sits around the canvas, with `--studioBack` (the
stage colour, matching the scene's own background), `--stageScrim`, and the
`--stage*` ink tokens for the copy in the room, all in `src/styles/global.css`
for both themes. Everything printed on the board is set in the brand faces —
Jost for labels, Caveat for the marker hand, Anton for the title band and the
rear — at texture resolution, so the type stays crisp as the object turns.

The component keeps its `credits` variant (the production deck; the board turns
over on scroll to show a record), but /credits no longer uses it: that page
opens on the plain dark cover, or on a full-bleed photo once `credits.json`
carries `hero.slides`, with the figures band beneath as before.
