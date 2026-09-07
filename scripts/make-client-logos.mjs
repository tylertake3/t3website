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
  '20th-century-fox', 'aldi', 'arsenal-fc', 'axa', 'canal-plus', 'chelsea-fc',
  'england-rugby', 'itv', 'marv', 'marvel-studios', 'mcdonalds', 'nhs',
  'nutella', 'pepsi', 'sega', 'sky', 'sony-pictures', 'studiocanal',
]);

/* Artwork delivered pale on a solid backdrop that is the artboard rather than
   part of the mark — Marv's dice sit on a black square nobody asked for. The
   backdrop is dropped, and what is left is read by where the artwork covers
   rather than by how dark it is, because after the drop the mark is white and
   reading darkness would find nothing at all. */
const PLATE = new Set(['marv']);

/* The backdrop itself: a rectangle, drawn as a <rect> or as a four-sided path,
   filling the whole frame. Only a shape that covers the frame qualifies — a
   panel behind part of a logo is left where it is. */
const dropBackdrop = (svg) => {
  const box = svg.match(/viewBox="([\d.\-\s,]+)"/i);
  if (!box) return svg;
  const [, , vw, vh] = box[1].trim().split(/[\s,]+/).map(Number);
  if (!vw || !vh) return svg;
  const covers = (w, h) => Math.abs(w) >= vw * 0.98 && Math.abs(h) >= vh * 0.98;

  let out = svg.replace(/<rect\b[^>]*\/?>/gi, (tag) => {
    const w = tag.match(/\bwidth="([\d.]+)"/i);
    const h = tag.match(/\bheight="([\d.]+)"/i);
    return w && h && covers(+w[1], +h[1]) ? '' : tag;
  });
  /* the same rectangle written as a path: move, across, down, back, close */
  out = out.replace(/<path\b[^>]*\bd="([^"]+)"[^>]*\/?>/gi, (tag, d) => {
    const rect = d.trim().match(/^m-?[\d.]+[\s,-]+-?[\d.]+h(-?[\d.]+)v(-?[\d.]+)h-?[\d.]+z$/i);
    return rect && covers(+rect[1], +rect[2]) ? '' : tag;
  });
  return out;
};

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

/* Where a drawing actually puts its ink, measured by rendering it. Everything
   the wall does with an SVG — how wide it is, how tall to make its cell,
   whether its frame needs pulling in — is decided from this rather than from
   the numbers in the file, which are frequently wrong. */
const inkBox = async (svg) => {
  const { data, info } = await sharp(Buffer.from(svg), { density: 200, limitInputPixels: false })
    .resize({ width: 600, height: 600, fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let left = info.width, top = info.height, right = -1, bottom = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels + 3] <= 10) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  if (right < left || bottom < top) return null;

  const width = right - left + 1;
  const height = bottom - top + 1;
  return {
    left, top, width, height,
    frameW: info.width, frameH: info.height,
    fills: Math.min(width / info.width, height / info.height),
    ratio: width / height,
  };
};

/* A width and height on the root that disagree with the viewBox — Michael Kors
   ships a 212×20 wordmark labelled 16×16. A browser sizing a background image
   believes the label, not the drawing, and fits the wordmark into a square
   where it lands as a speck. Dropping them lets the drawing speak for itself. */
