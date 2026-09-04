/* Shared vocabulary for the documents handed to the copy team.

   Both the review packs (what the pages say now) and the blank worksheets
   (what they could say instead) read from here, so a page renamed or a field
   relabelled in one place changes in both. */

import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SITE = 'https://www.take3agency.com';

export const PAGES = {
  index: {
    order: 1,
    name: 'Homepage',
    route: '/',
    audience: 'Clients — producers, casting directors, production co-ordinators',
    purpose:
      'The front door. Establishes what Take 3 is, the scale behind it, and points visitors to the right talent page within one screen.',
    reviews: 'CLIENT reviews — productions, choreographers and casting directors talking about working with the agency.',
    reviewNote:
      'These are pulled from the shared review library, so a change here changes them everywhere they appear.',
  },
  artists: {
    order: 2,
    name: 'Our artists',
    route: '/artists',
    audience: 'Clients browsing the roster, and artists sizing up the agency',
    purpose: 'The hub for every talent category — the page that sends people to the right specialism.',
    reviews: 'ARTIST reviews — performers on what it is like to be represented.',
    reviewNote: 'Not currently on the page. Worth deciding whether to add a short row of artist voices here.',
  },
  dancers: {
    order: 3,
    name: 'Dancers',
    route: '/dancers',
    owner: 'Chanel',
    audience: 'Choreographers, movement directors, commercial producers',
    purpose: 'Sells the depth and range of the dance roster and makes clear the agency handles the admin, not the casting.',
    reviews: 'CLIENT reviews — specifically choreographers and movement directors.',
    reviewNote: 'These are written into this page, separate from the shared library.',
  },
  spacts: {
    order: 4,
    name: 'SPACTs',
    route: '/spacts',
    owner: 'Chanel',
    audience: 'Stunt co-ordinators, ADs, producers',
    purpose: 'Explains the SPACT offer and the breadth of disciplines behind it.',
    reviews: 'CLIENT reviews — stunt co-ordinators and production.',
    reviewNote: 'None on the page yet. Decide whether to add.',
  },
  'stunt-performers': {
    order: 5,
    name: 'Stunt performers & stunt doubles',
    route: '/stunt-performers',
    audience: 'Stunt co-ordinators, ADs',
    purpose: 'The action-trained end of the roster — matching, clearances and safety credibility.',
    reviews: 'CLIENT reviews — stunt co-ordinators.',
    reviewNote: 'None on the page yet.',
  },
  'stand-ins': {
    order: 6,
    name: 'Stand-ins & picture doubles',
    route: '/stand-ins',
    owner: 'Elly',
    audience: 'ADs, DOPs, production',
    purpose: 'Explains why an accurate match saves shoot time, and how matching is done.',
    reviews: 'CLIENT reviews — ADs and production.',
    reviewNote: 'None on the page yet.',
  },
  models: {
    order: 7,
    name: 'Models',
    route: '/models',
    owner: 'Elly',
    audience: 'Brand and commercial producers, advertising agencies',
    purpose: 'The commercial and brand end of the roster.',
    reviews: 'CLIENT reviews — brand and agency side.',
    reviewNote: 'None on the page yet.',
  },
  'circus-artists': {
    order: 8,
    name: 'Circus artists & physical performers',
    route: '/circus-artists',
    owner: 'Mia',
    audience: 'Commercial producers, live event producers, film production',
    purpose: 'Aerial, acrobatic and physical talent — skill-led casting.',
    reviews: 'CLIENT reviews.',
    reviewNote: 'None on the page yet.',
  },
  'unique-talent': {
    order: 9,
    name: 'Unique talent',
    route: '/unique-talent',
    owner: 'Becky',
    audience: 'Casting directors, commercial producers',
    purpose: 'Performers cast for their look who can also act and take direction.',
    reviews: 'CLIENT reviews.',
    reviewNote: 'None on the page yet. This page is sensitive — tone matters more than usual.',
  },
  specialists: {
    order: 10,
    name: 'Specialists',
    route: '/specialists',
    audience: 'Producers with an unusual brief',
    purpose: 'The "if the scene needs it, we will find it" promise — the strongest selling idea on the site.',
    reviews: 'CLIENT reviews — ideally a story about an unusual request being filled.',
    reviewNote: 'None on the page yet. A short case-study quote would land hard here.',
  },
  intimacy: {
    order: 11,
    name: 'Intimacy',
    route: '/intimacy',
    owner: 'Zoe',
    audience: 'Producers, ADs, intimacy co-ordinators',
    purpose: 'Sets out how intimate work is handled, and the care around it.',
    reviews: 'CLIENT reviews — intimacy co-ordinators.',
    reviewNote: 'None on the page yet. Tone must stay measured and professional.',
  },
  'what-is-a-spact': {
    order: 12,
    name: 'What is a SPACT?',
    route: '/what-is-a-spact',
    audience: 'Anyone unfamiliar with the term — including artists and new production staff',
    purpose: 'Plain-English explainer. Also earns search traffic for the term.',
    reviews: 'None — this is an explainer, not a sales page.',
    reviewNote: '',
  },
  credits: {
    order: 13,
    name: 'Credits',
    route: '/credits',
    owner: 'Becky',
    audience: 'Clients checking the agency is real and experienced',
    purpose: 'Proof. The productions supplied since 2019.',
    reviews: 'CLIENT reviews — used here as supporting proof.',
    reviewNote: '',
  },
  about: {
    order: 14,
    name: 'About',
    route: '/about',
    owner: 'Mia',
    audience: 'Both — clients and artists',
    purpose: 'Who the agency is, how it works, where it works, and what it stands for.',
    reviews: 'Mixed — a client voice and an artist voice together would work well here.',
    reviewNote: 'None on the page yet.',
  },
  join: {
    order: 15,
    name: 'Join the roster',
    route: '/join',
    audience: 'ARTISTS — performers applying for representation',
    purpose: 'Sets expectations honestly, filters out unsuitable applications, and takes the application.',
    reviews: 'ARTIST reviews — this is the single most valuable page for them.',
    reviewNote:
      'None on the page yet. Two or three artists on what representation has actually got them would lift this page more than any copy change.',
  },
  contact: {
    order: 16,
    name: 'Contact',
    route: '/contact',
    audience: 'Both — the form splits client and artist enquiries',
    purpose: 'Get the enquiry in, routed to the right place.',
    reviews: 'None needed.',
    reviewNote: '',
  },
  laural: {
    order: 17,
    name: 'Laural',
    route: '/laural',
    audience: 'Clients and artists — the booking system behind the agency',
    purpose: 'Explains the technology the agency runs on, as a credibility and differentiation play.',
    reviews: 'Either — a client on how smooth booking felt would suit best.',
    reviewNote: 'None on the page yet.',
  },
};

