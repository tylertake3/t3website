import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pagesDir = fileURLToPath(new URL('../pages', import.meta.url));

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
