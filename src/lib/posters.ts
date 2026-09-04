import posterData from '../data/posters.json';

export type Poster = {
  title: string;
  season: number | null;
  slug: string;
  src: string;
};

export const posters = posterData.posters as Poster[];

const bySlug = new Map(posters.map((p) => [p.slug, p]));

/* The label under the artwork: a series carries its series number, a film
   stands on its title alone. */
export const posterLabel = (p: Poster) => (p.season ? `${p.title} — Series ${p.season}` : p.title);

/* The four titles that lead the homepage. They hold the top row, so they are
   the first thing anyone sees under the heading. */
const headlineSlugs = ['the-odyssey', 'avengers-doomsday', 'harry-potter-tv-series-s1', 'the-witcher'];

/* The rest of the titles that pull the eye. They fill the grid beneath the
   top row, in a scattered order rather than a ranked one. */
const featuredSlugs = [
  'wicked',
  'gladiator-ii',
  'deadpool-wolverine',
  'house-of-the-dragon-s3',
  'barbie',
  'andor',
  'the-sandman',
  '28-years-later',
  'alien-earth',
  'peaky-blinders-the-immortal-man',
  'the-lord-of-the-rings-the-rings-of-power',
  'bridgerton',
  'slow-horses',
  'black-mirror',
  '3-body-problem',
  'thursday-murder-club',
];

/* A fixed seed, so the order is scattered but identical on every build — the
   page must not reshuffle itself between the server render and the client. */
const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const shuffle = <T>(items: T[], seed: number) => {
  const out = items.slice();
  const next = rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/* Several titles appear more than once because more than one series was
   supplied. They read as a mistake when they land side by side, so after the
   shuffle any poster sharing a title with a near neighbour is swapped further
   down the wall. */
const spaceOutTitles = (items: Poster[], gap: number) => {
  const out = items.slice();
  const clashes = (i: number, p: Poster) => {
    for (let k = Math.max(0, i - gap); k < Math.min(out.length, i + gap + 1); k++) {
      if (k !== i && out[k] && out[k].title === p.title) return true;
    }
    return false;
  };
  for (let i = 0; i < out.length; i++) {
    if (!clashes(i, out[i])) continue;
    for (let j = i + 1; j < out.length; j++) {
      if (out[j].title === out[i].title) continue;
      const a = out[i];
      const b = out[j];
      out[i] = b;
      out[j] = a;
      if (!clashes(i, b)) break;
      out[i] = a;
      out[j] = b;
    }
  }
  return out;
};

const pick = (slugs: string[]) =>
  slugs.map((slug) => bySlug.get(slug)).filter((p): p is Poster => Boolean(p));

/* Homepage: the four headline titles across the top row, then the rest of the
   selection scattered rather than ranked. */
export const featuredPosters = [
  ...shuffle(pick(headlineSlugs), 771103),
  ...shuffle(pick(featuredSlugs), 20240517),
];

/* Credits: everything supplied, in a mixed order so the wall doesn't read as
   an alphabetical list, with repeated titles held apart. */
export const posterWall = spaceOutTitles(shuffle(posters, 90210), 6);
