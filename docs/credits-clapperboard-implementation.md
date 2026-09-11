# Credits slate — implementation record

## What was read before building

- Published mockup `057bf4c7-ee7c-4052-831c-136025b050df`, version 6, plus its
  unbundled source in `_design/credits-page/`.
- The reference images for the open and closed board, and the five failure states.
- Project rules and tokens: `DESIGN.md`, `src/styles/global.css`.
- Shared UI and page: `src/layouts/Base.astro`, `src/components/Header.astro`,
  `src/components/Timecode.astro`, `src/scripts/site.js`, `src/pages/credits.astro`.
- Data and artwork: `src/content/pages/credits.json`, `src/lib/posters.ts`,
  `src/lib/productionLogos.ts`, `public/assets/production-logos`, `public/assets/logos`.

## The six faults in the mockup, and what was done about each

| # | Fault in the mockup | Fix in the site build |
|---|---|---|
| 1 | The striped rail was paint inside the board's front face, so it had no rear or edges and its joint slid about on the turn. | The rail is its own slab (`rail-front` / `rail-back` plus four edges), stacked on top of the board body. |
| 2 | The stick pivoted at the board body's top edge while the rail occupied space inside that body — geometry and picture disagreed. | One `seamY` value derives from the measured body height plus the rail height. The pivot, both hinge leaves and the pin are all placed from it. |
| 3 | Scroll progress calculated the hinge angle and forced the stick shut, overwriting click state. | Scroll writes only `slate.rotation.y / position.z / rotation.x`. The hinge angle comes solely from `clapperMotion`. |
| 4 | Clicking ran a fixed timed sequence and could not reverse. | Clicking toggles a target angle. `stepClapperMotion` damps towards it, so a second click reverses from wherever the stick is. |
| 5 | Duplicate rear-face IDs and dead bracket markup, so which rear rendered depended on DOM order. | One rear face, addressed by `data-clap`. The bracket markup is gone. |
| 6 | Hinge leaves were flat faces with hand-picked offsets, so the hardware detached at oblique angles. | Leaves and pin are two-sided groups whose offsets come from the slab depths and their own measured heights. |

## Coverage

| Item in the mockup | Where it lives now | State |
|---|---|---|
| Board front — marked-up card, all sixteen cells | `ClapperBoard.astro`, `[data-clap="body-front"]` | built |
| Seven-segment readout, live at 24fps | `clapperBoard.js`, `paintClock` | built |
| Readout holds the clap frame, jumps to live time on reopen | `clapperMotion.js` clock helpers | built, unit-tested |
| Striped rail (fixed lower half) | own slab, `[data-clap="rail-*"]` | built |
| Stick (upper half) on the hinge | own slab on `armPivot` | built |
| Hinge — fixed leaf, moving leaf, pin, screws | `[data-clap="leaf-*" / "pin-*"]` | built |
| Stripes aligned tooth-for-tooth when shut | shared `.clapTeeth` geometry on both halves | built |
| Click to clap, reversible mid-travel | `toggle` → `toggleClapperMotion` | built, unit-tested |
| Production swaps at the moment of impact | `frame()` impact branch | built |
| Scroll turns the assembly through half a rotation | `clapperScrollPose` | built, unit-tested |
| Board's back carries the agency record | `[data-clap="body-back"]` | built |
| Record rolls up once the back faces us | `statsRoll` transform | built |
| Poster wall follows the hero | the page's existing wall | reused unchanged |
| Header stays visible and theme-aware | the site's own `Header` / `navScroll` | reused unchanged |
| Board thickness visible on the turn | six panels per slab, back-face culling | built |
| Keyboard route to the clap | `.clapTrigger` button | built |
| Readable without the scene | `.clapRecordAlt` plus `is-static` / `noscript` | built |

## Departures from the mockup, and why

- **Fonts and colour** come from the site's own faces and tokens rather than the
  mockup's embedded data-URI copies. The board's own inks (`#f2f1ee` card,
  `#121214` stripes, `#ff3d14` readout) are the physical object's colours, not
  brand tokens, so they stay literal.
- **Artwork** is resolved from `public/assets` through `src/lib/slateDeck.ts`. A
  mark that has not been uploaded reads as its own name in type, the same rule
  the client logo wall follows — never a 404.
- **The headline figures band was removed from the page.** It printed the same
  three figures the slate's back now reveals, one screen apart. The figures are
  still in the document as type.
- **Camera detail is placeholder** and labelled as such in `src/data/slate-deck.json`.

## Second pass — the faults found on review

| Reported | Cause | Fix |
|---|---|---|
| Scroll did nothing. | `html, body { overflow-x: hidden }` in `global.css` turns the body into a scroll container, which silently breaks `position: sticky`. The slate's pinned stage was the only sticky element on the site, so nothing else had ever caught it. | `overflow-x: clip`, with the `hidden` declaration left before it as a fallback. Same clipping, no scroll container. |
| Marker text rendered as a serif italic. | Caveat was never in the site's font link — only Jost and Anton — so every marked value fell back to the default cursive, which is Times italic on most machines. | Caveat 600/700 added to the Google Fonts request in `Base.astro`. |
| Studio logo invisible. | Both marks were taking the light-ink cut (`-c`). That is right for the production title in the black band, wrong for the studio, which is printed in a cell on the white card. | `slateDeck.ts` resolves the studio to the dark-ink cut. |
| Board placed oddly. | Placement used a hand-picked screen fraction and a scale that could exceed the frame. | The board is now centred in the space the copy column actually leaves, measured each resize and clamped, and sized as a share of the visible plane rather than of the raw pixel width. |
| Clap stayed shut. | The click was a toggle. | One click is one clap: shut, hold `CLAPPER_HOLD` (0.9s), lift. Clapping again while the sticks are down lifts them straight away, so it stays reversible. |
| Board looked fake. | Flat lighting, fixed gradients, no contact, dead-square to the lens. | The scene now publishes its own attitude each frame (`--clapHinge`, `--clapSheen`, `--clapFace`) so the specular band is swept by the board's real rotation and the stick's cast shadow tightens into a hard line as the sticks meet. Plus a painted-stick bevel on both striped halves, chamfered acrylic edges, cross-head screws, a tapered strap on the stick, and a small constant cant and yaw at rest. |

## The scroll, as four beats

Set out in one place, in `clapperMotion.js`:

| Beat | Where | What happens |
|---|---|---|
| Settle | 0 → 0.10 | Board held open, facing us. Copy and cue read. |
| Turn | 0.10 → 0.48 | Half a rotation onto its back, pushing away through the middle so no corner sweeps the frame. Hero copy steps aside, the record's caption arrives. |
| Read | 0.52 → 0.86 | The record rolls up behind the board's own window. |
| Hand over | 0.88 → 1 | The board recedes and lifts; the poster wall takes the page. |

A hairline at the foot of the stage shows how far through the hero you are.

## Third pass — verified in a browser, and the faults it found

| Reported / found | Cause | Fix |
|---|---|---|
| Scroll still did nothing, and both faces were drawn at once. | `CSS3DRenderer` rewrites `element.style.display` from `object.visible` on every render (CSS3DRenderer.js:377). The back-face cull wrote the style directly, so the renderer undid it one line later — every panel stayed visible and the front face painted over the back. | Culling is written to `object.visible`. Noted in the comment so it is not "simplified" back. |
| The rail had lost its stripes. | The stick's cast shadow was up to 32px tall over a 33px rail, blacking out the teeth. | The cast is a contact line: 3px when shut, 10px when open, and it fades as the sticks part. |
| A grey diagonal wash over the card and readout. | The specular band was broad and `mix-blend-mode: screen`, which lifts pure black to grey. | A narrow streak at low alpha, normal blend, with the logo band sitting above it. |
| `FPS` / `STOP` labels clipped. | The rail projects a few pixels over the card's top edge under the resting tilt, and Caveat's ascenders need more than `line-height: 1`. | More head-row clearance, `line-height: 1.24`. |
| The teeth met with a jog when shut. | Each half skewed about its own centre, so the two rows were offset by `tan(19°) × 33px ≈ 11px` at the seam. | The stick skews about its bottom and the rail about its top, so both are unshifted at the seam and the diagonals run straight through it. |
| The board was sliced off by the frame at hand-over. | It receded but was still on screen when the stage un-pinned. | It lifts as well as recedes, and the scene dissolves over the last of the hand-over. The progress hairline fades with it, rather than reading as a stray rule above the poster wall. |
| A dead 170px gap on mobile. | The board was lifted too far up the frame. | The board fills the upper half and the copy sits directly under it; the lede is shown at this width too. |
| Low-contrast kicker in the light theme. | `var(--accent)` resolves to the light theme's oxblood, which fails on the dark stage. | The kicker keeps the dark-theme accent, the same rule `.pageHero .kicker` already used. |

`overflow-x: clip` was re-checked on the homepage: no horizontal overflow, layout unchanged.

## Verified

- Scroll turns the board, rolls the record, and hands over to the poster wall.
- Front and back are never drawn together; the thickness reads on the turn.
- One click shuts the sticks, holds them, and lifts them; the production and the
  frame rate change on impact and the readout holds the clapped frame.
- The teeth run straight through the seam when shut.
- 1440x900 and 430x880.
- Light and dark theme.


## Fourth pass — front spacing, rear fit, composition and finish

### The two root causes behind the rear clipping

