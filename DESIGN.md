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

Every always-dark surface (`.hero`, `.pageHero`, `.bandDark`) keeps the dark palette in the light theme too — `--accent` stays the terracotta `#d4704f`, with the dark `--muted`, `--sub`, `--hair`, `--tileBg` and `--ctrlBorder` — because the light theme's oxblood is unreadable on near-black. This is one rule in `global.css`; never patch it per page.
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
- **`'Courier Prime', 'Courier New', Courier, monospace`** — the typewriter face of the call sheet (the slate of briefs and the blank brief sheet on the Artists page). Only the answers are set in it — 13px, 2px tracking, uppercase, 700 in `--accent` — the labels beside them stay in the Jost caption voice. Weights loaded: 400, 700. Do not use it for reading copy elsewhere.
- **`'Cormorant Garamond', serif`** — editorial serif accent (currently used on the Models page). Reach for it only where an elegant serif is intentional.
- The intimacy title uses the same regular Cormorant Garamond face, served locally as `Intimacy Display` and preloaded to preserve the measured arm/letter alignment. Its condensed proportions are specific to that composition.

Load fonts once, in the document head:
```
https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&family=Anton&family=Caveat:wght@600;700&family=Courier+Prime:wght@400;700&display=swap
```

### Type scale & patterns
All display headings use `font-weight:400` (never bold) and fluid `clamp()` sizing.

