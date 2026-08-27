/* Re-encode everything in public/uploads as WebP, capped at 2400px wide.
   Originals are moved to _originals/ (outside public/), so nothing is lost but
   nothing oversized is published. Run with: node scripts/optimise-images.mjs */
import { readdir, mkdir, rename, stat } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';

const UPLOADS = 'public/uploads';
const ARCHIVE = '_originals/uploads';
const MAX_WIDTH = 2400;
/* Full-bleed banner photos are the one place 2400px is not enough: the banner
   spans the whole window, so on a large desktop at 2x it needs ~5000px across.
   Files named *-wide are those letterbox banner versions and keep their width. */
const WIDE_SUFFIX = /-wide$/;
const WIDE_MAX_WIDTH = 4000;
const QUALITY = 78;
const CONVERTIBLE = new Set(['.png', '.jpg', '.jpeg', '.avif', '.webp']);

await mkdir(ARCHIVE, { recursive: true });

const files = await readdir(UPLOADS);
const renames = {};
let before = 0;
let after = 0;

for (const file of files) {
  const ext = extname(file).toLowerCase();
  if (!CONVERTIBLE.has(ext)) continue;

  const src = join(UPLOADS, file);
  const { size } = await stat(src);
  const target = `${basename(file, extname(file))}.webp`;
  const out = join(UPLOADS, target);

  const image = sharp(src, { failOn: 'none' });
  const meta = await image.metadata();
  const cap = WIDE_SUFFIX.test(basename(file, extname(file))) ? WIDE_MAX_WIDTH : MAX_WIDTH;
  const resized = meta.width > cap ? image.resize({ width: cap }) : image;
  const buffer = await resized.webp({ quality: QUALITY, effort: 5 }).toBuffer();

  /* keep the original if WebP somehow came out bigger */
  if (buffer.length >= size && ext === '.webp') continue;
  if (buffer.length >= size) {
    console.log(`skip  ${file} (webp would be larger)`);
    continue;
  }

  await sharp(buffer).toFile(out + '.tmp');
  await rename(out + '.tmp', out);
  if (file !== target) await rename(src, join(ARCHIVE, file));

  before += size;
  after += buffer.length;
  renames[file] = target;
  console.log(`${(size / 1024 / 1024).toFixed(2)}MB -> ${(buffer.length / 1024 / 1024).toFixed(2)}MB  ${target}`);
}

console.log(
  `\nTotal ${(before / 1024 / 1024).toFixed(1)}MB -> ${(after / 1024 / 1024).toFixed(1)}MB ` +
    `(${Math.round((1 - after / before) * 100)}% smaller across ${Object.keys(renames).length} images)`
);

const { writeFile } = await import('node:fs/promises');
await writeFile('/tmp/image-renames.json', JSON.stringify(renames, null, 2));