1. **The card was measured with `getBoundingClientRect()`.** That element carries
   a 3D matrix from the renderer, so the call returns the *perspective-projected*
   on-screen box, not the laid-out height. The front's real height was 415px; the
   projected reading was 374px, and the value the back face was actually built
   from was 337px. The back has been ~80px shorter than the front the whole time,
   which is why the last figures fell off it. Now `offsetHeight`, which transforms
   cannot affect.
2. **The card's height was not knowable at mount.** It depends on the web font and
   on the production logo, both of which arrive later — and the logo changes on
   every clap, each one a different aspect ratio. So the card silently resized
   under a one-shot measurement. Fixed two ways: the band's mark now sits in a
   fixed-height box it scales inside (so the card is the same size whichever
   production is on it, and the board no longer resizes when clapped), and a
   `ResizeObserver` on the card re-measures if anything else moves it.

A third contributor: the record's window had a pixel height set on a flex child,
which the flex container then clamped, and two fade gradients that existed to mask
a scrolling list. Both were dimming and cropping the very rows that were hardest
to read. The window is now `flex: 1`, the list does not scroll, and all six
figures sit on the card with a 14px margin below the foot rule.

### The rest

| Asked | Done |
|---|---|
| Front spacing | The head row's top padding is now real clearance for the rail, which projects a few pixels over the card's top edge under the resting tilt. `Fps` and `Stop` sit clear of the stripes at all angles. |
| Rear readability | Labels 10.5px → 12px at 0.8 opacity (was 0.6); figures 21px → 24px on a brighter ink; leader dots and the standing line lifted to match. |
| Scale through the turn | The mid-turn push away from camera was −300 units, which shrank the board ~17% half way over and read as a scale change. Now −70 (~5%). Projected height holds within a few per cent across the whole turn; the width narrows, which is just foreshortening. |
| Empty left column | The two captions now share one ramp, so their opacities always sum to exactly 1 — measured at 1.00 at every point through the turn. They cross at the moment the board is edge-on and pass each other vertically, so they never sit on the same line at half strength. |
| Empty rear card | The row reveal was keyed to a beat *after* the turn, so the board landed flat-on and blank, then filled. It is now keyed to the turn itself and completes just before the board comes to rest. |
| Reading distance | With the reveal folded into the turn, the hold is a single beat from 0.38 to 0.90 of the hero's travel — over half of it, with the record stationary and complete. |
| Stick substance | 33px → 40px, depth 22 → 28, chunkier hinge and pin. The stylesheet and the geometry constants had drifted apart (33 vs 34); they are now the same number with a comment saying they must stay that way. Bevel reduced to one bright arris at the top and one shaded at the foot — a painted batten, not a chrome tube. |
| Navigation clearance | Was −24px: the raised tip went behind the header. The board's vertical band is now derived from the header's measured height rather than a fixed offset, so it holds at any window size. Clearance +40px at 1440×900, +48px at 430×880. |

### Verified in the browser

- 1440×900 and 430×880, fully open and fully closed.
- Half way through the rotation, and fully reversed with all six figures on the card.
- Clapped while partially rotated: hinge went 1 → 0 → 1 with `--clapTurn` unchanged at 0.299.
- Three consecutive claps: production, frame rate and held timecode changed each time.
- A second click while the sticks were down lifted them immediately.
- Scrolled to the end and back: every driven value returned to its start state.
- Keyboard: the trigger takes focus and fires on both Enter and Space.
- `prefers-reduced-motion`: all six rows present immediately, no stagger, no float; the clap still shuts, holds and lifts.
- `npm run build` clean, `npm run test:clapper` 9/9.


## Fifth pass — the rear's row spacing

The rows were 44px tall around 24px figures, which put more air between each
statistic than around the block as a whole; it read as a widely-spaced list
rather than a record. Two changes, no scrolling in either:

- Rows tightened from 44px to 42px of which only 10px is padding, and the list
  now takes the space the head and the standing line leave and **centres** its
  rows in it, rather than spreading them to fill. The air ends up around the
  block (23px above and below) instead of between the figures.
- The space that freed went into the figures: 24px to 28px, labels 12px to
  12.5px at slightly higher contrast.

Verified with no overflow and all six rows present at 430x880, 1280x720,
1440x900 and 1900x1100. Nav clearance holds at 19px on a 720-tall laptop.


## Sixth pass — resize

The reported break (rail lying across the readout, hinge halfway down the card)
was the projected-height bug from the fourth pass, seen from a session loaded
before that fix: on resize the card was re-measured with
`getBoundingClientRect()`, which returns the perspective-projected box, so the
geometry got a number far smaller than the card's real height and placed the
rail *inside* it. Already fixed. But probing for it turned up three genuine
faults of the same family:

1. **The hinge leaves were re-measured on every resize.** A resize taken while
   the rear was facing us read 0 for them — the front leaves are culled in that
   state — and silently fell back to hard-coded numbers that no longer matched
   the stylesheet (30/26 against an actual 35/35). They are now measured once at
   mount, while nothing is culled.
2. **`remeasure()` would half-apply itself on an unmeasurable card.** It now
   returns early: the geometry it already holds is correct, and the card is
   picked up again when it comes back round.
3. **Three different approximations of the assembly's extent.** The resting
   offset, the height used for the fit, and the idle float each had their own
   arithmetic, and none of them accounted for the raised stick pivoting about a
   pin rather than rising vertically. That is why the tip kept creeping under the
   header on short windows even though the fit said it fitted. There is now one
   `extent()` — bottom of the card to the tip of the raised stick, counted with
   the actual pivot — and everything reads from it.

Also added: the board's vertical band now carries a small allowance for the fact
that a tilted slab projects taller than its flat height, and the frame loop
re-checks the card against the number the geometry is using twice a second, so
any future divergence corrects itself rather than showing as a broken board.

### Measured after the fix

| Window | Nav clearance | Bottom gap | Seam |
|---|---|---|---|
| 1280x720 | 43px | 42px | 5px |
| 1366x768 | 41px | 47px | 6px |
| 1440x900 | 62px | 56px | 7px |
| 1920x1080 | 51px | 64px | 8px |
| 2560x1440 | 63px | 97px | 10px |
| 1010x908 | 161px | 163px | 5px |
| 430x880 | 76px | — (copy below) | 1px |

Nav clearance and bottom gap now match each other at almost every size, which is
what proves the assembly is genuinely centred in its band rather than
approximately so. Seam offset is the rail's lower edge against the card's top
edge: a few pixels of projected overlap is correct contact; the failure mode
being guarded against was tens of pixels.

Resize was also exercised while the rear was facing us, across the mobile
breakpoint in both directions, and as a rapid burst of consecutive changes. The
clap, the turn and the rear's six figures were re-checked afterwards each time.


## Seventh pass — the hero was too long

Measured: between the record becoming fully readable and the board starting to
hand over there were **1,763px of scrolling in which nothing changed at all** —
1.96 screens. That is what read as the page refusing to move on. The hold had
been made deliberately generous in the fourth pass and had gone much too far.

Rebudgeted against a 320vh hero (was 460vh), so ~220vh of travel:

| Beat | Share | At 900px tall |
|---|---|---|
| Settle — board open, copy read | 0 → 0.11 | ~220px |
| Turn — rotation, figures settling in as it lands | 0.11 → 0.48 | ~730px |
| Hold — record stationary and complete | 0.48 → 0.75 | ~535px |
| Hand over — board recedes, lifts and dissolves | 0.75 → 1 | ~495px |

| | Before | After |
|---|---|---|
| Hero travel | 3.60 screens | 2.20 screens |
| Dead stretch with nothing changing | 1.96 screens | 0.66 screens |
| Record legible for | — | 0.82 screens |

The record stays readable from the end of the turn until well into the
hand-over, so there is still close to a screen's worth of reading — it simply
is not two screens of nothing. Mobile came down from 380vh to 300vh (2.0 screens
of travel, 0.60 of hold).

Also: the rear caption now fades with the scene it belongs to, instead of
hanging on at full strength over an empty frame while the poster wall arrives.

Re-verified after the change: nav clearance 25px, seam 6px, all six figures on
the card at 1440x900 and 430x880, clap shuts and lifts, tests 9/9, build clean.


## Eighth pass — pacing, content integrity and browsing

### Content (the important one)

`src/data/posters.json` carries four fields per entry: `title`, `season`,
`slug`, `src`. Every other thing the cards were showing — discipline, format,
studio — came from `src/lib/creditMeta.ts`, which hashed the title slug and
indexed into fixed lists. It was invented, and it was on the public page.

Deleted `creditMeta.ts`. `src/lib/creditWall.ts` replaces it and exposes only
what is supplied, with a comment saying what may not be derived and why.
Consequences, all deliberate:

- **Cards carry a poster, a title and the series number where one is recorded.**
  Nothing else. No studio, no format, no discipline.
- **The discipline filters are gone.** There is no verified assignment to filter
  on, so a filter could only produce a confident-looking wrong answer.
- **The rear record is four rows, not six.** "Television series 68" and "Feature
  films 237" were computed from whether a `season` number happened to be
  present. 237 titles were being reported as feature films purely because no
  season number had been entered. Removed. The remaining four are the three
  figures the agency states in `credits.json` plus a literal count of the wall.
- **No "Latest" ordering.** No entry carries a date, and array position is not
  recency. Featured (the existing curated order) and A–Z only.
- **The visible `TODO:` notes are gone from the page** and recorded in
  `docs/credits-content-gaps.md`. `clients.body` was an unwritten paragraph, so
  it is omitted rather than printed as a note to the reader; the testimonials
  empty state is now written for a visitor rather than for a developer.

