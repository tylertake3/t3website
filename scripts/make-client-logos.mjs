/* Builds the client logo wall from the brand artwork in _design/client-logo-masters.

   Brands supply their logos in their own colours, which is no use on a wall
   where the point is the roster rather than any one brand's palette. Every mark
   is redrawn in a single ink, twice: once dark for the cream site, once light
   for the dark site. The dark-site version carries a "-c" suffix, matching the
   production logos.

   It also rewrites src/data/clients.json so every mark that exists is on the
   wall, at a height worked back from its own proportions.

     node scripts/make-client-logos.mjs

   Re-run it after dropping new artwork into _design/client-logo-masters. Files
   are named after the brand — burberry.svg becomes burberry.svg and
   burberry-c.svg — so replacing one file replaces that one logo. */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import sharp from 'sharp';
import { optimize } from 'svgo';

const SRC = '_design/client-logo-masters';
const OUT = 'public/assets/logos';
const DATA = 'src/data/clients.json';

const DARK_INK = '#1a1a1c'; // the mark as it appears on the cream site
const LIGHT_INK = '#f4f2ee'; // the mark as it appears on the dark site

/* Logos drawn as a coloured plate with the mark knocked out of it — ITV's blue
   box, the McDonald's red square. Repainting every shape one ink turns those
   into a solid block with the mark gone, so they are traced from their artwork
   instead: the plate becomes ink and the mark stays the gap it always was. */
const KNOCKOUT = new Set([
  '20th-century-fox', 'aldi', 'chelsea-fc', 'england-rugby', 'itv',
  'marvel-studios', 'mcdonalds', 'nutella', 'pepsi', 'sky', 'sony-pictures',
]);

if (!existsSync(SRC)) {
  console.error(`No artwork found at ${SRC}`);
  process.exit(1);
}
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const files = readdirSync(SRC)
  .filter((f) => ['.svg', '.png', '.jpg', '.jpeg'].includes(extname(f).toLowerCase()))
  .sort()
  .map((f) => join(SRC, f));

/* Strips every colour the artwork was drawn with and repaints from the root, so
   one ink is inherited by every shape. "none" is left alone: it marks the holes
   in a letterform and the shapes that were never meant to be filled. */
