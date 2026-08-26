/* Build the default social share image: a 1200x630 JPEG cropped from the hero
   photo. JPEG rather than WebP because LinkedIn's crawler is unreliable with
   WebP previews. Run with: node scripts/make-og-image.mjs */
import sharp from 'sharp';

const SRC = 'public/uploads/the-odyssey-beach-horse.webp';
const OUT = 'public/assets/og-default.jpg';

await sharp(SRC)
  .resize(1200, 630, { fit: 'cover', position: 'attention' })
  .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: '4:4:4' })
  .toFile(OUT);

const meta = await sharp(OUT).metadata();
const { size } = await (await import('node:fs/promises')).stat(OUT);
console.log(`${OUT} — ${meta.width}x${meta.height} ${meta.format}, ${(size / 1024).toFixed(0)}KB`);
