// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://www.take3agency.com',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap()],
  /* Every page is still prerendered; the adapter exists so the two sign-in
     routes under /api can run on the server. */
  adapter: vercel(),
});
