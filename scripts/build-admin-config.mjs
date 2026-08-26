/* Assemble public/admin/config.yml — the settings the /admin editor reads.
   The page-text sections are generated from public/admin/_fragments/*.yml so
   they can never drift from the JSON files they describe. Runs before build.
   Run on its own with: node scripts/build-admin-config.mjs */
import { readFile, writeFile } from 'node:fs/promises';

const PAGES = ['index', 'artists', 'dancers', 'models', 'spacts', 'stand-ins', 'what-is-a-spact'];
const OUT = 'public/admin/config.yml';

const indent = (text, spaces) =>
  text
    .split('\n')
    .map((line) => (line.trim() ? ' '.repeat(spaces) + line : ''))
    .join('\n');

const head = await readFile('src/admin/config.head.yml', 'utf8');
const tail = await readFile('src/admin/config.tail.yml', 'utf8');

const fragments = [];
for (const page of PAGES) {
  const body = (await readFile(`public/admin/_fragments/${page}.yml`, 'utf8')).replace(/\n+$/, '');
  fragments.push(indent(body, 6));
}

const pagesCollection = ['  - name: pages', '    label: Page text', '    files:', ...fragments].join('\n');

const config = [
  '# GENERATED FILE — do not edit by hand.',
  '# Built by scripts/build-admin-config.mjs from src/admin/config.head.yml,',
  '# public/admin/_fragments/*.yml and src/admin/config.tail.yml.',
  '',
  head.replace(/^# [^\n]*\n(# [^\n]*\n)*/, '').trimStart(),
  '',
  pagesCollection,
  '',
  tail.trimEnd(),
  '',
].join('\n');

await writeFile(OUT, config);
console.log(`wrote ${OUT} (${config.split('\n').length} lines, ${PAGES.length} page fragments)`);
