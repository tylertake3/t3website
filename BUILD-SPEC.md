# Take 3 Agency — Website Build Specification (v2)

Content and structure only. All visual direction is covered separately in the Design MD.

---

## Organising principle

Every page except `/join` is a marketing tool aimed at clients: producers, ADs, coordinators, casting directors and commercial agencies.

`/join` is the only page that speaks to performers. Any recruitment language found elsewhere moves there.

Every client-facing page converts to the same action: **Get in touch**.

---

## Navigation structure

**Artists** becomes a parent item with a dropdown. The categories sit beneath it in the menu, but keep their own top-level URLs.

```
Artists            → /artists
   SPACTs          → /spacts
   Dancers         → /dancers
   Models          → /models
   Stand-ins       → /stand-ins
Specialists        → /specialists
Who We Are         → /about
Laural             → /laural
Credits            → /credits
Contact            → /contact
[Get in touch]   → button
```

**Why the URLs stay flat.** Menu hierarchy and URL hierarchy are independent. Keeping `/spacts` rather than `/artists/spacts` keeps the term prominent in the URL, avoids longer paths, and means the pages already built need no redirects. The dropdown gives you the sense of hierarchy without the cost.

`/what-is-a-spact` sits outside the menu entirely. It is a search landing page, reached by links from `/spacts` and from Google.

---

## Page status

**Already designed**
- Home
- SPACTs
- What is a SPACT (sub page)
- Dancers
- Models
- Stand-ins & Picture Doubles

**Still to design**
1. Our Artists (parent)
2. Specialists
3. Laural
4. Credits
5. Who We Are
6. Contact
7. Join

Suggested order: Artists first, since it is the parent the built pages hang from, then Laural and Specialists, then the supporting pages.

---

## Header and navigation

The previous horizontal nav does not hold the new structure and will break as pages are added. Replace it entirely.

### Header bar

Minimal and persistent. Left to right:

- **Logo**
- **Timecode slate** (see below)
- *(right side)* **Light/dark toggle**, **Get in touch** button, **Menu** button

The theme toggle and Get in touch button remain visible at all times, including while the overlay menu is open, so the primary action and the theme control are never hidden behind a menu. Both must be legible in three states: over the dark hero image, over the overlay background, and in light mode.

### Timecode slate

A small clapperboard-style detail beside the logo: clapperboard icon, `LONDON`, and a live running timecode in monospace.

- Format `HH:MM:SS:FF`, frames at 24fps, so FF cycles 00 to 23 each second. Do not use three-digit milliseconds; they are unreadable at speed.
- Europe/London time via `Intl.DateTimeFormat` with an explicit timezone, not the visitor's local clock.
- Update with `requestAnimationFrame`, not `setInterval`.
- Tabular figures in a fixed-width container so digits do not jitter.
- Pause when the tab is hidden using the Page Visibility API, and resync on return. A frame counter repainting in every background tab is a real battery cost.
- `aria-hidden="true"`. It is decorative and would otherwise be announced constantly.
- Under `prefers-reduced-motion`, show a static time updating once per second instead of a live frame counter.
- **Responsive:** hide the `LONDON` label below 1000px but keep the icon and timecode. Hide the slate entirely below 640px.

### Overlay menu

Full-screen overlay on desktop as well as mobile. This is deliberate: a horizontal bar is a fixed-width container for a list that keeps growing, and the site will keep adding pages.

**Primary column, for clients.** Large type, vertical list:

- **Artists** — with SPACTs, Dancers, Models and Stand-ins & Picture Doubles shown as a visible indented sub-list, not a hover state
- **Specialists**
- **Laural**
- **Who We Are**
- **Credits**
- **Contact**

**Secondary column, for performers.** Visually separated and quieter, under a small "For performers" label:

- **Join the roster**, with a one-line note on who applications are open to

This finally resolves where `/join` belongs. It is the only page addressing performers, so it should not sit in a list of client pages.

**Also in the overlay:** contact email, phone, and social links.

**Behaviour**
- Opens and closes smoothly; menu button morphs to a close state and its label changes
- Closes on Escape and on selecting any link
- Traps focus while open, returns focus to the menu button on close
- Locks background scroll
- Hides the rest of the page from screen readers while open
- Menu button carries `aria-expanded` and an accessible label
- Respects `prefers-reduced-motion`

**Trade-off, accepted.** Putting navigation behind a click reduces incidental browsing between pages. This is acceptable here because most visitors arrive wanting one specific thing, the Get in touch action stays permanently visible, and the homepage already signposts the categories through the Artists section.

### URLs stay flat

Menu hierarchy and URL structure are independent. Categories keep top-level URLs (`/spacts`, not `/artists/spacts`). Nesting would force redirects on pages already built and lengthen paths for no benefit.

`/what-is-a-spact` stays out of the menu entirely. It is a search landing page, linked from `/spacts`.

---

## Homepage — approved copy

