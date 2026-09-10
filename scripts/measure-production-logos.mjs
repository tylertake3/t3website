/* Measures every production logo and writes the size each should be drawn at
   into src/data/production-logo-sizes.json, which the review bands read.

   Sizes come from the shared optical rule in scripts/lib/optical-size.mjs:
   each logo is scaled so the ink it puts on the page matches its neighbours',
   so a dense stacked title and a long thin wordmark sit at the same visual
   weight beside a quote. Run it after adding or replacing a logo (and after
   scripts/trim-production-logos.mjs, so shapes are measured from the artwork
   rather than its export padding):

     node scripts/measure-production-logos.mjs */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { measureLogo, opticalSize } from './lib/optical-size.mjs';

const DIR = 'public/assets/production-logos';
const OUT = 'src/data/production-logo-sizes.json';

/* The room a logo has beside a review. */
const SLOT = { area: 3600, minHeight: 18, maxHeight: 48, maxWidth: 215 };

const files = (await readdir(DIR)).filter((f) => extname(f).toLowerCase() === '.png').sort();
const sizes = {};
for (const file of files) {
  const measured = await measureLogo(await readFile(join(DIR, file)));
  if (!measured) continue;
  const { width, height } = opticalSize(measured, SLOT);
  sizes[`/assets/production-logos/${file}`] = { width, height };
  console.log(`${file}: ${width}x${height}`);
}
await writeFile(OUT, JSON.stringify(sizes, null, 2) + '\n');
console.log(`${Object.keys(sizes).length} sizes written to ${OUT}`);
