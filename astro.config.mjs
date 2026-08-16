import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://alephforge.github.io',
  base: '/VibeLexicon/',
  trailingSlash: 'always',
  integrations: [vue(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
