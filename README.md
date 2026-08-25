# Take 3 Agency — website

The live site for take3agency.com.

## Pages

| Address | Page |
| --- | --- |
| `/` | Homepage |
| `/dancers` | Dancers |
| `/models` | Models |
| `/spacts` | SPACTs |
| `/stand-ins` | Stand-ins & picture doubles |
| `/what-is-a-spact` | "What is a SPACT?" explainer |

## Working on it locally

```bash
npm install     # once
npm run dev     # preview at http://localhost:4321
npm run build   # produce the files that get published
```

## Editing the site without touching code

Once the site is live, go to `take3agency.com/admin` and sign in with GitHub.
You get a simple editor for:

- **Reviews** — add, edit, reorder or remove what productions have said.
- **Hero slideshow** — the rotating full-screen photos on the homepage.
- **What we supply** — the scrolling row of talent categories.
- **Client logos** — the logo wall, with a light and a dark version of each logo.

Saving in the editor commits the change to GitHub, and the site rebuilds and
republishes itself within a minute or two.

Before that works, one line in `public/admin/config.yml` needs the real GitHub
account and repository name filled in (`repo: OWNER/take3-website`).

## Publishing

The site is a set of plain files — no server, no database. It is set up to be
hosted on Vercel: connect the GitHub repository and Vercel builds and publishes
every change automatically. The domain then points at Vercel from GoDaddy.

## How it's put together

- `src/pages/` — one file per page.
- `src/layouts/Base.astro` — the shell every page shares: head tags, header,
  footer, dark/light toggle.
- `src/components/` — the header and footer.
- `src/styles/global.css` — the shared look: colours, type, nav, footer.
- `src/content/reviews/` and `src/data/` — the editable content.
- `public/uploads/` — photographs. `public/assets/` — the logo and client logos.
- `_design/` — the original design exports, kept for reference only. Nothing on
  the live site depends on them.

## Still to supply

- **Client logos** — the homepage logo wall expects images in
  `public/assets/logos/`. Until they're added the grid shows empty cells.
- **Roster photography** — the homepage category tiles and credit posters, and
  the Stand-ins hero, are showing labelled placeholders.

## Notes

- Every page carries the dark/light toggle and remembers the choice.
- Pages work on phones and tablets as well as desktop.
- Nothing loads from anywhere except Google Fonts, so the site stays fast.
