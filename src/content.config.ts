import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const reviews = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/reviews' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    credits: z.string().default(''),
    /* Which one of a review's productions is shown beside it. Empty picks the
       first with artwork; "none" shows nothing. */
    feature: z.string().default(''),
    /* Whether the review appears in the homepage slider. Reviews kept for use
       elsewhere are switched off here rather than deleted. */
    showOnHomepage: z.boolean().default(true),
    order: z.number().default(99),
  }),
});

/* Advice articles, mostly written for artists on the roster. `topic` matches an
   id in src/content/pages/insights.json so the listing's filters and an
   article's own label always read the same. Reading time is counted from the
   body rather than typed in, so it can never fall out of date. */
const insights = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/insights' }),
  schema: z.object({
    title: z.string(),
    /* Topic id — one of the topics listed in insights.json. */
    topic: z.string(),
    excerpt: z.string(),
    date: z.coerce.date(),
    author: z.string().default('Take 3 Agency'),
    image: z.string().default(''),
    imageAlt: z.string().default(''),
    /* The one article held at the top of the listing. If several are marked,
       the most recent wins. */
    featured: z.boolean().default(false),
    /* Written but not ready — kept out of the listing and out of sitemaps. */
    draft: z.boolean().default(false),
    /* Optional search/share overrides; the title and excerpt are used otherwise. */
    metaTitle: z.string().default(''),
    metaDescription: z.string().default(''),
  }),
});

/* Workshops and other one-off events, each with its own page under /events.
   Prices are in pounds; a price of 0 makes the event free and its booking
   button an email link, since a free place needs nothing taken. The member
   access code is NOT stored here: the site's files are public, so it lives in
   the EVENTS_MEMBER_CODE setting on the host and is checked on the server. */
const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    /* When it starts. Past events drop off the listing on the next build. */
    date: z.coerce.date(),
    /* Spoken end time, e.g. "17:00" — shown beside the start, never computed. */
    endTime: z.string().default(''),
    location: z.string(),
    /* Price per place in pounds. 0 = free. */
    price: z.number().nonnegative(),
    /* Total places. Bookings close on the server once these are paid for. */
    capacity: z.number().int().positive(),
    /* Members' workshops need the access code before the booking button works. */
    membersOnly: z.boolean().default(false),
    /* Hand switch to close bookings early, whatever the count says. */
    closed: z.boolean().default(false),
    /* Small print under the price, e.g. "Including VAT". */
    priceNote: z.string().default(''),
    /* Some workshops are awarded by application rather than first come, first
       served: the page then leads with the application link until the
       deadline, and the payment form is for those offered a place. */
    applyUrl: z.string().default(''),
    applyDeadline: z.coerce.date().optional(),
    summary: z.string(),
    image: z.string().default(''),
    imageAlt: z.string().default(''),
    /* Where the photo is anchored when it is cropped to the 3:2 plate, as the
       category grid does it: "center 30%" keeps a face near the top in frame. */
    imageFocus: z.string().default('center center'),
    /* Stills for the page cover: production frames the guest has worked on,
       cross-fading behind the title like the home hero, each credited. */
    cover: z
      .array(
        z.object({
          image: z.string(),
          alt: z.string().default(''),
          credit: z.string().default(''),
          /* What the guest did on it, e.g. "Action designer" — read as "Action designer on Havoc". */
          role: z.string().default(''),
          focus: z.string().default('center center'),
        }),
      )
      .default([]),
    /* Kept out of the listing and the sitemap until it is ready. */
    draft: z.boolean().default(false),
    metaTitle: z.string().default(''),
    metaDescription: z.string().default(''),
  }),
});

export const collections = { reviews, insights, events };
