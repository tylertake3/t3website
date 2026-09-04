/* Ingests the supplied poster artwork into public/posters and writes the
   manifest the homepage and credits page read. Source files live outside the
   repo, so this runs once by hand rather than on every build. */
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC = process.argv[2];
const OUT = new URL('../public/posters/', import.meta.url);
const MANIFEST = new URL('../src/data/posters.json', import.meta.url);

if (!SRC) {
  console.error('usage: node scripts/build-posters.mjs <source-dir>');
  process.exit(1);
}

const titleFromFile = (base) => {
  let t = base.replace(/\.(jpe?g|png|webp|avif)$/i, '');
  let season = null;
  const m = t.match(/\s+S(\d+)$/);
  if (m) { season = Number(m[1]); t = t.slice(0, m.index); }
  /* the export replaced characters the filesystem dislikes: "- " stood in for
     ": " and a trailing "-" for a question mark */
  t = t.replace(/-\s+/g, ': ').replace(/-$/, '?').trim();
  return { title: t, season };
};

const slugify = (s) =>
  s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const walk = async (dir) => {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) out.push(full);
  }
  return out;
};

await mkdir(OUT, { recursive: true });
const files = (await walk(SRC)).sort();
const posters = [];

for (const file of files) {
  /* the source folder also holds unrelated photography. Posters are portrait
     2:3 plates under about 1100px wide; anything else is skipped. */
  const meta = await sharp(file).metadata();
  const ratio = (meta.width ?? 0) / (meta.height ?? 1);
  if (!meta.width || meta.width > 1100 || ratio < 0.63 || ratio > 0.7) continue;

  const { title, season } = titleFromFile(path.basename(file));
  const slug = slugify(season ? `${title}-s${season}` : title);
  const outName = `${slug}.webp`;
  await sharp(file)
    .resize({ width: 500, withoutEnlargement: true })
    .webp({ quality: 74 })
    .toFile(path.join(new URL(OUT).pathname, outName));
  posters.push({ title, season, slug, src: `/posters/${outName}` });
}

posters.sort((a, b) => a.title.localeCompare(b.title) || (a.season ?? 0) - (b.season ?? 0));
await writeFile(new URL(MANIFEST), JSON.stringify({ posters }, null, 2) + '\n');
console.log(`wrote ${posters.length} posters`);