const stripSize = (svg) =>
  /viewBox=/i.test(svg)
    ? svg.replace(/<svg\b[^>]*>/i, (tag) => tag.replace(/\s(width|height)=("[^"]*"|'[^']*')/gi, ''))
    : svg;

/* Pulls the frame in to meet the drawing. Brands export against all sorts of
   artboards — Represent fills under half of its frame, Rimowa barely half its
   height — and because the wall sizes each mark against its frame, that
   whitespace would show up as that brand being mysteriously smaller than its
   neighbours. The traced logos further down get this for free: cropping to
   their ink is part of being traced. */
const trimFrame = (svg, ink) => {
  const box = svg.match(/viewBox="([\d.\-\s,]+)"/i);
  if (!box || !ink) return svg;
  const [vx, vy, vw, vh] = box[1].trim().split(/[\s,]+/).map(Number);
  if (!vw || !vh) return svg;

  const round = (n) => Number(n.toFixed(3));
  const frame = [
    round(vx + (ink.left / ink.frameW) * vw),
    round(vy + (ink.top / ink.frameH) * vh),
    round((ink.width / ink.frameW) * vw),
    round((ink.height / ink.frameH) * vh),
  ].join(' ');
  return svg.replace(/viewBox="[\d.\-\s,]+"/i, `viewBox="${frame}"`);
};

const traced = [];
const logos = [];

for (const file of files) {
  const name = basename(file, extname(file));
  if (extname(file).toLowerCase() !== '.svg') { traced.push(file); continue; }

  const svg = readFileSync(file, 'utf8');
  /* An SVG that is really a photograph in a wrapper can't be repainted either. */
  if (svg.includes('<image') || KNOCKOUT.has(name)) { traced.push(file); continue; }

  const baseline = recolourSvg(svg, DARK_INK);
  const asDrawn = await inkBox(baseline);

  /* Tightening the frame is offered, not assumed. Artwork built out of clipped
     references — Barclays draws its wordmark through a clip path on an A4
     artboard — renders differently here than it does in a browser, and a frame
     computed from a rendering that disagrees would crop the logo to a couple of
     letters. So the tightened version is rendered too, and only kept if the
     mark still comes out the same shape and now fills its frame. Anything that
     fails the check keeps the frame it arrived with. */
  let chosen = baseline;
  let ratio = asDrawn ? asDrawn.ratio : null;
  if (asDrawn && asDrawn.fills < 0.98) {
    const candidate = trimFrame(stripSize(baseline), await inkBox(stripSize(baseline)));
    const trimmed = await inkBox(candidate);
    const sameShape = trimmed && Math.abs(trimmed.ratio - asDrawn.ratio) <= asDrawn.ratio * 0.04;
    if (trimmed && sameShape && trimmed.fills > 0.96) {
      chosen = candidate;
      ratio = trimmed.ratio;
    }
  }

  /* Brand SVGs arrive carrying editor cruft and unused clip paths — several
     times the weight of the drawing itself on a page that loads 72 of them. */
  const tidy = (source) => optimize(source, { multipass: true }).data;
  writeFileSync(join(OUT, `${name}.svg`), tidy(chosen));
  writeFileSync(join(OUT, `${name}-c.svg`), tidy(chosen.split(DARK_INK).join(LIGHT_INK)));

  logos.push({ name, ext: 'svg', ratio: ratio || 3 });
}

for (const file of traced) {
  const name = basename(file, extname(file));
  const isSvg = extname(file).toLowerCase() === '.svg';
  const onPlate = PLATE.has(name);
  const artwork = isSvg
    ? (onPlate ? dropBackdrop(readFileSync(file, 'utf8')) : readFileSync(file, 'utf8'))
    : null;
  const source = isSvg ? Buffer.from(artwork) : file;
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
    ink[p] = onPlate ? opacity : Math.round(opacity * Math.max(0, 1 - brightness));
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

/* One height per logo, worked back from its shape. Every mark gets one column
   and no more, so each row holds the same number of names and the wall keeps
   its grid — and every mark is drawn as large as that column will carry it,
   which is either the full width of the column or the full height of the row,
   whichever it runs out of first.

   TRACK is how wide a column is on the desktop wall, worked out from the
   stylesheet: the 1280px stack, less its 40px of padding either side, less the
   five 48px gaps between six columns. CAP is the row height. Keep the two in
   step with global.css — the numbers here decide how tall a mark is asked to
   be, and the stylesheet decides how much room it actually gets. */
const TRACK = 160;
const CAP = 56;
const clamp = (low, high, value) => Math.max(low, Math.min(high, Math.round(value)));
const rows = logos.map((logo) => ({
  height: clamp(15, CAP, TRACK / logo.ratio),
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