### Browsing

Search (title, folded so "deadpool" finds "Deadpool & Wolverine"), an Order
select, 30 shown at a time with Load more, and an accurate count that follows
the active search. All 305 cards are in the document, so search reaches titles
that have not been shown yet and the wall still reads with no script running.
Ordering is applied with the CSS `order` property rather than by moving nodes,
so switching order never rebuilds the grid or re-requests a poster. Changing
search or order restarts the batch; Load more adds below, so nothing above moves
and focus stays on the button.

### Pacing

| | Before this pass | After |
|---|---|---|
| Hero travel | 2.20 screens | 2.00 screens |
| Hold with nothing changing | 0.66 screens | 0.46 screens |
| Slate bottom clearance | 56px | 112px |
| Nav clearance | 44px | 42px |

Plus a "Browse productions" link in the opening that jumps straight to the wall,
landing clear of the fixed header via `scroll-margin-top` on the section.

### Accessibility

- `input`/`select`/`textarea` were missing from the site's `:focus-visible` rule
  in `global.css`, so a keyboard user tabbing into any form field on any page
  got no visible ring. Added. The search field's ring is drawn on the field
  wrapper, because the input's own outline is suppressed.
- Reduced motion gets a genuine alternative rather than the same sequence with
  the easing removed: `is-calm` un-pins the hero, shows the board facing us at
  an ordinary block height, and renders the record as type below it. The clap
  still works.
- Two `display: flex` elements were being toggled with `hidden`, which a
  non-`none` display overrides — the clear button and the Load more row were
  visible when they should not have been. Fixed with explicit `[hidden]` rules.

### Verified

1440x900, 1280x720 and 430x880; light and dark theme; open, closed, part-turned
and fully reversed; a clap taken at turn 0.378 left the turn untouched at 0.378
and lifted on its own; scrolled to the end and back with every driven value
returning to its start state; the Browse link landing with the heading clear of
the header; search finding a title at wall index 42 while only 30 were shown;
search and ordering together (30 of 88 matching "the", A–Z); the empty state and
its reset (which clears both search and order and returns focus to the field);
Load more by keyboard with focus retained; all four rear rows visible with no
overflow; no horizontal overflow at 430px. `npm run build` clean,
`npm run test:clapper` 9/9.

### Not verified

- No screen-reader pass (VoiceOver/NVDA) was run — only focus order, focus
  visibility and keyboard operation.
- No real-device testing; 430x880 is an emulated viewport.
- The 305 titles remain uncleared for publication (see the content gaps note).


## Ninth pass — the studio, and rest → lift → turn → hold

### The room (rebuilt in the tenth pass — see below)

One palette for the room, one for the object, both as custom properties on
`.clapStage` with a `[data-theme='light']` override. A theme change is therefore
nothing but a change of variables: no material is rebuilt, no texture is
regenerated and the canvas is never touched.

- **Charcoal**: `#121215` backdrop into a `#1b1b1f` floor, blended across a
  quarter of the frame so there is no horizon to see, with a broad soft key
  behind where the slate stands and light skimming the floor in front of it.
- **Silver**: `#d5d5d4` into `#c6c6c5`, soft white key. Charcoal interface ink
  (`#1a1a1c`) and a darker copper (`#8e3a24`) — the dark theme's `#d4704f` falls
  below 4.5:1 on a silver room.
- The slate follows: a lighter matte card (much less specular — `--slateSheen`
  drops from 0.11 to 0.04), silver edges, brushed-steel hinge and pin, and a
  light rear plate with dark figures. The stripes, the black readout with its
  red digits, and the black production panel are unchanged in both themes, as
  specified.
- The page also switches the header to its light treatment
  (`navOverDark={false}`), which was previously forcing a white logo over what
  is now a light room.

Grain is a separate `::after` at 3–4.5% rather than a `background-blend-mode`
layer — blending it flattened every gradient underneath it.

### The sequence

Four groups, one responsibility each, so no two things write the same transform:

| Group | Writes | Driven by |
|---|---|---|
| `rig` | placement and scale | resize only |
| `lift` | vertical position | scroll |
| `slate` | rotation | scroll |
| `armPivot` | the hinge | click |

The studio is painted behind all of it and never moves, which is what lets the
contact shadow stay on the floor while the object leaves it.

| Beat | Share of travel | What happens |
|---|---|---|
| Rest | 0 | Card's lower edge on the floor line, tight dark contact shadow. |
| Lift | 0 → 0.20 | Rises 12% of the card's height. No rotation yet. Shadow spreads, softens, pales. |
| Turn | 0.20 → 0.70 | Half a rotation, hovering, scale held. |
| Settle | 0.70 → 0.85 | The nod eases out; the record is square on. |
| Hold | 0.85 → 1 | Stationary, then the pin releases and it scrolls away. |

The floor line is `--clapFloor`, published from the geometry to CSS, so the
backdrop, the floor wash and the shadow all agree with where the object actually
is rather than approximating it. `groundY` is solved from the screen position of
that line — the card's lower edge lands on it, it is not nudged there.

The shadow is two layers: a tight core that fades out entirely as the board
leaves the floor, and a broad ambient pool that widens and pales. Both are CSS
gradients with a blur — no shadow map, so there is nothing per-frame for a phone
to render.

Because the pose is a pure function of scroll progress with no stored state,
scrolling back up runs the sequence in reverse for free.

### Tuning found by measurement

The nod through the turn was `0.055 rad`, which swung the lower corner 25px
below the floor line as the board passed edge-on — it read as dipping into the
floor. Reduced to `0.028` and the lift raised from 10% to 12%, which brings the
worst case to −7px at exactly the moment the board is a thin edge-on sliver.

### Verified

| | Result |
|---|---|
| Contact at rest | card bottom 784px against a 774px floor line — 10px of overlap, which reads as contact |
| Shadow stays on the floor | 774px at every point from rest to full turn |
| Air gap once lifted | 30–39px, except −7px at the edge-on instant |
| Clap mid-rotation | hinge 1 → 0 → 1 with turn/lift unchanged at 0.400/1.000 |
| Clap while grounded | works, lift stays 0 |
| Scroll to the end and back | returns to lift 0, turn 0, contact −10px |
| Theme switch mid-sequence | scroll 1152, turn 1.000, lift 1.000, hinge 1.000, production WW 61 — all preserved, no rebuild |
| Rear figures | 6/6, no overflow, both themes, desktop and mobile |
| Nav clearance | 62px desktop, 46px mobile |
| Browse productions | lands with the heading clear of the header |
| Reduced motion | hero un-pinned, board grounded and facing us, record as type, clap works |
| Keyboard | trigger and skip link both take focus with a 2px accent ring; Enter claps |
| Mobile | no horizontal overflow at 430px; the scroll cue is hidden there, where it collided with the Browse link |

### Not verified

- **No video recording**: `ffmpeg` is not installed in this environment, so
  `agent-browser record` cannot write a clip. The sequence is documented as
  stills and as measured numbers instead.
- No screen-reader pass; keyboard and focus only.
- 430x880 is an emulated viewport, not a real device.
- The theme toggle runs through `document.startViewTransition`, so the switch
  cross-fades the whole page as it does everywhere else on the site. The canvas
  is not rebuilt, but the cross-fade is a full-page snapshot; it looked clean at
  every point tested.


## Tenth pass — matching the reference photographs

The first attempt at the studio was one stacked gradient doing everything, and
it did not read as a room. The references are two things: a lit cyclorama, and a
floor made of a different material catching the same light. One gradient cannot
be both. Rebuilt as three planes:

| Plane | What it is |
|---|---|
| `.clapWall` | The cyclorama. A broad soft key at 60% / 38% of the frame — high and large, the way a big soft source above and behind the camera actually falls on a curved wall — over the base colour, with a fine even tooth. |
| `.clapFloorPlane` | The floor. Its own element, from a little above the floor line to the bottom edge, faded in at its top with a `mask-image` so the junction is a curve rather than a horizon. Lightest just in front of the object, falling away to the bottom. |
| `.clapVignette` | The fall-off into the corners, over both. |

The floor is stone, not paint, so its texture is two turbulence frequencies —
one at `baseFrequency 0.9` for grain, one at `0.014` for large-scale mottling —
composited with `soft-light`. The wall gets only the fine one.

What changed by measurement against the references:

- The key moved from 56% of the frame height up to 38%, and grew from 74%×56% to
  80%×70%. It was sitting too low and reading as a pool near the floor rather
  than as illumination on a wall.
- Its strength roughly doubled (dark: `0.2` → `0.5` alpha; light: to full white
  with a `0.5` mid stop), which is what the references actually show.
- The floor gained its own three-stop ramp (`#34343a → #212125 → #0c0c0e` dark,
  `#dededd → #d0d0cf → #b2b2b1` light) instead of a single flat colour.
- The corner fall-off went from `0.72` to `0.92` in dark, with a mid stop at
  `0.34` so it ramps rather than steps.

Both new planes are `pointer-events: none` and sit below `.clapScene` in paint
order, so the board is lit by the room rather than vignetted with it, and the
click target is unchanged.

Re-verified after the rebuild: contact −10px at rest, air gap 35/40px lifted,
−7px at the edge-on instant, shadow at 774px throughout, a clap at turn 0.400
leaving turn and lift untouched, all six rear figures in both themes, and no
horizontal overflow at 430px in either theme. Build clean, tests 9/9.


