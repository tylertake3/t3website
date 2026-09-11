# Credits page — outstanding content

Internal. These were previously printed on the public page as `TODO:` notes.
They have been moved here: removing a note does not supply the information, and
the affected fields are now **omitted from the page** rather than filled with
generated values.

## 0. Where per-title detail now goes

`src/data/credit-detail.json`, keyed by the slug in `posters.json`:

```json
{ "titles": { "the-crown-s6": { "format": "Television", "disciplines": ["Spacts", "Models"] } } }
```

Both fields are optional per title, and the page degrades honestly:

- A **format** pill only appears if at least one title carries that format, so a
  pill can never return an empty result. Currently only `Television` appears,
  because it is the only format with real assignments.
- A card shows **what Take 3 supplied** under its title. With no disciplines
  recorded, the card is its poster and its title.
- The seed classifies the **68 titles that carry a season number** as
  `Television`. A recorded season means episodic television; that is a fact
  about the supplied data. The other 237 are left blank — the absence of a
  season number does not make a title a film, so nothing was classified that
  way.

## 0b. State as of 8 September 2026 — READ THIS FIRST

Tyler asked for the filter pills and the "what we supplied" line back, and for
the invented disciplines to stand in meanwhile. So, precisely:

| Field | Status |
|---|---|
| Title, series number, artwork | **Real.** From `posters.json`. |
| Format (Film / Television) | **Real.** The published format of each production — public fact, checked per title. 86 Film, 197 Television, 22 left blank as unidentifiable. No Commercial: Tyler confirmed there are none on this wall. |
| Disciplines supplied | **INVENTED.** From `src/lib/placeholderDisciplines.ts`. Wrong far more often than right. |

The card reads `The Crown, S6` — the series number is part of the title rather
than a line of its own — then what Take 3 supplied. The search field and the
order control were removed on request (8 September 2026); the pills and
"Load more" carry the wall. `search` and `alphabetical` are still computed in
`creditWall.ts`, so either control can be put back without touching the data.

**The discipline line and the four discipline pills must not go live as they
are.** Either fill in real assignments in `credit-detail.json` (a real
assignment always beats the stand-in, per title) or set
`PLACEHOLDER_DISCIPLINES = false` in `src/lib/placeholderDisciplines.ts`, which
drops the line and the pills and leaves the format pills working.

The 22 titles with no format are: a-woman-of-substance, army-of-shadows,
bad-tidings, eagle-eye, ebenezer, elden-ring, fightland, kennedys, ladies-first,
mutiny, odessa, one-day, pressure, scorn, secret-service, shiver, supergirl,
the-hunt-stage, the-magic-faraway-tree, the-runner, the-sheep-detective,
your-fault-london. Each is either an ambiguous slug (`one-day` and
`secret-service` each match both a film and a series; `luther`, `sexy-beast` and
`people-just-do-nothing` were resolvable, these were not) or a production I
could not identify with confidence. Say which they are and I will set them.

## 1. Per-title credit detail — BLOCKING for any richer card

`src/data/posters.json` carries exactly four fields per entry: `title`,
`season`, `slug`, `src`. Nothing else about these 305 productions is supplied.

A previous version of this page displayed a **discipline** (Spacts / Dancers /
Stand-Ins / Models), a **format** (Feature / Series) and a **studio** on every
card. None of it was real: it came from `src/lib/creditMeta.ts`, which hashed
the title slug and indexed into fixed lists. It has been deleted.

To bring any of that back, supply per title:

| Field | Why it cannot be derived |
|---|---|
| Disciplines supplied | Take 3's contribution to a production is not inferable from its title, poster or studio. |
| Format (feature / series / commercial) | A title with no season number recorded is not therefore a film. |
| Studio or network | Not present in the data, and not safely inferable from artwork. |
| Release or supply date | Not present. This is why the wall offers no "Latest" ordering — array position is not recency. |

Shape to aim for, keyed by `slug`:

```json
{ "the-crown-s6": { "disciplines": ["Spacts"], "format": "Series", "studio": "Netflix", "supplied": "2022-06" } }
```

Until then the card is a poster and a title, plus the series number where one is
recorded. That is enough to browse by, and all of it is true.

## 2. Clearance — BLOCKING for publication

Every new title must be checked against what Take 3 is contractually permitted
to name, and the embargo status of anything unreleased confirmed, before it goes
on the wall. This has not been done for the current 305 entries.

## 3. Rear-of-slate figures — RESOLVED

Tyler supplied these directly on 8 September 2026. They now live in
`src/content/pages/credits.json` under `figures.items` and are the sole source
for the record on the back of the slate:

| Row | Figure |
|---|---|
| Productions supplied | 533 |
| Feature films | 151 |
| Television series | 194 |
| Commercials & campaigns | 94 |
| Studios & networks | 54 |
| Brands | 71 |

They are **stated numbers, not derived ones**. An earlier version computed a
feature/series split from whether a `season` number happened to be present in
the poster data, which classified nothing — 237 titles were reported as feature
films purely because no season number had been entered. Nothing on the slate is
computed from `posters.json` any more.

Note the arithmetic: 151 + 194 + 94 = 439, against 533 productions supplied. If
those three are meant to account for the whole 533 there are 94 unclassified;
if they are simply three highlights of a larger set, no change is needed. Worth
a check.

`withRecordedSeason` in `src/lib/creditWall.ts` counts wall entries carrying a
season number (currently 68) for internal reporting only. It is deliberately not
published: a series supplied without a season number would be missed, so it is
not a count of series.

## 4. Client logos

`src/content/pages/credits.json` → `clients.body` and `clients.artworkNote` were
`TODO:` strings printed on the page.

- Copy: one short factual paragraph introducing the wall is still needed.
- Artwork: several marks in `src/data/clients.json` have no file in
  `public/assets/logos`. Those cells render as empty plates by design (see
  `hasLogo` in `src/lib/clientLogos.ts`) rather than firing a 404.

## 5. Testimonials

`testimonials.emptyNote` was a `TODO:` string. There are 21 reviews in
`src/content/reviews`, so the note never showed; it is kept as a genuine empty
state, not as a note to the reader. Attributed quotes are reproduced as given
and must not be edited.

## Decisions that need Tyler

1. ~~Discipline filters are gone from the page.~~ Restored on request, running
   on invented data — see §0b. Real assignments still needed.
2. ~~The rear record is four rows, not six.~~ Resolved — six supplied figures,
   see §3. One thing to confirm there: whether 151 + 194 + 94 is meant to add up
   to 533.
3. **305 titles are on the wall uncleared.** Should the wall be cut to a cleared
   subset before this page goes live?