The Home page is already designed. This is the approved wording for the "Who we are" block, which replaces the previous "The UK's largest specialist talent agency" version.

**Label:** `WHO WE ARE`

**Headline:** `SPECIALIST TALENT FOR FILM, TELEVISION AND COMMERCIAL.`

**Body:**

> We supply dancers, fighters, SPACTs, models and specialist performers to productions across the UK and Europe.
>
> Whether a role calls for a particular skill, a particular look, or both, you get a trained professional who understands how a set works and arrives ready to deliver. And when a brief asks for something we have never been asked for before, we find it.

**Stat row:**

| Figure | Label |
|---|---|
| 500+ | Productions supplied |
| 1,500+ | Artists |
| UK & Europe | Where we work |
| 2019 | Trusted since |

### Why this wording

- **No superlative.** "The UK's largest" is an objective claim about market position that would need substantiating if challenged, and it sits against the brand principle of proving rather than asserting. Claiming the category instead is unarguable and ages better as competitors grow.
- **Not UK-limited.** A significant amount of work is in Europe. Reach is stated as plain fact inside a sentence rather than announced, so an international producer sees themselves immediately without the page becoming a geography boast. UK stays in the page title and meta description, where it earns search traffic.
- **Skill or look, not just skill.** Not every booking is about a skill. Picture doubles and models are cast on look. The line covers the full roster so a producer casting a double and a coordinator casting a fight sequence both see themselves in it.
- **What is actually being sold.** "Understands how a set works and arrives ready to deliver" applies to every artist on the books and is the real difference between an easy day and a difficult one. Protect this line in any future edit.
- **Strongest sell last.** "When a brief asks for something we have never been asked for before, we find it" sits in the final position, where it lands hardest.
- **Vetting moved down the page.** That every artist is assessed and interviewed is a genuine differentiator, but it is a reassurance for someone already considering Take 3, not a first-impression hook. It belongs further down the homepage or on `/artists`, not in the opening block.
- **Removed:** "the best of the best" (asserts what the preceding sentence had already proved) and the em dash.

**Shorter alternative** for the middle paragraph, if the block needs tightening:

> Whether a role calls for a particular skill, a particular look, or both, you get a trained professional who knows how a set works. And when a brief asks for something we have never been asked for before, we find it.

---

## 1. Our Artists — `/artists`

**Job:** The hub. Serves anyone who doesn't yet know which category they need, and gives the category pages a parent.

**Sections**

1. **Hero** — Establishes the breadth of the roster without favouring any one discipline.

2. **The full range** — Short introduction to what Take 3 supplies across the board. Balanced: no single discipline should dominate the reading.

3. **Category grid** — The four core routes, equal weight, each linking to its page:
   - SPACTs
   - Dancers
   - Models
   - Stand-ins & Picture Doubles

   Each tile carries a one-line description of who that category is for.

4. **Specialists** — Presented separately and given more room than a tile, because it does a different job. This is the "whatever the brief needs, we will find it" promise, and it also resolves the crossover between disciplines. Links through to `/specialists`.

5. **Represented, not listed** — The positioning line: Take 3 represents a chosen roster rather than operating an open directory. Every artist is assessed and interviewed before joining. The roster is not published in full, and access is by request. This is where the private-roster positioning now lives, since it no longer has its own page.

6. **Who we work with** — Productions and brands, briefly. Plus a light line covering film, television and commercial so no single format dominates.

7. **Get in touch** — Primary conversion block.

**SEO**
- Title: `Our Artists | Specialist Talent for Film, TV & Commercial | Take 3 Agency`
- Description should name the categories, since this page can rank for general talent searches.
- One H1.

---

## 2. Specialists — `/specialists`

**Job:** Carries the strongest sell, that Take 3 will find a production whatever it needs. This is also where the category crossover problem resolves itself: rather than drawing hard lines, Specialists is the flexible tier.

**Positioned separately from the four core categories.** It is not a fifth discipline, it is the answer to anything the other four do not cover, so it should read as a different kind of offer rather than another tile in a grid.

**Sections**

1. **Hero** — Along the lines of "if the scene needs it, we'll find it".

2. **The promise** — Sourcing beyond the standing roster. What happens when a brief asks for something unusual.

3. **Examples** — Footballers, circus artists, stunt performers, skateboarders, creature performers, martial artists, athletes, motion capture, military and armed police. Presented as illustrative rather than exhaustive.

   **Physical and character specifics also live here.** A brief calling for a 6ft 9 actor, an identical twin, a particular build or a distinctive face is a specialist requirement, not a separate division. Covering this on the Specialists page means Take 3 can answer those briefs without committing to actors as a standalone category.

4. **How it works** — Brief in, sourcing, vetting, options presented. Keep it short; the point is that there is a process, not a lecture on it.

5. **A worked example** — One or two genuine unusual briefs fulfilled. This is the most persuasive part of the page, so it is worth gathering real examples before writing.

6. **Get in touch** — Framed as "tell us what you need", since this is bespoke by nature.