## Eleventh pass — an actual slate material

The wall had paper grain on it: one `feTurbulence` layer at `baseFrequency 0.85`
and 3.5% opacity. That is tooth, not stone. The references are a slate room, so
the material is now three scales of noise, which is what stone actually is:

| Layer | Frequency | Role |
|---|---|---|
| tooth | `0.72` | the fine surface grain |
| bedding | `0.004 0.045` (anisotropic) | the layered streaks that run through slate |
| patches | `0.0075`, 5 octaves, contrast-stretched | the large-scale variation that gives a slab depth |

Composited `overlay, soft-light, normal` among themselves, then `soft-light`
over the room's own gradient — so it modulates the light on the wall rather than
tinting it. The floor uses the same three layers at a vertically compressed
scale, because it is the same stone seen in perspective, and at higher strength
because a floor is closer to the eye than a cyc.

Three things went wrong on the way and are worth recording:

1. **`feTurbulence` emits colour noise.** Without a
   `feColorMatrix type="saturate" values="0"` on each layer it tinted the whole
   room. All three are desaturated now.
2. **`feTurbulence` tiles do not wrap.** At `900px` and `1400px` the seams laid
   visible straight lines across the wall. The two large layers are now scaled
   to cover (`124%`, `130%`) with `background-repeat: no-repeat`, so there is
   exactly one tile at any viewport size — verified seam-free at 1024, 1440 and
   2560 wide. Only the fine tooth still tiles, where a seam is below the
   threshold of noticing.
3. **`overlay` at 0.85 was far too strong** and read as blotchy artefacts rather
   than stone. Back to `soft-light` at 0.5 on the wall, 0.9 on the floor.

Also added: a reflection of the object in the stone — a soft vertical smear
under it, scaled from its top edge (`transform-origin: 50% 0`) so it grows out
of the contact point rather than floating below it, and wiped out as the board
lifts. Its first version was scaled about its centre, which left a detached blob
on the floor. The contact core was tightened (46px → 34px, less blur) and both
shadow inks raised, so the board reads as touching rather than hovering at rest.

Re-verified after the rebuild: contact −10px at rest, air gap 35/40px lifted,
shadow at 774px throughout, a clap at turn 0.400 leaving turn and lift at
0.400/1.000, scroll reversed back to rest exactly, six rear figures in both
themes, no horizontal overflow at 430px in either theme, and no texture seams at
1024/1440/2560. Build clean, tests 9/9.


## Twelfth pass — production logo sizes

Every file in `public/assets/production-logos` is 200px tall, and the band drew
them all to one height. Drawing them all the same height is not the same as
making them look the same size: a single-line wordmark like Vision Quest gets
the full cap height, while a stacked two-line lockup — Gangs of London, Deadpool
& Wolverine, Harry Potter, Werwulf, Slow Horses, The Gentlemen — splits that
height between two lines and reads at half the weight.

`logoHeight()` in `src/lib/slateDeck.ts` now reads each PNG's IHDR for its real
pixel size and derives a drawing height from the aspect ratio, which is a good
proxy for how stacked a lockup is:

    height = clamp(46, 112 / sqrt(aspect), 90)

| Production | Aspect | Was | Now |
|---|---|---|---|
| Harry Potter | 1.56 | 54px | 90px |
| Deadpool & Wolverine | 1.82 | 54px | 83px |
| The Witcher | 1.88 | 54px | 82px |
| Werwulf | 1.89 | 54px | 81px |
| MobLand | 2.10 | 54px | 77px |
| The Gentlemen | 2.13 | 54px | 77px |
| Slow Horses | 2.43 | 54px | 72px |
| Gangs of London | 2.66 | 54px | 69px |
| The Odyssey | 4.30 | 54px | 54px |
| Supacell | 4.36 | 54px | 54px |
| Alien: Earth | 4.64 | 54px | 52px |
| Vision Quest | 4.83 | 54px | 51px |

The constant is set so a wide wordmark stays at roughly the 54px it already
looked right at, so only the stacked ones move.

