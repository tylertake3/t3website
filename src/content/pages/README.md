# Page copy

One JSON file per page. Every word a human might want to reword lives here, not
in the page templates, so it can be edited at `/admin` without touching code.

Conventions:

- File name matches the route: `index.json`, `dancers.json`, `models.json`,
  `spacts.json`, `stand-ins.json`, `what-is-a-spact.json`.
- Keys are grouped by the section they appear in (`hero`, `about`, `footer`, …)
  and named after what the words are, not where they sit visually.
- Repeated blocks (list items, cards, accordion rows, disciplines) are arrays of
  objects, so entries can be added, reordered or removed.
- Plain strings only — no HTML. Where a line must break in a specific place, use
  a `\n` in the string; the template renders it.
- SEO text (page title, description, share text) lives under `meta`.

Each page's fields are mirrored in `public/admin/config.yml` so they appear in
the editor with plain-English labels.