const recolourSvg = (svg, ink) => {
  let out = svg;
  out = out.replace(/\s(fill|stroke)="(?!none")[^"]*"/gi, '');
  out = out.replace(/\s(fill|stroke)='(?!none')[^']*'/gi, '');
  out = out.replace(/(style="[^"]*")/gi, (m) =>
    m.replace(/(^|[;"\s])(fill|stroke)\s*:\s*(?!none)[^;"]*/gi, '$1'));
  /* A group set to fill="none" is a container default the shapes inside it were
     overriding with their own colour. Now that those colours are gone the group
     would win and the whole logo would vanish, so containers lose it too — only
     a shape keeps "none", where it really does mean an empty counter. */
  out = out.replace(/<g\b[^>]*>/gi, (tag) => tag.replace(/\sfill=("none"|'none')/gi, ''));
  /* colours declared in a stylesheet inside the file rather than on the shapes */
  out = out.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, (block) =>
    block.replace(/\b(fill|stroke)\s*:\s*(?!none)[^;}"']+/gi, `$1:${ink}`));
  out = out.replace(/<svg\b[^>]*>/i, (tag) =>
    tag
      .replace(/\s(fill|stroke)=("[^"]*"|'[^']*')/gi, '')
      .replace(/<svg\b/i, `<svg fill="${ink}" stroke="none"`));
  return out;
};

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

const traced = [];
const logos = [];

for (const file of files) {
  const name = basename(file, extname(file));
  if (extname(file).toLowerCase() !== '.svg') { traced.push(file); continue; }

  const svg = readFileSync(file, 'utf8');
  /* An SVG that is really a photograph in a wrapper can't be repainted either. */
  if (svg.includes('<image') || KNOCKOUT.has(name)) { traced.push(file); continue; }

  /* Brand SVGs arrive carrying editor cruft and unused clip paths — several
     times the weight of the drawing itself on a page that loads 72 of them. */
  const tidy = (ink) => optimize(recolourSvg(svg, ink), { multipass: true }).data;
  writeFileSync(join(OUT, `${name}.svg`), tidy(DARK_INK));
  writeFileSync(join(OUT, `${name}-c.svg`), tidy(LIGHT_INK));

  const viewBox = svg.match(/viewBox="([\d.\-\s,]+)"/i);
  let ratio = null;
  if (viewBox) {
    const n = viewBox[1].trim().split(/[\s,]+/).map(Number);
    if (n[3]) ratio = n[2] / n[3];
  }
  if (!ratio) {
    const w = svg.match(/width="([\d.]+)/i);
    const h = svg.match(/height="([\d.]+)/i);
    if (w && h) ratio = Number(w[1]) / Number(h[1]);
  }
  logos.push({ name, ext: 'svg', ratio: ratio || 3 });
}

for (const file of traced) {
  const name = basename(file, extname(file));
  const isSvg = extname(file).toLowerCase() === '.svg';
  const source = isSvg ? Buffer.from(readFileSync(file, 'utf8')) : file;
  const flattened = await sharp(source, { density: 400, limitInputPixels: false }).png().toBuffer();
  const meta = await sharp(flattened).metadata();
  const { data, info } = await sharp(flattened)
    .resize({ width: Math.min(1200, meta.width * 4), fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  /* How much ink each pixel is worth: the darker and more solid it was, the
     more of the mark it carries. White stays empty, which is what turns a
     knocked-out letterform back into a hole. */
  const ink = Buffer.alloc(info.width * info.height);
  for (let i = 0, p = 0; i < data.length; i += info.channels, p++) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const opacity = info.channels === 4 ? data[i + 3] : 255;
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    ink[p] = Math.round(opacity * Math.max(0, 1 - brightness));
  }

  /* Anything that was clearly artwork goes to full strength and anything that
     was clearly paper goes to nothing, with a narrow ramp between the two to
     keep edges smooth. Without this a mid-red plate like the McDonald's square
     comes out as a grey wash instead of a solid mark. */
  const curve = new Uint8Array(256);
  for (let v = 0; v < 256; v++) {
    const t = Math.min(1, Math.max(0, (v / 255 - 0.28) / 0.18));
    curve[v] = Math.round(255 * t * t * (3 - 2 * t));
  }
  for (let p = 0; p < ink.length; p++) ink[p] = curve[ink[p]];

  /* Crop away the margin the source happened to be drawn with, so every mark
     fills its cell instead of floating small inside a box of nothing. */
  let left = info.width, top = info.height, right = -1, bottom = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (ink[y * info.width + x] <= 8) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  const box = right >= left && bottom >= top
    ? { x: left, y: top, w: right - left + 1, h: bottom - top + 1 }
    : { x: 0, y: 0, w: info.width, h: info.height };

  for (const [suffix, colour] of [['', DARK_INK], ['-c', LIGHT_INK]]) {
    const [r, g, b] = hexToRgb(colour);
    const pixels = Buffer.alloc(box.w * box.h * 4);
    for (let y = 0; y < box.h; y++) {
      for (let x = 0; x < box.w; x++) {
        const p = (y * box.w + x) * 4;
        pixels[p] = r;
        pixels[p + 1] = g;
        pixels[p + 2] = b;
        pixels[p + 3] = ink[(y + box.y) * info.width + (x + box.x)];
      }
    }
    /* Traced at high resolution for a clean edge, then written out at the size
       the wall actually needs — no cell is ever wider than 200px. */
    await sharp(pixels, { raw: { width: box.w, height: box.h, channels: 4 } })
      .resize({ width: Math.min(600, box.w), fit: 'inside' })
      .png({ compressionLevel: 9 })
      .toFile(join(OUT, `${name}${suffix}.png`));
  }
  logos.push({ name, ext: 'png', ratio: box.w / box.h });
}

logos.sort((a, b) => a.name.localeCompare(b.name));

/* One height per logo, worked back from its shape, so a wide wordmark and a
   square mark carry the same weight on the wall. */
const heightFor = (ratio) => Math.max(26, Math.min(58, Math.round(150 / ratio)));
const rows = logos.map((logo) => ({
  height: heightFor(logo.ratio),
  light: `/assets/logos/${logo.name}.${logo.ext}`,
  dark: `/assets/logos/${logo.name}-c.${logo.ext}`,
}));

/* Dealt alternately into the two halves the homepage wall fades between, so
   neither half is all one kind of name. */
const clients = [
  ...rows.filter((_, i) => i % 2 === 0),
  ...rows.filter((_, i) => i % 2 === 1),
];
writeFileSync(DATA, JSON.stringify({ clients }, null, 2) + '\n');

console.log(`${logos.length} client logos written to ${OUT}, ${DATA} rebuilt`);
