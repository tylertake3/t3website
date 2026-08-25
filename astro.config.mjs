// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://take3agency.com',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap()],
});
