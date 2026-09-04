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

export const collections = { reviews };
