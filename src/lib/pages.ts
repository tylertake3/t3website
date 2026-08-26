import { existsSync } from 'node:fs';
import { join } from 'node:path';

/* Resolved from the project root, not from this module's own URL: during a
   production build this file is bundled into dist/.prerender/chunks/, so a
   relative lookup pointed at a folder that does not exist and every menu
   entry silently disappeared from the built site. */
const pagesDir = join(process.cwd(), 'src', 'pages');

/** True when a route has a page behind it, checked at build time.
 *
 *  Reads the filesystem on purpose: import.meta.glob over the pages folder
 *  would pull every page into the importing component's module graph, and
 *  Astro would then ship all their stylesheets on every page. */
export function pageExists(href: string): boolean {
  const slug = href.replace(/^\//, '').replace(/[#?].*$/, '');
  if (!slug) return existsSync(join(pagesDir, 'index.astro'));
  return existsSync(join(pagesDir, `${slug}.astro`)) || existsSync(join(pagesDir, slug, 'index.astro'));
}
