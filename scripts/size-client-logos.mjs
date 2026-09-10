/* Re-measures every logo on the client wall and writes a fresh height for each
   into src/data/clients.json, so the marks read as the same size at a glance.

   Runs against the finished files in public/assets/logos, so it can be re-run
   on its own whenever a logo is swapped without rebuilding the whole wall from
   the masters (which scripts/make-client-logos.mjs does, using the same rule).

     node scripts/size-client-logos.mjs

   The cell on the desktop wall is 160px wide by 56px tall — keep CELL in step
   with .logoPage in src/styles/global.css. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { measureLogo, opticalSize } from './lib/optical-size.mjs';

export const CELL = { area: 3000, minHeight: 15, maxHeight: 56, maxWidth: 160 };

const DATA = 'src/data/clients.json';

export async function clientHeight(file) {
  const measured = await measureLogo(readFileSync(file));
  if (!measured) return null;
  return opticalSize(measured, CELL).height;
}

if (process.argv[1]?.endsWith('size-client-logos.mjs')) {
  const data = JSON.parse(readFileSync(DATA, 'utf8'));
  let changed = 0;
  for (const cell of data.clients) {
    const file = 'public' + (cell.dark ?? '');
    if (!cell.dark || !existsSync(file)) continue;
    const height = await clientHeight(file);
    if (height && height !== cell.height) {
      console.log(`${cell.dark.split('/').pop()}: ${cell.height} -> ${height}`);
      cell.height = height;
      changed++;
    }
  }
  writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
  console.log(`${changed} heights changed in ${DATA}`);
}
