/* Matches the productions named in a review's credits line against the shared
   logo library in src/data/production-logos.json, so a logo is uploaded once
   per production and every review that mentions it picks it up automatically.

   Titles are matched as substrings rather than by splitting the credits line on
   commas and ampersands: "Deadpool & Wolverine" is one production, and no split
   rule can tell that apart from "Vison & Slow Horses". Longest titles are
   matched first so "The Witcher" can never swallow a longer title containing it. */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import logoData from '../data/production-logos.json';
import measuredSizes from '../data/production-logo-sizes.json';

/* Two versions per production: light ink for the dark review bands, dark ink for
   anywhere a logo sits on the cream background. */
export type LogoEntry = {
  title: string;
  logoOnDark?: string;
  logoOnLight?: string;
  aliases?: string;
};
export type CreditItem = {
  title: string;
  onDark?: string;
  onLight?: string;
  /* The size the artwork should be drawn at, in px, so every production reads at
     a matching weight beside a review. See opticalSize below. */
  logoWidth?: number;
  logoHeight?: number;
};

/* A logo referenced in the library but not yet uploaded renders as its title in
   type instead of firing a 404 for artwork that isn't there — the same rule the
   client logo wall follows. */
/* Checked against the project root rather than this module's own location: once
   Astro bundles the site this file no longer sits in src/lib, so a path built
   from import.meta.url points at the build output and every logo reads as
   missing. Both roots are tried so the check also holds in dev. */
const fileSupplied = (path?: string) => {
  if (!path) return false;
  const candidates = [
    resolve(process.cwd(), 'public' + path),
    fileURLToPath(new URL('../../public' + path, import.meta.url)),
  ];
  return candidates.some((candidate) => existsSync(candidate));
};

/* The first file that exists for a given path, so measurements and the
   existence check agree on which copy on disk they are talking about. */
const locate = (path?: string) => {
  if (!path) return undefined;
  const candidates = [
    resolve(process.cwd(), 'public' + path),
    fileURLToPath(new URL('../../public' + path, import.meta.url)),
  ];
  return candidates.find((candidate) => existsSync(candidate));
};

/* Reads a PNG's own width and height straight out of its header — no image
   library needed, and only the first 24 bytes are ever looked at. */
const pngSize = (file: string): { width: number; height: number } | null => {
  try {
    const head = readFileSync(file).subarray(0, 24);
    if (head.length < 24 || head.readUInt32BE(0) !== 0x89504e47) return null;
    return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
  } catch {
    return null;
  }
};

/* Production logos are wildly different shapes: a tall stacked mark next to a
   long single-line wordmark, a slab of heavy type next to a hairline one.
   Drawing them all at one height makes the long ones tower over the page and
   the compact ones look lost, so each is drawn at the size that puts roughly
   the same amount of ink on the page as its neighbours.

   Those sizes are measured ahead of time by scripts/measure-production-logos.mjs
   (which renders every logo and reads its shape and ink density) and kept in
   src/data/production-logo-sizes.json. A logo that hasn't been measured yet —
   one just dropped in — falls back to matching footprint from its PNG header,
   so it still lands at a sensible size until the script is re-run. */
const TARGET_AREA = 3600;
const MIN_HEIGHT = 18;
const MAX_HEIGHT = 48;
const MAX_WIDTH = 215;

const measured: Record<string, { width: number; height: number }> = measuredSizes;

const sizeCache = new Map<string, { logoWidth: number; logoHeight: number } | undefined>();

const opticalSize = (path?: string) => {
  if (!path) return undefined;
  if (sizeCache.has(path)) return sizeCache.get(path);

  let result: { logoWidth: number; logoHeight: number } | undefined;
  const known = measured[path];
  if (known) {
    result = { logoWidth: known.width, logoHeight: known.height };
  } else {
    const file = locate(path);
    const size = file ? pngSize(file) : null;
    if (size && size.width > 0 && size.height > 0) {
      const ratio = size.width / size.height;
      let height = Math.sqrt(TARGET_AREA / ratio);
      height = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, height));
      let width = height * ratio;
      if (width > MAX_WIDTH) {
        width = MAX_WIDTH;
        height = width / ratio;
      }
      result = { logoWidth: Math.round(width), logoHeight: Math.round(height) };
    }
  }

  sizeCache.set(path, result);
  return result;
};

