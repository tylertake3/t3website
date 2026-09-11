/* The deck of productions the slate cycles through when it is clapped.

   The title, studio and release come from what Take 3 has supplied; the camera
   columns are placeholder detail (see src/data/slate-deck.json). Artwork is
   resolved against the shared logo library so a logo is uploaded once and both
   the review bands and the slate pick it up. */
import { existsSync, openSync, readSync, closeSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import deckData from '../data/slate-deck.json';

export type SlateProduction = {
  key: string;
  title: string;
  release: string;
  studio: string;
  format: string;
  slate: string;
  roll: string;
  lens: string;
  stop: string;
  res: string;
  shutter: string;
  ct: string;
  ei: string;
  fps: string;
  unit: string;
  city: string;
};

/** A slate marked-up card, with the artwork already resolved to real files. */
export type SlateCard = SlateProduction & {
  /** Production logo in light ink, for the dark band at the foot of the board. */
  logo: string;
  /** How tall to draw that logo, in px. See logoHeight() below. */
  logoHeight: number;
  /** Studio mark in light ink, for the studio cell. */
  studioLogo: string;
};

const supplied = (path: string) => {
  const candidates = [
    resolve(process.cwd(), 'public' + path),
    fileURLToPath(new URL('../../public' + path, import.meta.url)),
  ];
  return candidates.some((candidate) => existsSync(candidate));
};

/* Each mark takes the cut that suits the surface it is printed on. The
   production title sits in the near-black band at the foot of the board, so it
   takes the light-ink cut (-c). The studio is printed in a cell on the white
   card, so it takes the dark-ink cut — the light one was invisible there. A
   mark that has not been uploaded falls back to its own name set in type,
   exactly as the client logo wall does. */
const productionArt = (key: string) => {
  const path = `/assets/production-logos/${key}-c.png`;
  return supplied(path) ? path : '';
};

const studioArt = (studio: string) => {
  for (const ext of ['svg', 'png']) {
    const path = `/assets/logos/${studio}.${ext}`;
    if (supplied(path)) return path;
  }
  return '';
};

/* Read a PNG's pixel size from its IHDR, which is always the first chunk. */
const pngSize = (path: string) => {
  try {
    const fd = openSync(path, 'r');
    const head = Buffer.alloc(24);
    readSync(fd, head, 0, 24, 0);
    closeSync(fd);
    if (head.toString('ascii', 1, 4) !== 'PNG') return null;
    return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
  } catch {
    return null;
  }
};

/* How tall to draw a production's logo.

   Every one of these files is 200px tall, so drawing them all to one height
   made them all the same height — which is not the same as making them look
   the same size. A single-line wordmark gets the full cap height; a stacked
   two-line lockup like Gangs of London or Deadpool & Wolverine splits it in
   half and reads much smaller.

   So the height comes from the aspect ratio, which is a good proxy for how
   stacked a lockup is: the flatter the artwork, the shorter it is drawn, so
   every mark ends up with roughly the same visual weight on the board. The
   constant is set so a wide wordmark lands near 54px, where they already
   looked right. */
const LOGO_WEIGHT = 112;
const LOGO_MIN = 46;
const LOGO_MAX = 90;

const logoHeight = (path: string) => {
  const size = path ? pngSize(resolve(process.cwd(), 'public' + path)) : null;
  if (!size || !size.height) return 60;
  const aspect = size.width / size.height;
  return Math.round(Math.min(LOGO_MAX, Math.max(LOGO_MIN, LOGO_WEIGHT / Math.sqrt(aspect))));
};

export const slateDeck: SlateCard[] = (deckData.productions as SlateProduction[]).map(
  (production) => ({
    ...production,
    logo: productionArt(production.key),
    logoHeight: logoHeight(productionArt(production.key)),
    studioLogo: studioArt(production.studio),
  }),
);