The box around the mark is fixed at 90px — the tallest a mark will be drawn — so
the card is still exactly the same size whichever production is on it and the
board does not resize when clapped. The band's padding came down to partly
offset the taller box; the card went from 431px to 471px, which the geometry
picked up on its own (`cardH` and the geometry's `bodyH` both read 471).

Re-verified: contact −10px, nav clearance 48px desktop / 34px mobile, air gap
33/42px lifted, −3px at the edge-on instant, six rear figures with no overflow,
no horizontal overflow at 430px. Build clean, tests 9/9.


## Thirteenth pass — closing the gap to the reference renders

Compared like-for-like at 1545x1018, the reference frames' own size. The board
was a well-drawn rectangle; the reference is an object in a room. Seven concrete
differences, each fixed:

| What the reference does | What the board did | Change |
|---|---|---|
| Three-quarter view: the right side comes forward, the tops of the sticks show | Nearly flat-on (yaw 3°) | Resting yaw 0.055 → 0.13 rad (7.4°), resting pitch 0.04 → 0.062. The direction matches the reference — its right edge is taller than its left, so its right side is nearer the lens too. |
| Card face lit with a visible falloff to the bottom-right | Flat white with a faint radial | `linear-gradient(118deg, #fff → #f6f6f5 → #d6d6d4)`. Neutral, not cream: the old `#f9f8f5 / #e3e0da` stops were warm. |
| The sticks shade the top of the card | Nothing | `.clapBody::before`: an 18px shadow band under the rail, deepening to 28px and darker as the upper stick comes down (driven by `--clapHinge`). |
| Chunky chisel-marker hand | Thin (Caveat 700 at 0.35px stroke) | Stroke 0.35 → 0.6px, sizes +2px throughout. |
| Studio mark nearly fills its cell | ~55% of the cell | Art box 44px x 84% → 50px x 92%. |
| Board stands on ~20% of visible floor | 14% | Floor line 0.86 → 0.82. |
| Shadow falls to the lower-left of a high-right key | Dead beneath | Shadow origin biased `26 × scale` px left. |

Also: specular 0.11 → 0.14 now that the face has something for it to sit on,
and the resting cant eased to 0.008 rad.

Measured afterwards: card 664px wide against the reference's 665; contact −12px;
nav clearance 56px; floor share 0.18; air gap 34/42px lifted; rear 6/6. Tests
9/9, build clean. The `airGap=Infinity` reading at the exact edge-on instant is
the probe finding every panel culled, not a geometry fault.


## Fourteenth pass — the physical object

Against a new reference render. The brief describes a WebGL build (PBR
roughness/metalness, scene lights). Kept the CSS3D architecture deliberately:
every slab is already six culled faces in true 3D with a real pivot, text stays
crisp, the live timecode is real text, and a theme change is a change of
variables rather than a rebuild. Materials and lighting are painted rather than
simulated. This is the one place the implementation departs from the brief's
letter; it is stated in the report.

### Geometry (done first, as the brief orders)

| Change | Why |
|---|---|
| `BOARD_DEPTH` 26 → 36, `ARM_DEPTH` 28 → 36, sticks 40 → 42px | A real slate is a good centimetre and a half of chassis; the sticks have visible top and end faces in the reference. |
| Body edges retoned `light` → `frame` | The reference's chassis is dark aluminium with a white acrylic *insert*, not a white acrylic slab. The card face gets an 11px bezel on left, right and bottom (the rail is the fourth side); the rear plate sits inside the same bezel. |
| Edges know their face (`is-top/left/right/bottom`) | So a stick's top can be lit as the top of a stick, the frame's right wall can carry a rim, and its left and bottom can sit in their own shadow. |
| Resting yaw −0.055 → **−0.40 rad (23°)** | Measured from the reference: left and right edges are 425 and 525px tall, a 1.24 perspective ratio, which at this camera distance is ~24° of yaw. "Subtle" in the brief; not subtle in the render. Also: the board sits right of a centred camera, so its right wall only faces the lens once yaw exceeds the ~9.5° angle to the board. At 10° the wall was culled (measured) and the object read flat; at 23° it shows 8px, as the reference does. |
| Pin lifted 7 → 4 units off the rail face | It drew 9px below the seam under the resting tilt. Now within 1px of the fixed leaf's top edge at the same x. |
| Hinge leaves 60/56 → 68/64px, pin 21 → 24px, screws 10 → 11px | The reference bracket has more mass. |
| `PROJECTION_ALLOWANCE` 1.06 → 1.12 | A board yawed 24° projects its near end taller than a flat sum allows for. |

### The contact shadow follows the real bottom edge

On a board yawed 24° the bottom edge is a slanted line on screen — near end
lower, far end higher. A horizontal shadow at the floor line left the near
corner floating. `fit()` now projects the card's two bottom corners through the
camera in the resting attitude (`Vector3.project`) and lays the shadow between
them: slant 3.6° at 1545×1018, length matched to the projected edge.

Bug found doing it: the camera is not in the scene graph, so nothing updates
its world matrix, and `project()` reads it. The first version projected through
an identity camera and put the shadow at `translate(−2710px, 1565px)
rotate(−116°)` — off-screen, so every grounded screenshot in that run had no
shadow at all. `camera.updateMatrixWorld(true)` before projecting. Worth
remembering for any future projection from `fit()`.

### Closed state — the brief's first check

Two sticks visible; upper above lower; left ends aligned to 0px; stripes run
through the seam; hinge 0.000; pin on the seam to 1px. A second click while the
sticks are down lifts them (`state=opening, hinge=0.933`) rather than stacking.

### Validation matrix (all in the running site, 0 console errors, tests 9/9)

| Check | Result |
|---|---|
| Grounded / open / closed | ✓ screenshots; nav clearance 63px; right wall 8px |
| Lift beat | lift 0.784 at 14% travel, turn 0 |
| Halfway rotation, clap during it | hinge 1→0→1; turn/lift held at 0.440/1.000 |
| Full rear | 6/6 figures, no overflow, front face culled while back shows |
| Theme switch mid-sequence | scroll 1303, turn 1.000, lift 1.000, hinge 1.000, production WIT 51 — all preserved |
| Reverse scroll to rest | lift 0.000, turn 0.000 |
| Keyboard | Enter claps from the trigger; 2px focus ring |
| 1280×720 | nav 47px, bottom gap 114px |
| 430×880 both themes | no overflow, nav 74px, rear 6/6 |
| Reduced motion | hero un-pinned, board grounded, record as text (6 rows), clap works |

### Not done / not verifiable here

- **No WebGL / PBR** — see the top of this section. Painted materials.
- **No clap sound.** The brief says "if sound is enabled"; no such preference or
  audio asset exists. Not added.
- **No motion recording** — `ffmpeg` is not installed here.
- No screen-reader pass; keyboard and focus only. 430×880 is an emulated viewport.


## Fifteenth pass — studio polish (2026-09-08)

### Sources and preserved behaviour

Read DESIGN.md, src/styles/global.css, src/components/Header.astro,
src/components/ClapperBoard.astro, src/lib/clapperBoard.js,
src/lib/clapperMotion.js, src/lib/slateDeck.ts, src/pages/credits.astro,
src/content/pages/credits.json, package.json and the installed CSS3DRenderer.
No applicable AGENTS.md or CLAUDE.md was found in this worktree.
Reused the scene, six-face slabs, shared navigation, real production deck,
clap button, poster wall and theme handling. Editorial figures are unchanged.

### Implementation

- Desktop target width increases from 42% to 52.5%. Actual size is constrained
  by projected clearance across 25 scroll positions, with both open and closed
  sticks. It reserves space above the lifted arm and beside the text; resizing
  is the only operation that changes the object's scale. Header clearance uses
  the right-hand controls above the board, with an expanded-height minimum.
- Resting floor is at 89% on desktop and 60% on narrow screens. Contact-shadow
  midpoint is solved from the two projected bottom corners. Only the soft cast
  shadow carries a directional offset. Pointer tilt and idle bob were removed
  so resting corners remain on the fixed contact line.
- Camera depth remains constant throughout rotation. Lift remains 12% of body
  height and finishes before rotation. Existing easing shapes and clap timing
  are retained. Scroll damping now accounts for frame duration and snaps to the
  exact destination within numerical tolerance. World matrices update before
  culling, including the lift parent.
- Hero travel is 125svh desktop / 105svh mobile; rear hold is 15% of that travel.
  Short phones use an ordinary scrolling scene plus a visible text record.
- Rear labels increase 12.5 → 20px and figures 28 → 40px before projection.
  Production marks gain width and 18% target height inside the same fixed band.
- Removed horizontal texture layers, reduced remaining grain, softened the
  floor junction and light pool, restrained acrylic sheen, darkened silver
  sidewalls and strengthened light-theme contact shadows.
- Material palette moved to global.css, with dark and light theme tokens.
  Theme changes do not remount the scene or modify production/motion state.
- Native clap-button keyboard activation retained without an extra keydown
  handler. Explicit scene focus rings and reduced-motion CSS added.

### Validation status

| Item | Status / evidence |
| --- | --- |
| Build | Passed npm run build; final verification repeated after changes |
| Clap, held timecode, reopen, scroll independence | 11 Node tests pass |
| Desktop 1280×720, 1545×1018, 1920×1080 | Node geometry diagnostic passes 101 scroll positions each |
| Narrow 390×844 and 430×880 | Same geometry diagnostic passes |
| Open/closed, lift, intermediate, rear, reverse | Numeric projection checks pass; exact starting bounds recovered |
| Constant scale and stationary shadow | Numeric assertions pass across all sampled states |
| Repeated claps during traversal | Exercised in Node geometry diagnostic |
| Actual rendered materials, clipping, font fit and six rear rows | UNVERIFIED in browser |
| Both themes and state preservation on toggle | Implementation reviewed; UNVERIFIED in browser |
| Native keyboard/focus, reduced motion, short-phone fallback | Implementation reviewed; UNVERIFIED in browser |
| Transition into poster grid | Shortened hero; UNVERIFIED in browser |
| Screenshots | NOT CAPTURED for this pass |

The diagnostic at .agent-browser/check-credits-geometry.mjs executes the actual
scene code with synthetic DOM sizes. It is not a browser, does not calculate
font layout, and does not establish visual parity. Browser automation requires
an explicit /odyn-browser invocation in the current user message; this request
has no invocation. Earlier screenshots and prior-pass browser claims must not
be used as evidence for this revision.


## Sixteenth pass — the WebGL studio (2026-09-09)

### Brief and sources

The supplied `slate-studio-preview 2` (Three r185, WebGL, PCFShadowMap) is the
implementation starting point; `charcoal-studio-3d-refined.png` (1545×1018) the
visual target, with `light-studio.png` for the pale room. Read before editing:
the preview's README, studio.js, studio.css, index.html and
assets/texture-generation.md; the reference images; DESIGN.md; global.css;
Base.astro, Header.astro, site.js (theme event); credits.astro; credits.json;
slateDeck.ts and slate-deck.json; the existing ClapperBoard.astro,
clapperBoard.js, clapperMotion.js and tests; the installed three add-ons
(Reflector, RoundedBoxGeometry, RectAreaLightUniformsLib — byte-identical to
the preview's vendored copies bar an import path). No AGENTS.md or CLAUDE.md
exists in this worktree.

### What replaced what

| Before (CSS3D) | Now (WebGL) |
|---|---|
| `src/lib/clapperBoard.js` — DOM faces lifted into CSS3DObjects, culled by hand; the room painted in CSS gradients | `src/lib/clapperStudio.js` — real meshes (RoundedBox chassis, gasket, acrylic insert, side walls, lips, bezel, LED panel, glass, tally, two solid striped rails, extruded hinge leaves, pin, screws front and rear), a lit floor and cyclorama, one filtered key shadow, softbox environment, blurred planar reflection, contact occlusion |
| Type on the faces as live HTML | `src/lib/clapperArt.js` — the face, rear, LED, stripes, grain and brushed maps painted to canvas in Jost/Caveat/Anton at texture resolution; SVG marks re-declared at 1600px before rasterising |
| `--slate*` / `--studio*` CSS material tokens | removed; `--studioBack` (stage colour = scene clear colour), `--stageScrim`, `--stage*` ink tokens remain |
| `ClapperBoard.astro` with ~90 face elements | markup is the copy, the two captions, the cue, the progress hairline, a `role=status` line and the sr-only record; the scene is one canvas |

Kept from the site rather than the preview: `clapperMotion.js` for the hinge
(damped close, 0.9s hold, self-lift) and the scroll pose (lift → turn →
settle), the tests, the site's production deck via `slateDeck` (placeholder
camera columns preserved as such), the editorial record from credits.json on
the rear, the header, theme toggle, "Browse productions", the poster wall.
Not carried over from the preview: its own header/menu/theme button/contact,
its turn/reset controls, its bundled deck copy, and its 3.6MB floor PNG — the
same material ships as a 768px WebP (171KB) at the same 8× mirrored repeat.

### Behaviour

- Click on the board (raycast) or the accessible button: close (rate 26),
  contact, 0.9s hold, reopen (rate 8.5). Production change, LED hold and the
  synthesised clap sound fire once, at contact. A click during the closing
  swing is ignored (`clapClapperMotion`, new test); a click during the hold
  lifts early. The AudioContext is created on the gesture, before contact.
- LED runs at the card's fps; holds the contact frame; reopening samples the
  wall clock again. Under reduced motion it ticks once a second.
- Scroll: `clapperScrollPose` → lift 0–0.2 of travel (0.55 world units), turn
  0.2–0.7, settle to 0.85, hold. Rest yaw −0.40 rad wide / −0.27 narrow; the
  hinge is a separate group. Reverse is the same function run backwards.
- Camera: level, at eye height 5.5 (just above the lower stick), frame shifted
  with `setViewOffset` so the floor line lands at 84.5% (wide) / 58% (narrow)
  of the stage and verticals stay vertical. Magnification is the largest that
  keeps every pose — 21 scroll steps × open/closed — inside the nav-cleared,
  copy-cleared bounds (binary search on px-per-unit). Board-relative lights
  travel with the board's x.
- Theme: reads `data-theme`, listens to `t3:themechange` and a
  MutationObserver; relights the room, swaps the floor map, repaints the rear.
- Quality tiers high/medium/low (pixel ratio 2/1.5/1.25, shadow 2048/1536/1024,
  floor kernel 32/16/8 taps, reflection 512/384/off), chosen from device hints
  and stepped down once if the first 90 frames average over 24ms.
- Rendering pauses when the stage leaves the viewport or the tab hides; shadow
  maps are drawn once per frame (not again for the reflection pass); `destroy()`
  on pagehide disposes geometry, materials, textures, render targets, the
  reflector, the renderer and the audio context.
- Fallbacks: no WebGL → `mountClapperStudio` returns null → `.is-static`
  (copy and record as type). Reduced motion → `.is-calm` (unpinned hero,
  static board, record as type, clap snaps without a swing).

### Validation status

| Item | Status |
|---|---|
| `npm run build` | passes (a Vite chunk-size warning for the three.js bundle; the CSS3D build carried the same library) |
| `node --test` (13) | pass, including the new mid-swing click test |
| Frame-shift maths (Node, three camera only) | `.agent-browser/check-view-offset.mjs`: at 1545×1018 the floor lands at 0.845, eye level at 0.320, the board is 685px wide with a 1.176 near/far edge ratio and spans x 696→1369 — reference ≈690px, 1.17, 655→1345 |
| Framing solver (Node, same maths, same boxes) | `.agent-browser/check-studio-fit.mjs`: 1545×1018 zoom 0.945, rest silhouette 634→1318, every pose clears the nav guard (108px); 1920×1080 zoom 0.953; 1280×720 zoom 0.889; 390×844 zoom 0.829, board 19→374, floor at 0.58, tip at 126px (nav guard 98); 360×640 fits; 1024×1366 portrait shrinks to 0.612 to clear the copy |
| Rendered page (`.agent-browser/verify-credits-studio.py`, headless Chrome on Apple M5 Pro / ANGLE Metal) | PASS at 1545×1018, 1920×1080 and 390×844: canvas full-size and shown, grounded front, Enter on the button claps (shut → hinge 0.000, one production change, self-lift, no second change on the way up), three canvas clicks inside one swing → exactly one change, lift 1.000 with turn < 0.002 at 20%, rear at 90% with `data-clap-turned=yes`, theme switch mid-rear preserves production and turn, reverse to turn 0 / lift 0, "Browse productions" lands under the header, film filter reports "Showing 30 of 86 film productions", no console errors or warnings in any load |
| Reduced motion (emulated) | PASS at 1440×900: `.is-calm`, Enter claps and changes the production, six record rows as type |
| Screenshots | `.agent-browser/studio-*.png` — reference/wide/mobile × dark-front, dark-shut, dark-lift, dark-turning, dark-rear, light-rear, light-front; calm-front |
| Startup bugs found by running it | three temporal-dead-zone errors (`wantRender`, `start`, `last` reached by `requestRender()` during mount) — each dropped the page to the text fallback exactly as designed; all fixed by hoisting the loop state and declaring `start`/`stop` as functions. A PMREM warning (blur 0.05 > 20 samples) fixed with 0.035 |
| Visual iteration against the reference | charcoal room brightened from near-black (floor blend .075 → .17, backdrop base #272729 → #2f2f32, wash 380 → 950 cd on a 0.86 rad cone travelling with the board, fog .016 → .009, key 1120 → 1400, foreground fade .24 → .22); stripes made matte (roughness .62, clearcoat .06, env .35) so the black stays black; chassis from chrome to anodised (roughness .42, env .9); LED digits centred at 1.18 scale in a deeper red; rear type enlarged (labels 52px, figures 92px, title 86px) and its secondary lines weighted for the pale plate; lede widened to 36ch (three lines, as the reference); rear caption raised 56px clear of the controls |
| Performance (same machine, DPR 1 → 2 emulated) | first run: 24ms/frame mean at DPR 1 — the LED repaint (56 blurred canvas fills, 25×/s). Fixed with a glyph atlas (paintClock ×50 = 0.3ms) and change-only CSS writes; frame handler now 1.5ms CPU. With warm-up after each change, at DPR 2 with everything on: p90 17.4ms (60Hz cap); 2 area lights 17.2; 0 area lights 17.2; no shadow 17.0; no reflection 17.3; floor kernel 16 taps 16.9 — i.e. all effects fit inside the frame on this GPU. The tier probe and step-down remain for weaker devices |
| Honest remaining differences from `charcoal-studio-3d-refined.png` | the reference's backdrop pool is a little more concentrated and its floor a touch darker at the far left; its acrylic is marginally warmer; its LED segments are thinner. Not pixel-identical — a close likeness in composition, materials and light |


## Seventeenth pass — cinematic light, one continuous room (2026-09-09)

Tyler: the room read too bright, the acrylic so light the marker ink was hard to
read; wanted a backlight from behind and a light on the front; and the
floor/backdrop junction showed as a sharp cut instead of slate falling out of
focus into a paper backdrop.

- Exposure 1.38 → 1.05 (light 1.2 → 1.0); environment 0.45 → 0.3; hemisphere
  0.55 → 0.28. Area fill halved and the `top` area light removed (three area
  lights now, not four).
- Key tightened (0.68 → 0.5 rad, penumbra 0.75, 1150 cd) from front-high-left;
  still the only shadow-caster.
- New `rim` spot (800 cd, cool) behind-above-right aimed at the board's top, so
  the sticks' top faces and the near chassis edge carry a rim.
- New `halo` spot hidden behind the board aimed at the paper (replaces the wash),
  pooling directly behind the silhouette; the room's own base #2b2b2e.
- Acrylic: roughness .62 → .72, specular .16 → .1 — less glare over the ink.
- The floor and cyclorama are ONE mesh with ONE material: flat slate to z=-4, a
  radius-4 quarter curve, paper to y=30, with arc-length UVs so the grain is
  continuous. The grain is sampled with a mip bias of up to 4 as it recedes
  (`studioFocus`: sharp along the board's line, gone by z=-6.5 and y=3.5) and its
  bump relief fades with it — the slate out of focus — before soft cloud
  mottling takes over up the curve. Darkening toward the camera (to .18) and
  away from the board to either side (to .45 beyond ~15 units). `--studioBack`
  now #0d0d0f / #c4c3bf to match the new clear colours.
- Verified in the browser afterwards. The first render showed the halo spot's
  cone as a hard disc on the paper; replaced with a PointLight (340 cd, decay 2)
  hidden behind the board, whose pool has no edge. Rim raised to 1000 cd; grain
  blend .93 → .88 where the slate is in focus. Full suite re-run: pass at
  1545×1018, 1920×1080, 390×844 and reduced motion, no console errors; 13 tests
  and the production build pass.


## Eighteenth pass — the board itself (2026-09-09)

Tyler: "make sure it looks great with the clapboard". Marker hand stroked under
its fill (line width 3.2% of the size, round joins) so Caveat reads as a
chisel-tip marker; labels set #000 at 700/32px so they stay crisp through the
texture filter; key 1150 → 1320 cd (light 900 → 960) so the acrylic is a clean
white in the dark room without glare returning. QA handle gated to `?review=`
loads. Verified at 1545×1018 in both themes and the shut state; regression suite
re-run; 13 tests and build pass.


## Nineteenth pass — hovering, straighter, answering the mouse (2026-09-09)

Tyler: not side-on, more straight; not on the floor, hovering; more of a 3D
feel — move it around a little under the mouse; the rear text is hard to read.

- Rest yaw −0.40 → −0.16 rad (wide), −0.27 → −0.10 (narrow); a −0.03 rad lean
  back (`REST_PITCH`) so top faces still read.
- `HOVER = 0.9`: the lower edge floats 0.9 units above the floor at rest; the
  scroll lift adds 0.4 (was 0.55 from the floor). A slow drift (±0.05 + ±0.02,
  two sines) and a ±0.012 rad sway while idle; both off under reduced motion.
- New `nudge` group between `lift` and `slate`: the pointer turns the board up
  to ±0.16 rad yaw / ±0.09 rad pitch, measured from the board's projected centre
  out to 1.5 board-widths, full strength over the board and easing to nothing at
  the edge of reach, damped at 5.5/s, returning on pointerleave. Fine pointers
  only. The fit solver checks the nudge's four extremes in every pose.
- Contact pool and reflection now scale with the board's total height.
- Camera: eyeY 6.3, eyeFrac 0.30, floor 0.88 (wide); 0.16 / 0.62 (narrow).
- Rear repainted: plate #15171b, ink #fbfaf7, quiet .8; title 104px, note 36px,
  labels 600/60px, figures 100px, rows from y=600 at 120px steps.
- Node framing check (`check-studio-fit.mjs`, updated for hover + nudge): every
  layout clears the nav; 1545×1018 zoom 0.943, board bottom at 0.80, floor line
  0.88. 13 tests and build pass.
- Verified in the browser afterwards at 1545×1018: hovering front, the nudge
  turning the board towards a pointer over its right half, the rear legible;
  full suite green at 1545×1018, 1920×1080, 390×844 and reduced motion, no
  console errors. A sibling chat's texture-density and sharpening work (density
  2 canvases, `fitDensity`, `sharpen()`) landed alongside and is compatible.


## Twentieth pass — the printed faces at 4K (2026-09-09)

Tyler: the font on the front still isn't clear enough — "more 4K".

- Every painter (`paintFace`, `paintRear`, `paintLED`, `paintStripes`) now draws
  in its layout units on a canvas of any density (`fitDensity`), so the same
  coordinates paint at 2100 or 4200px across the face. The LED glyph atlas is
  built per density and blitted 1:1 in device pixels.
- Density by tier: high 2 (4200×2880 face and rear, 2800×470 LED, 4096×512
  stripes), medium 1.5, low 1 — capped by ceil(devicePixelRatio × 1.25).
  Published as `data-clap-density`.
- Anisotropy raised to the device maximum (16). Face, rear and LED materials
  sample their map with a negative LOD bias (−0.6 / −0.4) via `sharpen()`, so
  trilinear filtering no longer softens the type.
- Labels 32 → 36px 700; credit line 23 → 26px 600, lighter grey.
- 13 tests and build pass. Rendered result UNVERIFIED in this pass.


## Twentieth pass — darker charcoal room; the rear mark in two inks (2026-09-09)

- Tyler: the dark room read too light. Halo 340 → 210 cd, floor sweep 1.2 →
  0.6, rim cone 0.55 → 0.46, room base #2b2b2e → #1f1f22, slate blend .14 →
  .095, foreground fade to .14 from z=0.5, side fall-off to .3 from 4.5 units,
  ambient .28 → .22. Board lighting unchanged. Verified at 1545×1018: the room
  reads near-black around the board with a tight pool behind; the board itself
  is unchanged.
- Tyler: white Take 3 mark on the dark plate, dark mark on the pale one. This
  was already the behaviour but relied on `ctx.filter = 'invert(1)'`, which not
  every browser supports (the mark would then vanish black-on-black). Now
  `loadArt(src, { ink: 'light' })` builds a real white-ink SVG by swapping the
  fills, both versions are loaded, and `paintRear` picks by plate colour.
  Verified: white mark on the dark plate, black on the pale plate.


## Twenty-first pass — motion: arrival, and the clap as an event (2026-09-09)

Tyler: more motion, especially on the clap — "something a bit more of a
transition". Added, all off under reduced motion:

- Arrival: on first show the board is 1.0 unit low and turned 0.5 rad away,
  and springs into rest (k 26, c 5.6 — one soft overshoot, ~1.4s).
- Jolt: at contact the board takes the clap — vertical velocity −3.4 and a
  forward nod 1.1 rad/s into stiff springs (k 190, c 9), a dip and a bounce
  settling in ~0.5s.
- Flash: key ×2.5 and halo ×2.3 at contact, exposure ×1.3, decaying with a
  150ms time constant. The new production is painted 70ms after contact, under
  the flash, instead of on a bare frame.
- Kick: the camera takes a 0.05-unit knock that fades over 320ms.
- `lightBase` records the resting levels per theme; hoisted with the loop state
  because applyTheme() writes it during mount (a static check now confirms
  nothing assigned in applyTheme is declared only after its first call).
- 13 tests and build pass. UNVERIFIED in the browser.


## Twenty-second pass — the board moves to /laural as "Coming Soon" (2026-09-10)

Tyler: move the clapperboard to the Laural page as a coming-soon cover,
counting down to 17 September 2026, 12:00 BST; the credits cover goes back to
what it was (with a photo to come); the productions area stays exactly as
built; no scroll effect on either page.

- `ClapperBoard.astro` gains `variant="launch"`: one screen tall, not sticky,
  one card ("Coming Soon", roll T003, slate SOON, take counter), a "Turn it
  over / Turn it back" button in place of the browse link, no cue, progress
  bar or second caption. The `credits` variant is unchanged and unused.
- `clapperStudio.js` options: `scroll` (false → `heroProgress()` returns a
  manual turn set by `api.turn(toRear)`), `clock` (`{kind:'countdown', at}`
  paints `countdownText()` on the LED and never holds/releases the clock),
  `face` (painter options), `takeCounter`. `record.mark` is loaded as art.
- `clapperArt.js`: `paintFace(ctx, card, art, options)` with `studioLabel`,
  `markBox`, `bandText`, `creditLine`; `card.take` on the hand-written take;
  `tintMark(img, colour)` (source-in) for a black PNG mark on a dark plate;
  `paintRear` routes `record.kind === 'mark'` to `paintRearMark` (mark, Anton
  title, two lines).
- New `src/lib/countdown.js` + `tests/countdown.test.mjs` (4 tests; BST offset,
  rollover, clamp at zero, 99-day cap). `npm run test:clapper` now runs the
  whole `tests/` folder.
- `/laural`: hero replaced by the launch board (`navOverDark={false}`); the
  publish note kept as a tight band under it; `launch` block added to
  `laural.json` (the old `hero` keys are kept for the admin config); hero-only
  CSS removed.
- `/credits`: `ClapperBoard` removed; original `.pageHero` back, plus an
  optional full-bleed photo cover (same pattern and rotator as /dancers) driven
  by `hero.slides` in `credits.json` (empty for now — the photo Tyler attached
  did not arrive as a file); figures band restored; wall and everything below
  untouched.
- `public/assets/laural-mark.png` copied from the supplied folder.
- Verify script now drives `/laural?review=studio` (countdown ticking, clap,
  take counter, turn button both ways, both themes, reduced motion) and checks
  `/credits` has no board and lands on the wall.
- Tests and build pass. Rendered result UNVERIFIED in the browser this pass.

## Twenty-third pass — Laural is the board alone; pen lettering; lively idle (2026-09-10)

Tyler, on seeing /laural: "looked really good"; wanted more movement from the
scene, everything under the board removed, and "Coming Soon" written as if in
pen, bigger, with less padding.

- `src/pages/laural.astro` is now `Base` + `ClapperBoard` only. The why /
  casting / on-set / numbers sections and the publishing note are gone from the
  page along with their page-scoped CSS; their copy stays in `laural.json` so
  nothing is lost for the day they return.
- `clapperArt.js` band text: Anton 130px → Caveat 700 at 250px, stroked like
  the rest of the marker hand, centred at y 1272 and rotated −0.022 rad, max
  width 1980 of the 2100 face. Fills the band (1027–1440) with ~40px to the
  credit line. Mixed case ("Coming Soon", new `faceTitle` in `laural.json`)
  since capitals read as print, not pen. The rear still prints `boardTitle`.
- `clapperStudio.js` gains `idle: 'calm' | 'lively'` (component passes
  `lively` for the launch variant, `calm` for credits). Lively, and only when
  reduced motion is off: hover drift 0.05/0.02 → 0.09/0.03 with a 0.11-unit
  sideways wander; sway 0.012 → 0.05 + 0.014, plus a 0.022 nod and a 0.009
  roll on the nudge group; key breathes ±4% (+ a 1.2% flicker), halo ±7%;
  camera wanders ±0.04 x / ±0.025 y on slow periods (added to the kick, not
  replacing it); 150 dust motes (`THREE.Points`, radial-gradient sprite, size
  0.075) in a 9.2 × 5.2 × 4.6 box around the board in the rig, each rising
  0.05–0.16 u/s on its own sway and re-seeded at the top. Tinted in
  `applyTheme`: additive warm in the dark room, faint grey normal-blend in the
  pale one. Disposed through `keep()`.
- `package.json` `test:clapper` glob fixed (`tests/*.test.mjs`; Node 26 treated
  the bare folder as a file). 17 tests pass; build passes; offline framing check
  unchanged at all seven viewports (the lively wander is well inside the
  margins the fit already reserves for the nudge).
- UNVERIFIED in the browser this pass: the pen lettering's fit on the band, the
  dust's size and brightness, and the overall strength of the idle. All are
  single numbers to move.

- Follow-up: "COMING SOON" in all caps and thinner. Band text now Caveat 600
  (not 700), filled only — the stroke that thickens the numbers is dropped —
  still 250px, same position and tilt. `faceTitle` in `laural.json` is
  "COMING SOON". The 600 weight is added to the font readiness wait.

- Follow-up: the band line is now Jost 400 at 150px, 16px tracking, capitals,
  level (set type is not tilted), baseline 1250. The rear launch plate prints
  only the LAURAL mark (1100×700 at 500,250) and the date line in Jost 500
  52px; the Anton title and the second line are gone. `boardTitle` removed from
  `laural.json` and the component; `boardLines` is one line.

## Twenty-fourth pass — the board turns in the hand (2026-09-10)

Tyler: draggable, "turn it round without pressing Turn it over… move it in any
direction, up and down and around, but it stays in the exact spot. It just
rotates on an axis."

- New `spin` group between `lift` and `nudge` (order YXZ). Pointer drag on the
  board (launch variant only, `scroll === false`): sideways = yaw at 0.0105
  rad/px (~300px for a half turn), up/down = pitch at 0.006 rad/px, clamped
  ±0.7. Pointer capture; a drag of >6px suppresses the click that follows so it
  is not a clap; the nudge lets go while dragging; cursor grab/grabbing.
  `touch-action: pan-y` on the canvas so a finger's vertical swipe still
  scrolls.
- On release: velocity (smoothed 0.55/0.45, zeroed if the last move was >80ms
  ago or under reduced motion, capped ±7 rad/s) coasts with a 0.15s decay and
  the board settles to the nearest multiple of π of where it would coast to;
  pitch settles back to level. A release can therefore add at most about a
  third of a turn: a drag lands where you leave it, a flick from rest goes to
  the far face.
- "Turn it over" now drives the same group (`turn()` picks the next half-turn
  forward that shows the asked face); `turned` and `data-clap-turned` read the
  settle target; `data-clap-facing` is published on release and the button
  label follows it through a MutationObserver in the component. `manualTurn`
  removed; `heroProgress()` is 0 when not scrolling.
- `debug.spin` exposes the spin state on review loads.
- Browser-verified at 1440×900: 300px drag → rear; 300px back with a pause →
  front; hard flick from front → rear (not a double turn, after the cap was
  lowered from 9 rad/s and 0.22s, which spun 300px drags a full turn); tip up
  → levels on release, face kept; plain click still claps (take counts);
  button turns back and relabels; zero console errors.
- Video recording is not possible on this machine (`agent-browser record`
  needs ffmpeg, which is not installed).
- `--clapTurn` on the launch board is now `(1 − cos yaw) / 2` from the spin
  (0 front, 1 rear) rather than the scroll pose, so the CSS and the verify
  suite see the hand's turn. `debug.led` (last-painted readout) and
  `debug.spin` added; the suite reads `debug.led` as a property. Full suite
  green: 1545×1018, 1920×1080, 390×844, reduced motion, credits; zero console
  errors. Build passes.

## Twenty-fifth pass — credits: figures into the banner; logos and quotes off (2026-09-10)

Tyler: lose the client logos and "what the production teams say" from /credits
(hide, not delete), and fold "The work so far" into the top banner so the page
goes straight into the Film / Television / Commercial wall.

- The six figures now sit in the banner under the lede, in both banner forms
  (plain `.pageHero`, and the photo `.creditsHero` once `hero.slides` is
  filled): `.stats.creditsHeroStats`, six across on a hairline, coral numbers,
  soft labels; 3 across under 1024px, 2 across under 640px. Count-up behaviour
  kept (`data-countup`).
- Figures band, client-logo section and testimonials section removed from the
  page with their styles and imports (`clients.json`, `clientLogos`,
  `productionLogos`, the reviews collection). Their copy stays in
  `credits.json` (`figures`, `clients`, `testimonials`) and the reviews
  collection is untouched, so they can come back.
- Page order: banner (with figures) → `#productions` wall. Build passes.
  Not viewed in the browser this pass (no /odyn-browser); the banner's height
  with the row added at narrow widths is the thing to eyeball.
- The earlier export bundle in `_design/exports/credits-productions-area/`
  predates this and still carries the two sections.

## Twenty-sixth pass — the film cover on /credits (2026-09-10)

Tyler attached "Take 3 promo.mov" (1920×1080, 24fps, 89s, HEVC + AAC, 85 MB)
for the top of the credits page, "and create a bit more space so it can be
seen fully".

- HEVC does not play in most Windows/Android browsers, so it is re-encoded:
  `public/assets/credits-cover.mp4`, H.264 high 4.1, 1080p, CRF 25 capped at
  3.8 Mbps, no audio (it only ever plays muted), faststart — 21.2 MB for the
  full 89 s. (`avconvert`'s presets have no rate control: 95 MB at 1080p, 67 MB
  at 720p, so ffmpeg was installed via Homebrew.) Poster
  `public/assets/credits-cover.jpg` from 9 s (70 KB).
- `credits.astro`: a third banner form, `.creditsHero--video`, ahead of the
  photo and plain forms — `<video autoplay muted loop playsinline
  preload="metadata" poster>` filling the header, the words and the figures
  row over its foot. `credits.json` `hero.video` / `hero.poster` switch it on;
  clear them to fall back.
- "Seen fully": the header is the whole 16:9 frame (`aspect-ratio:16/9`, width
  100%, `max-height:100svh`, 440px floor / 520px under 640px), so on a desktop
  nothing of the frame is cropped; the scrim is lifted off the top and middle
  and kept at the foot under the words.
- Reduced motion: the page script strips autoplay/loop and pauses, leaving the
  poster.
- Build passes. Not viewed in the browser this pass (no /odyn-browser).
- Note for Tyler: a 21 MB file sits in the repository under public/; fine for
  Vercel, heavy for git history. A CDN/Blob home would be the better long-term
  place for video.

## Twenty-seventh pass — the film moves to /artists; credits reverted (2026-09-10)

Tyler: the video belongs on the artists page; put credits back to how it was
before the video.

- `/credits`: the video banner form, its consts, styles and reduced-motion guard
  removed; `credits.json` `hero.video/poster/videoNote` removed. Back to the
  plain `.pageHero` with the six figures (or the photo form once `slides` is
  filled). Browser-checked: no `<video>`, `.pageHero` present, 6 stats.
- `/artists`: `.artistsHero` — same film banner (full 16:9 frame, 440/520px
  floors, 100svh cap, foot-only scrim, muted loop with poster, reduced-motion
  guard) ahead of the plain cover, switched on by `hero.video` / `hero.poster`
  in `artists.json`. Media renamed `public/assets/artists-cover.mp4` (21 MB,
  H.264 1080p) and `artists-cover.jpg`.
- Browser-verified at 1440×900: video playing, muted, readyState 4, banner
  810px (= 1440 × 9/16); at 390×844: 520px, playing. Zero console errors.
  Build passes. The hero lede on /artists is still the `TODO:` placeholder
  from the copy file and prints as such over the film.
- Follow-up: no lede over the film on /artists — heading and eyebrow only. The
  `hero.lede` in `artists.json` is kept for the plain-cover fallback.
- Follow-up: replaced with Tyler's trimmed cut ("Promo 2022.mov", HEVC 1080p
  24fps, 79.3 s, 74 MB) — same encode settings → `artists-cover.mp4` 19.3 MB;
  poster re-pulled from 9 s. No page changes needed.

## Twenty-eighth pass — the credits cover photo (2026-09-11)

Tyler supplied a still from The Odyssey (4096×2864 PNG, the ship with the red
sail). Web copies: `public/uploads/credits-hero-odyssey-wide.webp` (2400×1678,
204 KB) for the banner and `credits-hero-odyssey.webp` (1600×1119, 128 KB) for
phones; `credits.json` `hero.slides` now carries the one slide (wideFocus
"center 58%", narrowFocus "55% center"), which switches the page to the
full-bleed photo cover with the words and the figures over its foot. Build
passes. Not viewed in the browser this pass (no /odyn-browser).
- Follow-up: swapped for the second Odyssey still (the plumed helmet in blue
  mist, 3840×2160). `credits-hero-helm-wide.webp` (2400×1350) and
  `credits-hero-helm.webp` (1600×900); the ship files removed. Focus raised
  (wide "center 42%", narrow "center 35%") to keep the plume in the banner.
- Follow-up: on the photo cover the lede is dropped and the block — eyebrow,
  "Credits", the figures — is centred, sat at 58% of the banner's height (56%
  under 640px) so the title reads over the shoulders and mist rather than the
  helmet's face; figures as a centred flex row. Scrim reweighted to carry the
  words through the middle. The plain-cover fallback keeps its lede.

