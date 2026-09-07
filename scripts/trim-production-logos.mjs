/* Trims the transparent padding off every production logo in
   public/assets/production-logos, so the file's dimensions describe the artwork
   itself rather than whatever canvas it was exported on.

   This matters because the review bands size each logo from its file: two logos
   exported at the same canvas height can carry wildly different amounts of ink
   (one filling the frame, one floating in the middle of it), which is why an
   untrimmed set looks so unevenly sized on the page. Once trimmed, the
   width-to-height ratio is honest and the page can scale each one to a matching
   optical size.

   Safe to re-run: an already-trimmed file has nothing left to remove.
   Run with: node scripts/trim-production-logos.mjs */
import { readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const DIR = 'public/assets/production-logos';

const files = (await readdir(DIR)).filter((f) => extname(f).toLowerCase() === '.png');

for (const file of files) {
  const path = join(DIR, file);
  const before = await sharp(path).metadata();
  /* Threshold keeps near-transparent anti-aliasing halos from counting as ink. */
  const buffer = await sharp(path)
    .trim({ threshold: 10 })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const after = await sharp(buffer).metadata();

  if (after.width === before.width && after.height === before.height) {
    console.log(`= ${file} ${before.width}x${before.height} (already trimmed)`);
    continue;
  }

  await sharp(buffer).toFile(path);
  console.log(`✓ ${file} ${before.width}x${before.height} -> ${after.width}x${after.height}`);
}
