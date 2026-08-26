/* Warns when the site would build here but not anywhere else.

   Twice now a page has been committed while the file it reads was left behind,
   so it worked on one machine and every deployment failed. This looks for
   anything the site is built from that has been changed or created but not
   committed.

   Run with: node scripts/check-committed.mjs        */
import { execSync } from 'node:child_process';

const WATCHED = ['src/', 'public/', 'scripts/', 'astro.config.mjs', 'package.json'];

const status = execSync('git status --porcelain', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .map((line) => ({ state: line.slice(0, 2).trim(), path: line.slice(3).replace(/^"|"$/g, '') }))
  .filter(({ path }) => WATCHED.some((dir) => path.startsWith(dir)));

if (!status.length) {
  console.log('Everything the site is built from is committed.');
  process.exit(0);
}

const untracked = status.filter((f) => f.state === '??');
const changed = status.filter((f) => f.state !== '??');

console.error('\nThese are part of the site but are not committed, so a fresh checkout');
console.error('would build something different from what you see here:\n');
for (const f of untracked) console.error(`  new     ${f.path}`);
for (const f of changed) console.error(`  changed ${f.path}`);
console.error('\nCommit them, or check they genuinely belong to someone else’s work.\n');
process.exit(1);
