// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    // permite servir el dev a través del túnel temporal de Cloudflare (*.trycloudflare.com)
    server: { allowedHosts: ['.trycloudflare.com'] },
  },

  // Fuentes locales — pendiente: soltar los archivos en src/assets/fonts/.
  // Al recibirlos: importar `fontProviders` desde 'astro/config', descomentar este
  // bloque y ajustar `src`/`weight`. Exponen --font-grotesk (cuerpo + títulos) y
  // --font-logotype (wordmark), consumidos en src/styles/global.css.
  // fonts: [
  //   {
  //     provider: fontProviders.local(),
  //     name: 'Grotesk',
  //     cssVariable: '--font-grotesk',
  //     fallbacks: ['Avenir Next', 'Futura', 'system-ui', 'sans-serif'],
  //     variants: [
  //       { weight: 400, style: 'normal', src: ['./src/assets/fonts/grotesk-regular.woff2'] },
  //       { weight: 500, style: 'normal', src: ['./src/assets/fonts/grotesk-medium.woff2'] },
  //       { weight: 700, style: 'normal', src: ['./src/assets/fonts/grotesk-bold.woff2'] },
  //     ],
  //   },
  //   {
  //     provider: fontProviders.local(),
  //     name: 'Lynn Carré Logotype',
  //     cssVariable: '--font-logotype',
  //     fallbacks: ['Avenir Next', 'Futura', 'sans-serif'],
  //     variants: [
  //       { weight: 400, style: 'normal', src: ['./src/assets/fonts/lynncarre-logotype.woff2'] },
  //     ],
  //   },
  // ],
});