## Twenty-ninth pass — credits cover: three turning figures, Jost title (2026-09-11)

Tyler: keep three figure blocks that turn through the other three ("it keeps
changing intermittently… not all at the same time, but always moving"); a
different font for "Credits"; no "Take 3 Agency" above it.

- Photo cover: eyebrow removed. Title in Jost 300 uppercase, 0.22em tracking
  (0.16em under 640px), clamp(46px, 7vw, 112px).
- `.creditsTurning`: three `[data-slot]` stats; the six figures ride on the
  container as `data-figures`. Script: each slot has its own period (4.6s,
  5.9s, 7.3s) and start (3.6s, 5.3s, 7.1s), so no two turn together; a slot
  takes the next figure in list order that is not on show. The number rolls via
  the site's count-up `number-flow` element (`flow.update(value)`), the label
  slides up and out while the new one slides in from below (0.55s). Slots are
  190px wide so the row never shifts. Held still under reduced motion (the
  first three stay); paused while the tab is hidden.
- Browser-verified at 1440×900 (after a stale-tab scare: the recording tab from
  the previous turn held an old stylesheet; a fresh `open` in the surviving tab
  showed the new rules): Jost title, slot widths 190/190/190, labels turning
  independently at ~4s, ~6s, ~10s; zero console errors. Clip recorded to
  `.agent-browser/credits-turning.webm` (ffmpeg now installed). Build passes.
- Follow-up: "Credits" sat left of centre — the shared `.heroTitle` rule caps
  itself at `max-width:1000px`, so the centred line was centred inside a box
  narrower than the banner. `.creditsHero .heroTitle { max-width:none }`.
  Measured: title centre 720, figures centre 720, page centre 720 at 1440.
- Follow-up: "Credits" in Montserrat 300 (Montserrat 200/300 added to the
  Google Fonts link in Base.astro; Jost falls back), 0.2em tracking,
  clamp(44px, 6.6vw, 108px). Not viewed in the browser this pass.
- Follow-up: type per Tyler's Canva reference — Montserrat Bold, letter
  spacing 550 (≈0.55em): title now Montserrat 700, 0.55em tracking (0.4em
  under 640px), clamp(34px, 5vw, 84px); Google Fonts link carries Montserrat
  700 only. Photo swapped for the third Odyssey still (warriors at dusk,
  4096×2864): `credits-hero-dusk-wide.webp` / `credits-hero-dusk.webp`, focus
  "center 62%" wide, "48% center" narrow; helmet files removed. Not viewed in
  the browser this pass.
- Follow-up: block back to the foot, left — heroCopy bottom:64px (36px under
  640px), left-aligned; title keeps Montserrat 700 / 0.55em with no indent;
  the three turning figures left-aligned as a flex row on the hairline; scrim
  foot-weighted again. Not viewed in the browser this pass.
- Follow-up: figures and hairline off the photo cover; a lede back beneath the
  title (hero.lede rewritten: "Over 533 productions supplied across the UK and
  Europe. Feature film, television and commercial, since 2019 — the titles
  below speak for themselves."). Turning script and styles removed; the plain
  fallback keeps its six-figure row. Not viewed in the browser this pass.
- Follow-up: title back to Anton (clamp(48px, 6vw, 104px), no tracking);
  Montserrat dropped from the fonts link. Not viewed in the browser.