| Role | Family | Size | Notes |
|---|---|---|---|
| Hero / page cover title | Anton | `clamp(44px, 5.4vw, 92px)` | uppercase, `letter-spacing:0`, `line-height:1.06`, `white-space:pre-line` so a `\n` in the copy breaks the line (`.heroTitle`, `.pageHeroTitle`) |
| Page cover lede | Jost 400 | `clamp(17px, 1.6vw, 21px)` | `line-height:1.7`, colour `--heroInkSoft`, max `56ch` |
| Display title (bands) | Anton | `clamp(30px, 3.6vw, 52px)` | uppercase, `letter-spacing:0`, `line-height:1.1` (`.displayTitle`) |
| Hero kicker | Jost | `19px` | `letter-spacing:7px` |
| Section title | Anton | `clamp(26px, 3vw, 40px)` | uppercase, `letter-spacing:0`, `line-height:1.1` with `padding-block:0.2em`: the padding gives back the room the font's own line height left above and below, so a one-line title sits where it always did, while a title that wraps on a phone holds together |
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
- **A picture and its words stay side by side on a tablet** (641–1024): a split band pairing one portrait with copy keeps two columns (`1fr 1fr`, or `0.9fr 1.1fr`, `36px` gap) and stacks only on a phone. Stacked at tablet width, each portrait ran taller than the screen with an empty half beside it (Models, Intimacy's workshop clip, Unique talent).
- **Page covers** use `--coverH` (text-only) or `--coverPhotoH` (photo). Both share a 440px floor so phones are never over-cropped.
- **Section header pattern:** title on the left, a small meta label on the right, sharing a baseline, with a `1px solid var(--hair)` bottom border (`.sectionHead`).
  - **The rule ends where the words do.** It runs the width of the text column, not of the padded box — so it starts under the first letter of the title and finishes under the last character of the meta label. `.sectionHead` paints its border on the padded box, so a section whose header carries its own padding draws the hairline on an inset pseudo-element instead (see the homepage).
- **One left edge per page.** Every band, header, body column and standfirst starts on the same line: the 1280px column, 40px in (40 / 40 / 20 down the ladder). That includes the copy over a full-bleed photograph — the home hero's kicker, title and production credit sit on the column, not on the header's wider 60px edge — and any link under a full-bleed grid, such as the homepage's "see all credits". Artwork may bleed past it; type may not.
- **Grids:**
  - About: `1fr 1.4fr` two-column, collapses to one column ≤1024.
  - Stats: 3 columns at every width; on the smallest phones (≤400px) the figures ease down to `clamp(20px, 6.6vw, 28px)` so "1,500+" fits a third of the screen.
  - Poster grid: 5 → 3 → 3 columns (two across on a phone made each poster a screen-filling tile). On a phone the homepage wall shows its first 12 posters (four rows); "See all credits" carries the rest.
  - Client logos: 6 → 4 → 3 columns.
  - Category grid (`.catGrid`): 4 → 2 → 2 columns, `24px` gap (`24px 14px` on phone, where the name drops to 13px/2px and the description to 13px). It never goes to one column: a full-width 4:5 plate per route made the four routes four screens long.
- **Horizontal scrollers** (`.supplyScroll`): draggable, hidden scrollbar, tiles sized with `flex:0 0 clamp(...)`. The page padding belongs to the scroller, not to the section around it, or the section's header is pushed off the column by it. On a touchscreen (`(hover: none) and (pointer: coarse)`) the homepage roster is a plain native scroller: no drift, no drag, no endless loop and no pause control; the duplicate copies are removed, tiles snap to the left edge (`scroll-snap-type:x proximity`) and `touch-action:pan-x pan-y` keeps a vertical swipe scrolling the page. The drift and the drag fought the phone's own momentum scrolling and the row stuttered. A short set of routes that would stack to several screens on a phone (After Dark's three talent pictures) becomes the same kind of row there: cards `72%` wide with the next one peeking in, `scroll-snap-type:x mandatory`, bleeding to the screen edge with the page padding carried as `scroll-padding`.
- **A tile's caption and its link are one group** (name, then the `view` link beside it), left-aligned within the tile. Spread to the tile's full width they read as pairs across the gap — each `view` sitting closer to the next tile's name than to its own.

### Breakpoints
| Width | Target |
|---|---|
| `≤1024px` | Tablet — collapse multi-column grids, tighten padding |
| `≤860px` | Tighter header padding, smaller logo and Get in touch button |
| `≤400px` | Smallest phones: header tightens again, Get in touch label 11px |
| `≤360px` | Narrowest phones: Get in touch label 10px, the one text allowed under 11px, so logo, toggle, button and Menu still fit on one row |
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
- **Corners: every rectangular button is square (`border-radius:0`).** No soft radii. The two pills on the site are the Insights topic chips (`.insightChip`) and the event audience badge (`.eventTag`), which share one recipe. The only round controls on the site are icon-only ones — carousel arrows, dots and the theme toggle — which are full circles (`border-radius:50%`). Native `<button>` elements must carry the same reset so browsers never add their own rounding.

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
- Copy bottom-left on the page's content column; production credit bottom-right, ending on the same column; a bordered info strip along the bottom. On a phone the credit drops into the flow under the headline but keeps its right alignment and reads as a footnote: label 11px/2.5px, production name 14px/3px weight 400, never a second headline. The same applies to every photo cover's production credit (Dancers, SPACTs, Stunt performers).
- The headline is set one box per letter (`.heroLine` / `.heroCh`, the `h1` carrying the readable line). With a fine pointer, each letter within 170px of the cursor leans away from it, up to 8px for the nearest, following at 10% a frame so the movement is soft, and eases back when the pointer leaves the hero. Nothing moves on touch or under reduced motion.
- The genre strip is one row at every width and never wraps: when the words outgrow the window the row scrolls sideways (no scrollbar, both edges softened by a mask the width of the strip's inset, `--stripPad`: 40 → 12 → 20px), and it stays centred whenever it fits. Each label and the `/` after it are one unit (`.genreItem`).

### Page cover (`.pageHero`)
- The inner-page counterpart to the home hero: always `--heroBg` / `--heroInk` regardless of theme, `min-height:var(--coverH)`, content aligned to the bottom, padding `170px 0 64px` → `150px 0 56px` (≤1024) → `130px 0 48px` (≤640).
- Stack is kicker (`--accent`) → `.pageHeroTitle` → optional `.pageHeroLede`. Every page gets the same cover height so the menu and header land in the same place site-wide.
- **Small type over a photograph.** Where a photo cover's copy moves over the middle of the picture (tablets and phones, ≤1024), the scrim starts darkening higher (≈0.3 at 18%, 0.66 at 40%, 0.9 at the foot) and the accent kicker and the credit carry the event cover's `text-shadow:0 1px 12px rgba(20,20,22,.9)`, so the label reads over any still. Desktop keeps the lighter scrim, where the copy sits on the dark foot.
- The kicker is the menu section followed by the discipline, in tracked uppercase: `ARTISTS: SPECIAL ACTION PERFORMERS`, `ARTISTS: DANCERS`, `SPECIALISTS · STUNTS`. It never repeats the agency name, which the logo already carries.
- Specialist pages (Circus, Stunt, Intimacy, Unique talent, Stand-ins…) are built from this cover plus a run of `.band` sections; they share one template rather than bespoke layouts. The Stunt cover carries two stills (Chi Lewis-Parry in 28 Years Later: The Bone Temple, James Wilkinson in Masters of the Universe) that cross-fade every 5s with a bottom-right credit following, the event-cover recipe; only the first loads with the page.

### Category grid (`.catGrid` / `.catLink`)
- Square `.catSlot` plates (a `.slot` with the artwork or an intentional empty plate), `.catName` beneath in tracked uppercase. Hover outlines the plate in `--ctrlBorder` and turns the name `--accent`. Used for the specialist category listings.
- A route that has its artwork renders `.catSlotPhoto` instead of the empty `.slot`: same plate and aspect ratio, the photo `object-fit:cover` with the house grade (`saturate(.92) contrast(1.05) brightness(.96)`). Framing is set per item with `imageFocus` in the page JSON, so a wide still can be cropped to the portrait plate without losing its subject.
- A tile can carry `stills`, further pictures it fades through (`.catStill`, stacked over the first, a slow 2.8s cross-fade on the house ease) every 7s, each tile a quarter-beat behind the last so the grid never changes all at once. Only while the grid is on screen and the tab is visible; the extra pictures load after the page has; under reduced motion the first picture simply stays. The Artists page's four routes use it.

### Poster grid (`.posterGrid`)
- Production artwork in a tight `4px`-gutter grid, 5 → 3 → 3 columns, each cell on a `--tileBg` plate. The title (`.posterName`) is revealed on hover/focus with a gentle `scale(1.04)` on the image; on touch devices the name is always visible. `.posterMore` is the tracked-uppercase link to the full Credits page.
- Poster data lives in `src/data/posters.json`; never hand-place artwork in a page.

### Client logo wall (`.logoStack` / `.logoCell`)
- A grid of `.logoCell` tiles that swap between `data-dark` / `data-light` artwork with the theme, cycling through the roster in pages: outgoing cells lift, blur and fade (`.is-turning`), incoming ones settle. Clicking the wall advances it; `.logoHint` says so. Tiles without a dark asset sit on `--tileBg`.
- With a fine pointer the marks lean away from the cursor like the hero headline (within 220px, up to 10px for the nearest, following at 10% a frame, settling back on leave). It rides on the `translate` property, apart from the `transform` the turn uses, so the turn and the click to advance are unchanged; nothing moves on touch or under reduced motion.
- **Optical sizing.** Each mark's height in `src/data/clients.json` is worked out for it, not shared: every logo is rendered and measured for its shape and ink density, then scaled so the ink it puts on the page roughly matches its neighbours' (dense slabs like hulu or HBO drawn smaller, airy or hairline marks larger), inside the 160×56 desktop cell. The rule lives in `scripts/lib/optical-size.mjs`; re-run `node scripts/size-client-logos.mjs` after swapping a logo. Never hand-tune a height to make one brand bigger.

### Counters (`data-countup`)
- Any number wrapped in `data-countup` (stat row, Credits count, Where-we-work country count) counts up digit-by-digit as it scrolls into view, keeping its prefix/suffix and grouping. Years tick only their last stretch rather than starting from zero. The final width is held so the row never reflows, and the counter is skipped entirely under `prefers-reduced-motion` or without IntersectionObserver — the plain figure is always in the markup.

### Where we work (`.whereBand`)
- A cropped world map with `--accent` pins (dot + soft halo) for every country worked in, a full country list beside it, and a counter. Pins arrive one by one when the section scrolls into view; hovering or focusing a country highlights its pin and updates an `aria-live` readout. Reduced motion shows every pin at once.

### Reviews band (`.reviews`)
- Always-dark `#1a1a1c` band. Cards slide in a track (`.revTrack`, gap `--revGap`, three across), with Anton names, the quote, role, then a `.revCredits` row of production logos that fade in with the card. Arrows and dots are the thin circular controls; focus rings are pinned to `#f4f2ee`.
- Production logos beside a quote are sized by the same optical rule as the client wall: measured sizes live in `src/data/production-logo-sizes.json` (18–48px tall, at most 215px wide) and are read by `src/lib/productionLogos.ts`; re-run `node scripts/measure-production-logos.mjs` after adding a logo. An unmeasured logo falls back to a footprint match from its file until then.
- One card at a time on a phone, which makes the dots a long ragged double row of tiny targets: below 640px they are dropped and the `n / total` count and arrows carry the position. A horizontal drag pages the cards there; anything closer to vertical is left to scroll the page. The card is set a size down on a phone (name `clamp(24px, 7vw, 30px)`, role 12px, quote 15px/1.7, tighter margins), At every width the cards are top-aligned rather than stretched and the viewport's height follows the tallest card on show (`fit()` in the homepage script, eased over 0.45s), so a page of short reviews never sits over a gap left by the longest of the fifteen.

### Role frame (`.roleFrame`, `/spacts`)
- An always-dark band: three role cards (supporting artist, SPACT, stunt performer) over an annotated still whose performers are outlined by role, with a key and a "Next scene" button beneath. Scenes, callouts and the key's words live in `distinctions` in `spacts.json`.
- Every piece of type is at least 11px: prompt, role flag, scene title, key and the callouts in the picture. Padding follows the ladder (40 / 32 / 20).
- Callouts are centred on their performer, then nudged back inside the frame if they cross an edge, or hung below the performer if there is no room above (`fitLabels()`), re-fitted only when the window's width changes.
- On a phone (≤640) a callout names the role alone, in the key's own word (`SPACT`, `STUNT`, `SA`), because up to seven full callouts at a readable size would overlap in a 350px frame. Tablet and desktop show the full callout.

### Before/after comparison (`.stuCompare`)
- Two frames of the same shot, one clipped back to a `--split` custom property so the other shows through on the left of the handle. Used on `/stunt-performers` for the on-set plate against the finished frame.
- A native `<input type="range">` fills the frame and is the real control, so the slider is keyboard-operable and announced correctly; it carries `pointer-events:none` and the drag is handled on the stage, which sets `touch-action:pan-y` so a vertical swipe still scrolls the page.
- The divider is a 1px `#f4f2ee` hairline with a 44px circular grip (over the 24x24 minimum). Side labels use the 11px/3px uppercase caption voice on a `rgba(16,16,18,0.55)` plate.
- The clipped photo is `alt=""` (it is the same shot); its description is given to screen readers in a visually hidden paragraph. With no JavaScript the handle rests at 50% and both photos remain visible.

### Slate of briefs (`.briefCard`)
- The Artists page's "full range" block: copy and a solid "Send us your brief" button on the left; on the right a hairline card, `--bg` on `--hair`, that fills itself in with one real brief after another (`range.briefs` in `artists.json`: production, the brief, and two more rows whose labels are set per brief, e.g. Duration, Location, Style, Discipline; a detail with an `href` (the discipline) is the only link on the card, turning accent with a small arrow on hover; then a short `note` on what was done and how). The rows are set as a call sheet: the label in the 11px/3px `--muted` caption voice (Jost), the answer typed beside it in Courier Prime 13px/2px, uppercase, 700 `--accent` (a linked answer turns `--ink` with a small arrow on hover), in a 132px / 1fr grid with a dashed `--hair` rule between rows (12px on phone); the note beneath in Courier 14px/1.75 `--sub` with room held for three lines, prefixed by a NOTES label in the same caption voice drawn from `data-label` (`range.briefs.notesLabel`). The left column — every label, NOTES included — is printed on the sheet from the start and never blanks, types or fades; only the answers and the note arrive; a big Anton count (`01 / 04`) top-left, the production's logo top-right (`.briefLogo`, from the shared library at its measured size × 0.9, the dark-ink or light-ink file per theme, the title in 13px tracked `--muted` type when no artwork exists), a hint and accent dots in the foot.
- Each value types in with a blinking accent caret (roughly 55–65ms a character; the note beneath is not typed but fades up over 0.7s once the rows are in; the count and the logo arrive together at the start, before the rows type), then a 2px accent line (`.briefTimer`) creeps along the top edge for the 4.5s the brief holds before the next. "Click for the next →" in the foot is the one control and skips ahead; hovering the card holds it. Blank rows keep a non-breaking space and the caret sits outside the flow, so no row changes height as its words arrive. Only runs while in view. Under reduced motion or with no JavaScript the first brief is simply on the card; with reduced motion the briefs still swap, without typing or timer. The full set is in a visually hidden list for screen readers.
- Rows stack label-over-value on phone, where the whole slate is set a size down: `22px 18px 18px` padding, count 34px, values 18px, rows `10px 0`, note 14px holding four lines. On desktop the slate is held to the blank sheet's height so nothing below moves when one replaces the other; on a phone it is not (the sheet's stacked rows run far taller), so the slate is simply as tall as its brief.

### How we work (`.howBand` / `.pillars`)
- The foot of the Artists page: one always-dark band under a ruled "How we work" head, with three numbered columns, Our artists / Our team / Our clients (`howWeWork.items` in `artists.json`). Each column: Anton accent numeral `clamp(48px, 5vw, 72px)`, an 11px/3px `--muted` label, an Anton heading `clamp(24px, 2.3vw, 34px)`, then 16px/1.7 body copy. Columns are separated by `--hair` rules; on tablet and phone they stack with a rule between.
- Columns rise in 140ms apart (the reveal group) and a 1px accent rule draws along the top of each (`.is-ruled`, 0.8s) as they arrive; still under reduced motion or with no script. With a pointer, hovering a column lifts its copy (`.pillInner`) 8px while the rule along the top stays put and its copy brightens to `#f4f2ee` and the other two settle to 55% opacity; everything returns on leave, all on the house ease. Nothing happens on touch.

### Specialists statement (`.specialistsBand`)
- The Specialists page's opening block. There is no photo cover: the page opens straight on this statement (`.specOpener`, cover top padding 170 → 150 → 130, `navOverDark={false}` since it follows the theme), whose lines rise on load as `data-hero-line`. Type only, no pictures, so it does not read as another category grid. It is a normal `.band`, so it follows the theme. One Anton statement at `clamp(40px, 7.4vw, 112px)` (`clamp(30px, 8.6vw, 64px)` on phone, where the changing line may also wrap so the longest discipline never runs off the screen) in three lines: lead, a changing middle line (`.stmtSlot`, accent), tail. The middle line takes every discipline in `specialists.json` (`statement.words`) in turn: each word rolls up into place (0.55s, blurred edges) while the last rolls out, and holds for 1.9s. No rule under it. The first word is in the markup, so it reads with no JavaScript; under reduced motion the words still change but simply swap. The whole list is given as the heading's `aria-label`.
- Beneath: the body and a solid "Send us your brief" CTA left; the divisions right as a ruled `.divList` of names only (17px/3px uppercase `--ink` links, right-aligned to the column edge, accent on hover; left-aligned once they stack under the copy at ≤1024, and 15px on phone; the row's padding sits on the link so the whole ruled row is the tap target), stacking on tablet.
- Along the foot, `.tape`: an accent "Also on the roster" label over an endless line of the wider roster in Anton `clamp(28px, 3.6vw, 52px)`, every third name in `--muted`, accent dots between, ruled above and below. It drifts left at 0.6px a frame, nudged faster by scrolling, only while on screen and the tab is visible; still under reduced motion. The moving copies are `aria-hidden`; a visually hidden list carries the names once.
- Divisions come from `divisions.items` (only those with a page built) and the roster from `examples.items`, both in `specialists.json`. The Artists page no longer carries a specialists block: it runs full range → where to start → how we work (artists, team, clients).

### Image slots (`.slot`)
- Where artwork isn't in place yet, render a deliberate empty plate: `--tileBg` background with a small uppercase `--muted` label. Not a broken image, an intentional placeholder.

### Cards / tiles
- Reviews carousel (`.revCard`), supply tiles (`.supplyTile`), poster grid — all lean on the same hairline + whitespace language.
- Dots and arrow buttons are circular (`border-radius:50%`), thin border, no fill.

### Insights cards (`.insightGrid` / `.insightCard`)
- The listing at `/insights` and the "more insights" row at the foot of an article share one card: hairline top border, 3:2 image (or a `.slot` plate), accent topic label, 22px title, excerpt, then a `--muted` meta line. Grid is 3 → 2 → 1 columns.
- On a phone an article still waiting for its picture shows no plate (`.insightCardSlot`, and the featured article's `.insightFeatureSlot`, are hidden ≤640px): a screen-wide grey box per card only pushed the words apart. An article page's sidebar "related" links are also hidden there, since the "more insights" cards follow straight after with the same articles.
- Topic filters (`.insightChip`) are pill buttons carrying `aria-pressed`; they are progressive enhancement, so every article stays visible without JavaScript.
- Article prose (`.insightProse`, shared in `global.css` and used by both insight articles and event descriptions) is capped at `68ch`, 18px/1.8 in `--sub`; `h2` is uppercase Jost at `clamp(22px,2.2vw,30px)`; list items take a 8x1px accent dash instead of a bullet; `strong` is Jost 500 in `--ink` for the one or two phrases a reader must not miss; a `blockquote` becomes the hairline-ruled pull quote.
- Reading time is counted from the body in `src/lib/insights.ts`, never authored.

### Event cards and the booking panel (`.eventGrid` / `.eventCard` / `.eventBook`)
- `/events` lists upcoming sessions on the insight card's cousin, framed in a full `--hair` box (`--ctrlBorder` on hover, matching the booking panel) with the photo flush to the top edge and 26px padding inside (18px on phone): a 3:2 photo or a `.slot` plate carrying the date, an accent pill badge (`.eventTag`: the `.insightChip` recipe with a `--accent` border and text, 11px/2.5px tracking, `8px 14px`; on the cover 12px and `10px 18px` — always smaller than the title beside it) reading members' workshop / open to all / by application, Anton title at `clamp(24px, 2.2vw, 32px)` (uppercase, `letter-spacing:0`), summary, then a small ruled facts table (`.eventFactsRow`): 11px tracked `--muted` label in a 72px column, 15px `--ink` value beside it, one hairline between rows, with the time or a "closed" note as a 13px `--muted` line under its value. Grid is 3 → 2 → 1 columns. With exactly one session the grid takes `.eventGridSingle` and the card is featured: the link becomes a two-column grid (photo `1.1fr` left, `.eventCardBody` right, `44px 48px` padding, title `clamp(30px, 3.4vw, 48px)`, excerpt 17px/48ch), keeping the photo beside the details on a tablet (full width, photo at least 360px tall, `28px 32px 32px` body padding) and stacking back to photo-over-text on a phone (≤640). Card body padding is `24px 26px 26px` (`20px 18px` on phone). Past events leave the listing at the next build; drafts never appear.
- An event page opens on the standard cover — or, when the event carries `cover` stills, on the photo-hero recipe (`.eventCover`: `--coverPhotoH`, stills cross-fading every 5s under `--heroScrim` plus a left-hand shade (`rgba(20,20,22,.78)` → `.45` at 35% → transparent at 70%) and a soft text-shadow on the crumb and kicker so they read over a bright frame, a tracked credit under the lede ("Action Designer on Havoc", or "Seen on …" without a role) that follows the current still; only the first still loads with the page) — then a four-up facts row (When / Where / Price / Places, 11px tracked labels over `clamp(19px,1.9vw,26px)` values, 4 → 2 → 1 columns); the Where value is an underlined `--ink` link to a Google Maps search for the venue as written (`mapUrl()` in `src/lib/events.ts`), opening in a new tab with an "Open in Maps →" note beneath, then the description in `.insightProse` beside a hairline-bordered booking panel that sticks at `top:120px` on desktop and stacks beneath on tablet and phone.
- The booking form reuses the contact form's control voice (`--tileBg` field, `--ctrlBorder` outline, 16px Jost, square corners) and the solid CTA at full width. The total is a `.statNum`-style Jost 300 accent figure. Payment itself happens on Stripe's hosted page, never on the site.
- One sentence per state (sold out, closed, past, payment not set up) is in the markup and the script shows the one that applies; a bounced booking's reason arrives as `?error=` and is shown in an accent-ruled `.eventError` line. Without JavaScript the form still posts and the server still enforces every rule.
- A workshop awarded by application (`applyUrl` set) leads its panel with the application paragraph, an "Apply by" date row and a solid "Apply now" button; the code-and-pay form follows under a tracked accent sub-heading for those offered a place. After the deadline the apply block gives way to one closing sentence. Cards and cover carry a "By application" label instead of members/open.
- Content lives in `src/content/events/*.md`; wording in `src/content/pages/events.json`. The members' access code is a host setting (`EVENTS_MEMBER_CODE`), never a content field, because the repository is public.

### Genre index (Dancers, `.genre`)
- The "What we supply" list on /dancers is a run of ruled rows, each a button that opens its blurb. Hover and focus borrow the overlay menu's recipe at list size: a 14px accent dash draws in ahead of the word (0.42s), the letters (`.genreCh`, one box each, the button carrying the readable name) lift 4px one after another 26ms apart into the accent and settle back in the same order on leave (motion, 0.34s on the house ease), and the plus turns a quarter with them; the open row holds the accent and shows its minus straight. Under reduced motion only the colours change.

### Footer (`.footer`)
- Big uppercase title, contact line, ghost + solid button pair, then a thin divider and fine print row with the logo.

---

## 6. Motion

- **Easing:** `cubic-bezier(0.3, 0, 0.2, 1)` for carousels; `ease` for fades.
- **Durations:** theme/page transitions `0.5s`; hero layer cross-fade `1.8s`; logo cross-fade `3s`; carousel slide `0.65s`; menu items stagger in over `0.5s` (aside delayed `340ms`); poster hover `scale(1.04)`.
- **Scroll-triggered reveals** (counters, map pins) are armed with IntersectionObserver and run once.
- **Page reveals with motion** (`src/lib/reveal.ts`, used by /events, each event page, /specialists, /unique-talent, /join and the What we supply list on /dancers; About carries the same recipe): cover lines tagged `data-hero-line` rise in on load (0.9s, 140ms apart); `data-reveal` rises when 40% in view; a `.sectionHead` tagged `data-reveal-head` rises its title, then draws its rule across (1s); a `data-reveal-group` brings its `data-reveal-item` and `data-reveal-figure` descendants in, in DOM order, 90ms apart (or the gap given as its value, e.g. `data-reveal-group="0.06"`). Everything moves 16px up on the `cubic-bezier(0.3, 0, 0.2, 1)` ease. The hiding styles sit under `.is-armed` in `global.css`, so nothing is hidden until the script has confirmed it can bring it back. If the observer or `customElements` is unavailable, the final state is simply shown.
- **Photographs are unveiled, not faded.** A picture (or the frame holding it) tagged `data-hero-figure` (on load, 1.5s, 250ms after the first cover line) or `data-reveal-figure` (25% in view, 1.3s) has its plate wiped open from the top edge (`clip-path` from `inset(0 0 100% 0)`) while the image inside settles from `scale(1.06)` on the `[0.2, 0, 0.1, 1]` settle curve. Tag the element whose box should be wiped — a frame with `overflow:hidden`, or the `img` itself — never a figure that also holds a caption. A cross-fading photo cover instead settles its first still from `scale(1.06)` over 2.4s and drifts every still 100px as it scrolls out.
- **Turning grids.** A grid that has more productions than plates (the Dancers credits: eight stills, four plates) turns exactly like the logo wall: each set holds 6.2s, then the cards lift away upward, blurring as they fade (0.5s, `.is-turning`), one after another down the diagonal (480ms end to end, `--d` per card); the artwork changes over while nothing is on show; the cards settle back in on the same diagonal. It runs only while the grid is in view (`inView`) and the tab is visible; under reduced motion the first set simply stays. On a phone the grid is two smaller plates side by side (`repeat(2, minmax(0, 1fr))`, `20px 14px` gap, 11px labels): the third and fourth plates are hidden and only the two on show take part in the turn, so every set fits on one screen.
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
- **On touch screens (`(hover: none)`) small links carry a 44px-ish tap area** without changing the layout: either `display:inline-block; padding:8–12px 0; margin:-8–12px 0`, or, where an underline or border sits under the words, an invisible `::after` box `12px` above and below the link. Used on footer contact links, tracked-uppercase "view"/"see all" links, cross-link lists, crumbs and the clock.
- **Nothing is set under 11px** on any screen, labels inside pictures included. The one exception is the header's Get in touch label on the narrowest phones (≤360px), where it drops to 10px so the header row still fits.
- **Form fields are at least 16px** on a phone, so an iPhone does not zoom in when one is tapped.
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

_Last updated 2026-09-29. Update this file whenever a token, type choice, or core pattern changes._


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