const library: LogoEntry[] = (logoData.logos ?? []) as LogoEntry[];

/** Every name that should resolve to a given entry: its title plus any aliases. */
const namesFor = (entry: LogoEntry) =>
  [entry.title, ...(entry.aliases ?? '').split(',')].map((n) => n.trim()).filter(Boolean);

/* Leftover fragments that aren't productions: season markers, stray joining
   words, and anything too short to be a title. */
const isNoise = (text: string) => text.length < 3 || /^s\d/i.test(text) || /^(and|the)$/i.test(text);

/**
 * Turns a credits string into the ordered list of productions to display.
 * Each item carries a logo path when one has been uploaded, and nothing when it
 * hasn't — the caller decides how an item without artwork should look.
 */
export function resolveCredits(credits: string | undefined): CreditItem[] {
  const text = (credits ?? '').trim();
  if (!text) return [];

  const candidates = library
    .flatMap((entry) => namesFor(entry).map((name) => ({ name, entry })))
    .sort((a, b) => b.name.length - a.name.length);

  const taken: Array<{ start: number; end: number; entry: LogoEntry }> = [];
  const overlaps = (start: number, end: number) =>
    taken.some((t) => start < t.end && end > t.start);

  const haystack = text.toLowerCase();
  for (const { name, entry } of candidates) {
    if (taken.some((t) => t.entry === entry)) continue;
    const start = haystack.indexOf(name.toLowerCase());
    if (start === -1) continue;
    const end = start + name.length;
    if (overlaps(start, end)) continue;
    taken.push({ start, end, entry });
  }

  taken.sort((a, b) => a.start - b.start);

  const matched: CreditItem[] = taken.map(({ entry }) => {
    const onDark = fileSupplied(entry.logoOnDark) ? entry.logoOnDark : undefined;
    const onLight = fileSupplied(entry.logoOnLight) ? entry.logoOnLight : undefined;
    return {
      title: entry.title,
      onDark,
      onLight,
      ...(opticalSize(onDark ?? onLight) ?? {}),
    };
  });

  /* Anything the library doesn't know about yet still gets named, so a new
     production appears on the page the moment it is typed into a review. */
  let remainder = text;
  for (const { start, end } of [...taken].reverse()) {
    remainder = remainder.slice(0, start) + '|' + remainder.slice(end);
  }
  const extras = remainder
    .split(/[|,&]/)
    .map((part) => part.trim().replace(/^[-–—]+|[-–—]+$/g, '').trim())
    .filter((part) => part && !isNoise(part))
    .map((title) => ({ title }));

  return [...matched, ...extras];
}

/**
 * The single production shown alongside a review.
 *
 * A review names up to four productions, but the section reads far better with
 * one strong logo than with a row of them, so only one is shown.
 *
 * `feature` is the reviewer's own override, set per review in the editor:
 *   - a production name — show that one, whatever order it appears in
 *   - "none"            — show nothing at all for this review
 *   - empty             — the first production that has artwork, or nothing
 */
export function featuredCredit(
  credits: string | undefined,
  feature?: string,
): CreditItem | null {
  const wanted = (feature ?? '').trim();
  if (wanted.toLowerCase() === 'none') return null;

  const items = resolveCredits(credits);
  if (wanted) {
    const named = items.find((item) => item.title.toLowerCase() === wanted.toLowerCase());
    if (named) return named;
    /* Named a production this review doesn't mention: fall through to the
       default rather than silently showing nothing. */
  }
  return items.find((item) => item.onDark) ?? null;
}

/** True once at least one production logo has been uploaded. */
export const anyLogoSupplied = () => library.some((entry) => fileSupplied(entry.logoOnDark));