/* ------------------------------------------------------------ field labelling */

export const LABELS = {
  kicker: 'Small label above the heading',
  eyebrow: 'Small label above the heading',
  lede: 'Opening line',
  intro: 'Opening line',
  blurb: 'Description',
  foot: 'Small note underneath',
  note: 'Small note',
  alt: 'Photo description (read aloud by screen readers)',
  imageAlt: 'Photo description (read aloud by screen readers)',
  imageCaption: 'Caption on the photo',
  title: 'Heading',
  heading: 'Heading',
  body: 'Body copy',
  quote: 'Quote',
  label: 'Label',
  text: 'Text',
  name: 'Name',
  role: 'Role',
  credits: 'Credits',
  href: 'Links to',
  paragraph: 'Paragraph',
  paragraph1: 'First paragraph',
  paragraph2: 'Second paragraph',
  standfirst: 'Opening line',
  strapline: 'Opening line',
  /* Plumbing rather than copy — nobody reviewing words needs to see these. */
  formAction: null,
  method: null,
  linkHref: null,
  /* Positioning and animation values for the annotated diagram — not words. */
  side: null,
  left: null,
  top: null,
  width: null,
  height: null,
  delay: null,
  role: null,
  sa: 'Legend wording — Supporting Artist',
  spact: 'Legend wording — SPACT',
  stunt: 'Legend wording — Stunt Performer',
  order: null,
  pullQuote: 'Pull quote — the big line set apart from the rest',
  bold: 'The words inside that line shown in bold',
  before: 'The words before the link',
  linkText: 'The words that are the link itself',
  after: 'The words after the link',
  frameAlt: 'Photo description (read aloud by screen readers)',
  slotLabel: 'Photo slot — the words shown in the empty grey box',
  figNumber: 'Figure number printed under the photo',
  figNote: 'Note printed under the photo',
  figure: 'Photo slot',
  focus: null,
  wideFocus: null,
  narrowFocus: null,
  wide: null,
};

export const SECTION_NAMES = {
  meta: 'Search & sharing text (not visible on the page)',
  hero: 'Hero — the first thing you see',
  about: 'About',
  supply: 'What we supply',
  reviews: 'Reviews',
  clients: 'Client logos',
  credits: 'Credits',
  filmTv: 'For film & television',
  commercial: 'For commercial & brand',
  choreographers: 'Working with choreographers',
  roster: 'Roster photo',
  story: 'Our story',
  operations: 'How we operate',
  where: 'Where we work',
  team: 'The team',
  principles: 'Our principles',
  laural: 'Laural',
  categories: 'Categories',
  specialists: 'Specialists',
  represented: 'Being represented',
  range: 'Range',
  approach: 'Our approach',
  briefs: 'Example briefs',
  related: 'Related pages',
  details: 'Contact details',
  form: 'Enquiry form',
  audience: 'Who this is for',
  company: 'Company details',
  figures: 'Key figures',
  productions: 'Productions',
  testimonials: 'Testimonials',
  film: 'For film & television',
  brands: 'Brands',
  why: 'Why Take 3',
  definitions: 'Definitions',
  disciplines: 'Disciplines',
  offer: 'What we offer',
  requirements: 'What we ask for',
  process: 'The process',
  honest: 'Being straight with you',
  publishNote: 'Publishing note',
  casting: 'Casting',
  onset: 'On set',
  numbers: 'The numbers',
  difference: 'The difference',
  whyItMatters: 'Why it matters',
  matching: 'How we match',
  divisions: 'Divisions',
  examples: 'Examples',
  worked: 'How it works',
  promise: 'The promise',
  what: 'What they are',
  origin: 'Where the term comes from',
  distinctions: 'How it differs',
  work: 'The work',
  booking: 'Booking',
  plate: 'Feature strip',
  portraits: 'Portraits',
  tags: 'Tags',
};

export const humanise = (k) =>
  k
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();

export const labelFor = (k) => (k in LABELS ? LABELS[k] : humanise(k));
export const sectionName = (k) => SECTION_NAMES[k] || humanise(k);

export const isImage = (v) => typeof v === 'string' && /^\/(uploads|images)\//.test(v);
export const isTodo = (v) => typeof v === 'string' && /TODO/i.test(v);

/** Empty photo slots: grey boxes on the page waiting for real photography.
 *  They show up in the templates as an element with a "slot" class. */
export const emptySlotCount = (slug) => {
  const p = join(root, 'src', 'pages', `${slug === 'index' ? 'index' : slug}.astro`);
  if (!existsSync(p)) return 0;
  return (readFileSync(p, 'utf8').match(/class="slot[ "]/g) || []).length;
};

