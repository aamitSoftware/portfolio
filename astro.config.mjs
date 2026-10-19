// @ts-check

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// SITE_URL lets a custom domain replace the vercel.app one without a code change.
const site = process.env.SITE_URL ?? 'https://amitasher.vercel.app';

export default defineConfig({
  site,
  trailingSlash: 'never',
  devToolbar: { enabled: false },
  build: { format: 'file' },
  integrations: [react(), mdx(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
