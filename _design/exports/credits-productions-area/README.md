# Credits page — everything below the hero

The productions wall and what follows it (client logos, testimonials), packaged
to drop into another workspace. The 3D clapperboard hero is NOT in here: the
drop-in page keeps the site's original simple hero and figures band.

Baseline: commit `8b3d01c` (2026-09-04, "Add production poster artwork to the
homepage and credits page (#5)").

## What's in the box

| Path | What it is |
|---|---|
| `src/pages/credits.astro` | Drop-in page. Original hero + figures band, then the new wall, clients and testimonials sections, the filter script and the styles. Replaces the file. |
| `credits.astro.below-hero.patch` | The same change as a patch against the baseline file, if you'd rather apply than replace. Hero hunks excluded. |
| `src/lib/creditWall.ts` | NEW. Builds the wall from `posters.json` + `credit-detail.json`: labels ("The Crown, S6"), A–Z rank, tags, the filter pill lists, counts. |
| `src/lib/placeholderDisciplines.ts` | NEW. The INVENTED "what we supplied" stand-in, behind one switch. Read its header before shipping. |
| `src/data/credit-detail.json` | NEW. Per-title format (Film / Television / Commercial) and, when known, disciplines. Keyed by poster slug. |
| `src/content/pages/credits.json` + `credits.json.patch` | Copy changes: the six agency figures (533 / 151 / 194 / 94 / 54 / 71) and two notes reworded so they no longer read as `TODO:`. |
| `global.css.snippet.css` | Site-wide: `scroll-padding-top` steps down with the fixed nav's height, so anchor jumps to `#productions` land under the header at every width. |
| `docs/credits-content-gaps.md` | What is real, what is a stand-in, and what is still outstanding on the wall. |

## What it depends on (already in the baseline — do not copy)

- `src/lib/posters.ts` exporting `posterWall` and the `Poster` type, and `src/data/posters.json`
- `src/lib/productionLogos.ts` (`featuredCredit`), `src/lib/clientLogos.ts` (`hasLogo`), `src/data/clients.json`
- the `reviews` content collection
- `src/layouts/Base.astro` and the global classes/tokens it already ships:
  `.band .bandInner .sectionHead .sectionTitle .kicker .bandBody .todoNote`,
  `.stats .stat .statNum .statLabel`, `.logoStack .logoPage .logoCell`,
  `--ink --bg --sub --muted --hair --tileBg --ctrlBorder`, and Anton/Jost.

The Caveat font added to `Base.astro` in this branch is for the clapperboard
only; the wall does not need it.

## Apply

1. Copy `src/lib/creditWall.ts`, `src/lib/placeholderDisciplines.ts`,
   `src/data/credit-detail.json`, `src/content/pages/credits.json` into place.
2. Replace `src/pages/credits.astro` with the one here — or
   `git apply credits.astro.below-hero.patch` onto the baseline file.
3. In `src/styles/global.css`, replace the single `html { scroll-padding-top:84px; }`
   line with the four lines in `global.css.snippet.css`.
4. `npm run build`. The wall renders every card in the document (search and
   no-script still work); the pills and "Load more" only hide and show.

## What changed on the page, in plain terms

- **Wall.** Five to a row (4 / 3 / 2 at 1200 / 900 / 640), poster plate with
  the title in Anton beneath it and, where recorded, "what we supplied" in wide
  quiet caps. Cards do not link yet; hover is a quiet dim.
- **Filters.** A row of pills built only from values the data actually carries
  — formats first, a hairline, then disciplines — so a pill can never return an
  empty result. Pressed state inverts. Hidden entirely until `credit-detail.json`
  has content.
- **Load more.** First 30 cards shown, 30 more per press; nothing above the
  button moves, and it keeps focus. An `sr-only` live region announces
  "Showing N of M …" after every change.
- **Empty state.** "Nothing in that category yet" with a reset that refocuses
  the first pill. Reachable only if data changes make a pill empty.
- **Clients / testimonials.** Unwritten copy is now omitted rather than printed
  as a `TODO:` note; the empty-testimonials line reads as body copy.
- **Anchor landing.** `#productions` no longer carries its own `scroll-margin-top`
  (it stacked with the global one and landed 216px low); the global value now
  steps 84 → 80 → 72 → 64 with the nav.

## Before this goes live

`PLACEHOLDER_DISCIPLINES` in `placeholderDisciplines.ts` is `true`: the
"what we supplied" line under each title is generated, not real. Either fill in
`disciplines` per title in `credit-detail.json`, or set the switch to `false`
(cards then show poster and title only). Formats in `credit-detail.json` are
the published formats and are real; 22 titles are left blank as unidentifiable.
