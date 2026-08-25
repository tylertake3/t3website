# Take 3 Agency — website

Built from the Claude Design project "Take 3 Agency Website".

## How to look at it

Open `public/index.html` in your browser (double-click it). Everything works
straight from the folder — no setup, no server, no build step.

## What's here

| File | Page |
| --- | --- |
| `public/index.html` | Homepage (the "Productions" design) |
| `public/dancers.html` | Dancers |
| `public/models.html` | Models |
| `public/spacts.html` | SPACTs |
| `public/stand-ins.html` | Stand-ins & picture doubles |
| `public/what-is-a-spact.html` | "What is a SPACT?" explainer |

Photos live in `public/uploads/`, the logo in `public/assets/`.

`_design/` holds the original design files this was built from. It is reference
only — nothing on the live site depends on it, and it doesn't need publishing.

## Still to supply

- **Client logos** — the "Who we've supplied" grid on the homepage expects the
  logo images in `public/assets/logos/`. Until they're added, the grid shows as
  empty cells.
- **Roster photography** — the category tiles and credit posters on the
  homepage, the three Models photos, and the three Stand-ins photos are showing
  labelled placeholders. Drop real images in and they'll fill.

## Notes

- Every page carries the dark/light toggle, and the choice is remembered.
- Pages work on phones and tablets as well as desktop.
- Nothing loads from anywhere except Google Fonts, so the site is fast and
  will keep working with no maintenance.
