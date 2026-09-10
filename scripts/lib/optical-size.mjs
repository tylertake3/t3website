/* How big to draw a logo so it looks the same size as the logos around it.

   Two marks drawn at the same height rarely look the same size: a heavy
   wordmark like hulu or HBO is a slab of ink, while a thin serif wordmark or
   a delicate crest is mostly air. Even matching their footprint (width x
   height) leaves the heavy ones looking bigger, because the eye weighs ink,
   not the invisible box around it.

   So every logo is measured by rendering it: its shape (width-to-height
   ratio) and how densely it fills that shape with ink. It is then scaled so
   that the ink it puts on the page comes out roughly equal to every other
   logo's — dense marks are drawn smaller, airy ones larger — within limits
   that keep the very longest wordmarks from running away with a row and the
   squarest badges from towering over it.

   Density is only partly counted (DENSITY_WEIGHT below): a purely ink-based
   rule would blow a hairline wordmark up to fill its whole cell, which reads
   as "too big" in its own way. Half-way between footprint and ink is where
   the wall settles down. */
import sharp from 'sharp';

const DENSITY_WEIGHT = 0.5;

/* Renders any logo file (SVG or PNG) and reads its shape and ink density.
   Density is alpha-weighted, so anti-aliased edges count for what they show. */
export async function measureLogo(input) {
  const { data, info } = await sharp(input, { density: 200, limitInputPixels: false })
    .resize({ width: 600, height: 600, fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let left = info.width, top = info.height, right = -1, bottom = -1;
  let ink = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const a = data[(y * info.width + x) * info.channels + 3];
      if (a <= 10) continue;
      ink += a / 255;
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
    ratio: width / height,
    density: Math.min(1, ink / (width * height)),
  };
}

/* The drawn size, in px, for a mark of the given shape and density.

   `area` is the footprint (in px²) a mark of average density should occupy;
   the caps are the room the layout gives it. When a cap bites, the other
   dimension follows so the mark keeps its shape. */
export function opticalSize({ ratio, density }, { area, minHeight, maxHeight, maxWidth }) {
  const weight = ratio * Math.pow(Math.max(density, 0.05), DENSITY_WEIGHT);
  let height = Math.sqrt(area / weight);
  height = Math.min(maxHeight, Math.max(minHeight, height));
  let width = height * ratio;
  if (width > maxWidth) {
    width = maxWidth;
    height = width / ratio;
  }
  return { width: Math.round(width), height: Math.round(height) };
}
