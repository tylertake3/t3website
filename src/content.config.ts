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

export const collections = { reviews, insights };