**Cross-links:** SPACTs and Dancers, since the overlap is real.

---

## 3. Laural — `/laural`

**Job:** Show that Take 3 runs on a platform built for production. Turns an operational advantage into a competitive one.

**Framing rule.** Do not state or imply that Take 3 built, owns or developed Laural. Take 3 runs on it. Equally, do not claim it is independent or licensed from a third party. Say nothing about its origin.

**Sections**

1. **Hero** — Laural mark, plus a line establishing that every booking runs on it. Discipline strip: SPACTs, Dancers, Stunt, Models, Actors.

2. **Why it exists** — The roster is only half the job. What actually determines whether a shoot runs smoothly is everything around the booking. That part of the industry still runs on annotated PDFs and spreadsheets.

3. **Casting & selection**
   - Collaborative lookbooks: costume, hair and make-up selecting simultaneously
   - The triple-tick system: department choices tracked live, greenlit by consensus

4. **On set**
   - Verified profiles: look checks captured live, so who you cast is who arrives
   - Digital check-in: QR passes setting arrival and wrap times automatically
   - On-set messaging: reaching the on-set area rather than one AD's mobile

5. **The numbers**
   - Live cost reporting: spend, overtime and day types in one dashboard
   - Simplified queries: itemised, approve or deny

6. **Get in touch**

**Do not include:** the product roadmap (scene mapping, AI measurements, costume visualiser, digifits, 360 videos and so on). It commits you publicly and tells competitors your plan.

**Before publishing**
- Talent rating mechanics: describe reliability in general terms only. Artists will read this page.
- Ethnicity analytics: special category data under UK GDPR. Keep off the public page until the lawful basis is documented.
- Every screenshot must use dummy names, faces and figures.
- Do not publish before Laural is genuinely live for productions.

---

## 4. Credits — `/credits`

**Job:** Proof. Likely the most persuasive page on the site.

**Sections**
1. Headline figures: productions supplied, artists represented, trading since 2019
2. Production credits grouped by film, television and commercial
3. Client logos
4. Testimonials, where you have permission
5. Get in touch

**Check first:** what you are contractually permitted to name, and confirm any embargo status before publishing recent titles.

---

## 5. Who We Are — `/about`

**Sections**
1. The story since 2019
2. How the agency works: the operational difference. Contracts, fees, overtime, buyouts and coordination handled by Take 3
3. The team
4. What the agency stands for, shown through examples rather than stated
5. Light link through to Laural
6. Get in touch

---

## 6. Contact — `/contact`

**Sections**
1. Direct contact details
2. General enquiry form
3. Clear signposting: clients to Get in touch, performers to `/join`
4. Company details and registered address

---

## 7. Join — `/join`

**Job:** The single home for everything talent-facing.

**Sections**
1. Who Take 3 is looking for, by discipline
2. What the agency offers a performer
3. Requirements and experience expectations, including the stand-ins criteria currently sitting on the wrong page
4. Application process and what happens next
5. Application form
6. An honest note on response times and that not every applicant is taken on

**Note:** all recruitment copy from `/stand-ins` consolidates here.

---

## Shared components

**Header** — Logo, timecode slate, theme toggle, persistent Get in touch button, Menu button. Navigation lives in a full-screen overlay. See "Header and navigation".

**Footer** — Category links, contact details, company details, privacy and terms, and one quiet "Are you a performer? Join the roster" link to `/join`.

**Get in touch block** — Repeating conversion section at the foot of every client-facing page.

**Cross-links** — Every category page links to two or three sibling categories. This handles the crossover between disciplines honestly rather than pretending the lines are clean.

**Private roster.** The full roster is not published. Each category page shows selected work and explains the discipline, then closes with Get in touch. No page should attempt to display the whole book, and no page should ask the client to "request" anything: the action is simply to start a conversation.

---

## Get in touch form fields

Since this replaces the separate request page, the form needs to qualify without deterring. Suggested:

- Name
- Company
- Production or brand
- Role
- Project type: film / television / commercial / other
- What they are looking for
- Shoot dates
- Location
- Email
- Phone

Every additional field costs enquiries. Keep it to what you genuinely need to respond well.

---

## SEO checklist

Run across every page once built.

- One H1 per page, containing the page's main term
- Unique title tag, roughly 60 characters
- Unique meta description, roughly 155 characters
- Alt text on every image
- Substantive body copy on every page; image-only pages cannot rank
- Internal links between related pages, and from `/spacts` to `/what-is-a-spact`
- 301 redirects confirmed for any changed slug
- Sitemap resubmitted in Google Search Console after launch
- Google Business Profile completed and consistent with the site

---

## Open decisions

1. **Named productions and client logos.** Cleared for publication in general. Unreleased titles still need an embargo check before going live, The Odyssey in particular.
2. **Superlative claims.** Resolved: "The UK's largest specialist talent agency" is replaced by the approved homepage copy above.

Both items above are now settled. No open decisions remain that block the build.
