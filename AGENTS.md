# Take 3 Agency site — working rules

Read this before changing anything.

## Design

- `DESIGN.md` is the source of truth for how the site looks. **Read it in full before adding or changing any page, section or component**, and build only from the tokens and patterns it describes.
- New inner pages start from the page cover + bands template (see DESIGN.md §5). Do not invent a bespoke layout, colour, font or spacing when a documented one exists.
- Reference CSS variables, never raw hex. Add a new variable to both themes in `src/styles/global.css` first if one is genuinely missing.
- Content (posters, clients, production logos, categories, reviews, page copy) lives in `src/data` and `src/content`; pages read from there rather than hard-coding it.
- Whenever you change a token, type size or core pattern, update `DESIGN.md` in the same change and bump its "Last updated" date.

## Before finishing

- Compare the new or changed page against an existing page of the same kind (e.g. another specialist page) in both themes and at phone width. If it does not match the guide, fix the page, not the guide — unless the guide is silent, in which case add the missing rule.
