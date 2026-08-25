import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const reviews = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/reviews' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    credits: z.string().default(''),
    order: z.number().default(99),
  }),
});

export const collections = { reviews };
