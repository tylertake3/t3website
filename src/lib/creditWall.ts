/* What is actually known about each title on the credits wall.

   src/data/posters.json carries four fields per entry — title, season, slug and
   artwork — and nothing else. There is no supplied discipline, format or studio
   data for these productions, so none is shown. A card is a poster and a title,
   plus the series number where one was recorded, because that is the only thing
   that distinguishes two otherwise identical entries.

   Two further fields — the format, and which disciplines Take 3 supplied — come
   from src/data/credit-detail.json, which is edited by hand. Both are optional
   per title: a title with no format is offered by no format pill, and a title
   with no disciplines shows its name alone.

   Anything added must come from a supplied source. In particular: do NOT derive
   a production's format from its title, its poster, its studio or the absence
   of a season number — a title with no season recorded is not therefore a film
   — and do NOT infer which disciplines Take 3 supplied to it. See
   docs/credits-content-gaps.md for what is outstanding. */
import { posterWall, type Poster } from './posters';
import creditDetail from '../data/credit-detail.json';
import { PLACEHOLDER_DISCIPLINES, placeholderDisciplinesFor } from './placeholderDisciplines';

export type CreditFormat = 'Film' | 'Television' | 'Commercial';

type CreditDetail = { format?: string; disciplines?: string[] };

const detail = (creditDetail.titles ?? {}) as Record<string, CreditDetail>;

/* A value a pill can match on that survives spaces and casing. */
export const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export type WallEntry = {
  slug: string;
  title: string;
  /** The series number, where one was supplied. Null when none was recorded. */
  season: number | null;
  src: string;
  /** Title plus series number, e.g. "The Crown, S6". What the card shows. */
  label: string;
  /** Folded for matching, so "Deadpool & Wolverine" is found by "deadpool". */
  search: string;
  /** Position in A-Z order, so the client can sort without moving any nodes. */
  alphabetical: number;
  /** Supplied format, where one is recorded. */
  format: string | null;
  /** What Take 3 supplied, where it is recorded. Empty when it is not. */
  disciplines: string[];
  /** False when the disciplines above came from the placeholder stand-in. */
  disciplinesAreReal: boolean;
};

/* Punctuation and case folded away, and "&" spelled out, so a term matches the
   way someone would type it. */
const fold = (text: string) =>
  text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const entries = posterWall.map((poster: Poster) => ({
  slug: poster.slug,
  title: poster.title,
  season: poster.season,
  src: poster.src,
  /* "The Crown, S6" rather than a separate line under the title: the series
     number is part of what the production is called, and it is the only thing
     distinguishing two otherwise identical entries. */
  label: poster.season ? `${poster.title}, S${poster.season}` : poster.title,
  format: detail[poster.slug]?.format ?? null,
  /* A real assignment always wins. The stand-in only fills a gap, and only
     while it is switched on — see placeholderDisciplines.ts, which explains
     why these are not true. */
  disciplines: detail[poster.slug]?.disciplines?.length
    ? detail[poster.slug].disciplines
    : placeholderDisciplinesFor(poster.slug),
  disciplinesAreReal: Boolean(detail[poster.slug]?.disciplines?.length),
}));

/* A-Z by title, then by series number, so a title's runs stay in their own
   order rather than being interleaved arbitrarily. */
const azOrder = entries
  .map((entry, index) => ({ entry, index }))
  .sort(
    (a, b) =>
      a.entry.title.localeCompare(b.entry.title, 'en', { sensitivity: 'base' }) ||
      (a.entry.season ?? 0) - (b.entry.season ?? 0) ||
      a.index - b.index,
  );

const rank = new Map<number, number>();
azOrder.forEach(({ index }, position) => rank.set(index, position));

export const wall: WallEntry[] = entries.map((entry, index) => ({
  ...entry,
  search: fold(entry.label),
  alphabetical: rank.get(index) ?? index,
}));

/** The values a card matches a pill on: its format and each of its disciplines. */
export const entryTags = (entry: WallEntry) =>
  [entry.format ? slugify(entry.format) : null, ...entry.disciplines.map(slugify)]
    .filter(Boolean)
    .join(' ');

/** How many titles are on the wall. A count, not an estimate. */
export const wallCount = wall.length;

/* The filters are built from what the data actually contains, so a pill can
   never offer a format or a discipline that no card carries — and a filter can
   never return a confident-looking empty result. Both lists are empty until
   credit-detail.json is filled in, and the controls hide themselves. */
const FORMAT_ORDER = ['Film', 'Television', 'Commercial'];

export const wallFormats = FORMAT_ORDER.filter((format) =>
  wall.some((entry) => entry.format === format),
).map((format) => ({
  label: format,
  value: slugify(format),
  count: wall.filter((entry) => entry.format === format).length,
}));

/* True while any discipline on the wall is a stand-in rather than a real
   assignment. Read this rather than checking the flag directly. */
export const wallDisciplinesArePlaceholder =
  PLACEHOLDER_DISCIPLINES && wall.some((entry) => !entry.disciplinesAreReal);

export const wallDisciplines = [
  ...new Set(wall.flatMap((entry) => entry.disciplines)),
]
  .sort((a, b) => a.localeCompare(b, 'en'))
  .map((discipline) => ({
    label: discipline,
    value: slugify(discipline),
    count: wall.filter((entry) => entry.disciplines.includes(discipline)).length,
  }));

/* How many entries carry a recorded series number. Kept for internal reporting
   only: it is a fact about the data, not a classification of the work, and
   publishing it as "television series" would overstate it — a series supplied
   without a season number would not be counted. */
export const withRecordedSeason = wall.filter((entry) => entry.season != null).length;

/* The search field and the order control were removed from the page on request
   (8 September 2026); the pills and "Load more" carry the wall instead. The
   `search` and `alphabetical` fields above are still computed, so putting
   either control back is a markup-and-handler job with no data work. Note there
   is no supplied date on any entry, so a "Latest" ordering would not be
   possible even then — array position is not recency. */
