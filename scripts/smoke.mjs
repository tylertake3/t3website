/* Checks the PUBLISHED site — the thing visitors actually get.
   The build can be perfect and the live site still be broken by hosting
   settings, which is exactly what happened when every page but the homepage
   started returning "not found" in production.

   Run with: node scripts/smoke.mjs https://www.take3agency.com          */

const base = (process.argv[2] || 'https://t3website-take-3.vercel.app').replace(/\/$/, '');

const ROUTES = ['/', '/dancers', '/models', '/spacts', '/stand-ins', '/what-is-a-spact'];
const FILES = ['/robots.txt', '/sitemap-index.xml'];

const problems = [];
const ok = [];

async function check(path, { expect = 200, contains = null } = {}) {
  const url = base + path;
  let res;
  try {
    res = await fetch(url, { redirect: 'manual' });
  } catch (err) {
    problems.push(`${path} — could not be reached (${err.message})`);
    return;
  }

  /* a redirect to the same page with/without a slash is fine, follow it once */
  if (res.status >= 300 && res.status < 400) {
    const to = res.headers.get('location');
    try {
      res = await fetch(new URL(to, url).toString());
    } catch (err) {
      problems.push(`${path} — redirects to ${to}, which failed (${err.message})`);
      return;
    }
  }

  if (res.status !== expect) {
    problems.push(`${path} — returned ${res.status}, expected ${expect}`);
    return;
  }

  if (contains) {
    const body = await res.text();
    if (!body.includes(contains)) {
      problems.push(`${path} — loaded but "${contains}" is missing from the page`);
      return;
    }
  }
  ok.push(path);
}

console.log(`Checking ${base}\n`);

for (const route of ROUTES) await check(route, { contains: '<title>' });
for (const file of FILES) await check(file);

/* an address that shouldn't exist must say so, not quietly serve something */
await check('/this-page-does-not-exist', { expect: 404 });

/* the editor must be reachable, or nobody can update the site */
await check('/admin/', { contains: '<script' });

for (const path of ok) console.log(`  ok    ${path}`);

if (problems.length) {
  console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'} with the live site:\n`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error('');
  process.exit(1);
}

console.log(`\nAll ${ok.length} checks passed.`);
