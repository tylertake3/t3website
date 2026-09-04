/* Takes the built website and turns it into a folder of pages that open by
   double-clicking, with no internet connection and no web address involved —
   so the copy team can see the real design next to their review packs.

   Run:  npm run build && node scripts/make-offline-pages.mjs
   Out:  page-packs/live-pages/

   The built site expects to be served from a web address, so every link to a
   stylesheet, photo or other page starts with a "/". Opened straight off a hard
   drive that "/" means the top of the whole computer and nothing loads. This
   rewrites those links so they point at neighbouring files instead. */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const built = join(root, 'dist', 'client');
const outDir = join(root, 'page-packs', 'live-pages');

if (!existsSync(built)) {
  console.error('No build found. Run "npm run build" first.');
  process.exit(1);
}

/* Folders that make no sense offline: the editor needs a login, the sitemap and
   robots file are for search engines. */
const SKIP = new Set(['admin', 'robots.txt', 'sitemap-0.xml', 'sitemap-index.xml']);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const entry of readdirSync(built)) {
  if (SKIP.has(entry)) continue;
  cpSync(join(built, entry), join(outDir, entry), { recursive: true });
}

/* ------------------------------------------------------------- link rewriting */

const htmlFiles = [];
const walk = (dir) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e.endsWith('.html')) htmlFiles.push(p);
  }
};
walk(outDir);

/** Every page that exists, as the address the site uses for it. */
const routes = new Set(
  htmlFiles.map((f) => {
    const rel = relative(outDir, f).replace(/\\/g, '/');
    if (rel === 'index.html') return '/';
    return '/' + rel.replace(/\/index\.html$/, '').replace(/\.html$/, '');
  }),
);

let rewritten = 0;

for (const file of htmlFiles) {
  const depth = relative(outDir, file).split(/[\\/]/).length - 1;
  const up = depth === 0 ? './' : '../'.repeat(depth);
  let html = readFileSync(file, 'utf8');

  html = html.replace(/(href|src|content|srcset)="(\/[^"]*)"/g, (whole, attr, value) => {
    if (attr === 'srcset') {
      return `srcset="${value
        .split(',')
        .map((part) => {
          const [u, ...rest] = part.trim().split(/\s+/);
          return [u.startsWith('/') ? up + u.slice(1) : u, ...rest].join(' ');
        })
        .join(', ')}"`;
    }

    const clean = value.split('#')[0].split('?')[0].replace(/\/$/, '') || '/';

    /* A link to another page of the site: point it at that page's own file. */
    if (routes.has(clean)) {
      const target = clean === '/' ? 'index.html' : `${clean.slice(1)}/index.html`;
      const hash = value.includes('#') ? '#' + value.split('#')[1] : '';
      return `${attr}="${up}${target}${hash}"`;
    }

    /* A page we did not build (the editor, or a form handler): leave it dead
       rather than pointing it somewhere wrong. */
    if (!/\.[a-z0-9]{2,5}(\?|#|$)/i.test(value)) return `${attr}="#"`;

    /* A file — stylesheet, script, photo, font. */
    return `${attr}="${up}${value.slice(1)}"`;
  });

  writeFileSync(file, html);
  rewritten += 1;
}

/* ------------------------------------------------- a front door for the folder */

const pageList = [...routes]
  .filter((r) => r !== '/404')
  .sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)))
  .map((r) => ({
    route: r,
    file: r === '/' ? 'index.html' : `${r.slice(1)}/index.html`,
    name: r === '/' ? 'Homepage' : r.slice(1).replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()),
  }));

const front = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Take 3 — the real pages</title>
<style>
  body { font: 16px/1.6 -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color:#111;
         max-width: 42rem; margin: 3rem auto; padding: 0 1.5rem; }
  h1 { font-size: 2rem; margin: 0 0 .5rem; letter-spacing:-.02em; }
  p { color:#444; }
  ul { list-style:none; padding:0; margin: 1.5rem 0 0; }
  li { border-bottom:1px solid #eee; }
  a { display:flex; justify-content:space-between; gap:1rem; padding:.7rem .2rem;
      text-decoration:none; color:#111; }
  a:hover { background:#fafafa; }
  span { color:#999; font-size:.86rem; }
  .note { background:#fbfbfb; border:1px solid #eee; padding:.9rem 1.1rem; border-radius:6px;
          font-size:.93rem; margin-top:1.5rem; }
</style></head><body>
<h1>The real pages</h1>
<p>Exactly what the website looks like today. Click a page, look at it beside its review pack,
and note anything you would change.</p>
<div class="note">These are working copies saved onto your computer — you can open them with no
internet connection, and nothing you click here can change the real website. The enquiry forms
will not send anything, and a few links are switched off.</div>
<ul>
${pageList.map((p) => `  <li><a href="${p.file}">${p.name}<span>${p.route}</span></a></li>`).join('\n')}
</ul>
</body></html>`;

writeFileSync(join(outDir, 'browse.html'), front);

console.log(`Wrote ${pageList.length} pages to page-packs/live-pages/ (${rewritten} files relinked)`);
