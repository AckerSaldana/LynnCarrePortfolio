// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'DM Serif Display',
      cssVariable: '--font-dm-serif',
      weights: ['400'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
      optimizedFallbacks: false,
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Open Sauce Sans',
      cssVariable: '--font-open-sauce',
      weights: ['400', '500', '700'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Helvetica', 'Arial', 'sans-serif'],
      optimizedFallbacks: false,
    },
  ],
});
