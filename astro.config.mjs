// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://sportana.rs',
  integrations: [sitemap()],
  // clean URLs without a trailing slash (/work), matching the nav links and what Cloudflare Pages serves for work.html
  trailingSlash: 'never',
  build: { format: 'file' },
  devToolbar: { enabled: false },
});
