/* Checks the built site in dist/ before it can be published.
   Catches the things that have actually broken this site before: a page that
   didn't get built, a link pointing at a page that no longer exists, a photo
   whose filename changed, a missing description, an image heavy enough to hurt
   on mobile.

   Run with: node scripts/check-build.mjs        */
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIST = 'dist';
const MAX_IMAGE_BYTES = 900 * 1024;

/* Every page a visitor can reach. Add new pages here so a missing build fails. */
const EXPECTED_PAGES = [
  'index.html',
  'dancers.html',
  'models.html',
  'spacts.html',
  'stand-ins.html',
  'what-is-a-spact.html',
  '404.html',
];

const EXPECTED_FILES = ['robots.txt', 'sitemap-index.xml'];

const problems = [];
const note = (msg) => problems.push(msg);

if (!existsSync(DIST)) {
  console.error('No dist/ folder — run `npx astro build` first.');
  process.exit(1);
}

/* ---------- every expected page and file was built ---------- */
for (const page of EXPECTED_PAGES) {
  if (!existsSync(join(DIST, page))) note(`page missing from the build: ${page}`);
}
for (const file of EXPECTED_FILES) {
  if (!existsSync(join(DIST, file))) note(`file missing from the build: ${file}`);
}

/* ---------- walk the built HTML ---------- */
async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
}

const allFiles = await walk(DIST);
const htmlFiles = allFiles.filter((f) => f.endsWith('.html') && !f.includes('/admin/'));

/* a route like /dancers must resolve to dancers.html in the build */
const routeExists = (route) => {
  const clean = route.split('#')[0].split('?')[0].replace(/\/$/, '');
  if (clean === '' || clean === '/') return existsSync(join(DIST, 'index.html'));
  const rel = clean.replace(/^\//, '');
  return (
    existsSync(join(DIST, rel)) ||
    existsSync(join(DIST, `${rel}.html`)) ||
    existsSync(join(DIST, rel, 'index.html'))
  );
};

const decodePath = (p) => {
  try {
    return decodeURIComponent(p);
  } catch {
    return p;
  }
};

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const page = file.replace(`${DIST}/`, '');

  /* --- internal links point somewhere real --- */
  for (const m of html.matchAll(/href="(\/[^"#][^"]*)"/g)) {
    const href = m[1];
    if (href.startsWith('//')) continue;
    if (/\.(css|js|svg|xml|txt|webp|jpe?g|png|avif|ico)$/i.test(href)) {
      if (!existsSync(join(DIST, decodePath(href)))) note(`${page}: links to a missing file ${href}`);
      continue;
    }
    if (!routeExists(href)) note(`${page}: links to a page that doesn't exist ${href}`);
  }

  /* --- images and background images resolve --- */
  const refs = [
    ...[...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/background-image:\s*url\(&quot;([^&]+)&quot;\)/g)].map((m) => m[1]),
    ...[...html.matchAll(/background-image:\s*url\("([^"]+)"\)/g)].map((m) => m[1]),
    ...[...html.matchAll(/data-(?:light|dark)="(\/[^"]+)"/g)].map((m) => m[1]),
  ];
  for (const ref of refs) {
    if (!ref.startsWith('/') || ref.startsWith('//')) continue;
    if (!existsSync(join(DIST, decodePath(ref)))) note(`${page}: image not found ${ref}`);
  }

  /* --- a page must not load another page's stylesheet ---
     One page's styles landing on another silently rearranges the layout, which
     is exactly how the homepage hero once got the Models page's grid. */
  const pageName = page.replace(/\.html$/, '');
  for (const m of html.matchAll(/href="\/_astro\/([^".]+)\.[^".]+\.css"/g)) {
    const styleOwner = m[1];
    const shared = ['Base', 'index'];
    if (shared.includes(styleOwner)) continue;
    if (styleOwner !== pageName) {
      note(`${page}: is loading ${styleOwner}'s stylesheet, which will fight its own layout`);
    }
  }

  /* --- the basics search engines need --- */
  if (!/<title>[^<]{5,}<\/title>/.test(html)) note(`${page}: no page title`);
  if (!/<meta name="description" content="[^"]{20,}"/.test(html)) note(`${page}: no description`);
  if (!/<meta property="og:image"/.test(html)) note(`${page}: no share image`);

  /* --- every image should describe itself --- */
  for (const m of html.matchAll(/<img(?![^>]*\balt=)[^>]*>/g)) {
    note(`${page}: image with no alt text — ${m[0].slice(0, 90)}`);
  }
}

/* ---------- nothing published is too heavy for a phone ---------- */
for (const file of allFiles) {
  if (!/\.(webp|jpe?g|png|avif|gif)$/i.test(extname(file))) continue;
  const { size } = await stat(file);
  if (size > MAX_IMAGE_BYTES) {
    note(`${file.replace(`${DIST}/`, '')} is ${(size / 1024 / 1024).toFixed(1)}MB — too heavy to publish`);
  }
}

/* ---------- report ---------- */
if (problems.length) {
  console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'} found:\n`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error('');
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} pages: links, images, alt text, titles and file sizes all fine.`);
