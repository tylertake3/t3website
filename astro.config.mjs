// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://take3agency.com',
  trailingSlash: 'never',
  build: { format: 'file' },
});
