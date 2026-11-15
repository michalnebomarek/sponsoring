import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'node:path';
import { loadCourse } from './build/content.ts';

const CONTENT_DIR = resolve(__dirname, 'content');
const VIRTUAL_ID = 'virtual:course';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

/** Při buildu načte všechny content/tyden-N.md a nabídne je aplikaci jako modul `virtual:course`. */
function courseContent(): Plugin {
  return {
    name: 'etapa-course-content',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id !== RESOLVED_ID) return;
      this.addWatchFile(CONTENT_DIR);
      const course = loadCourse(CONTENT_DIR, (m) => this.warn(m));
      for (const w of course.weeks) this.addWatchFile(resolve(CONTENT_DIR, `tyden-${w.n}.md`));
      return `export default ${JSON.stringify(course)};`;
    },
    configureServer(server) {
      server.watcher.add(CONTENT_DIR);
      server.watcher.on('all', (_e, file) => {
        if (!file.startsWith(CONTENT_DIR)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      });
    },
  };
}

// Na GitHub Pages běží aplikace v podsložce /<název repozitáře>/.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [
    courseContent(),
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['apple-touch-icon.png', 'favicon.svg'],
      manifest: {
        id: './',
        name: 'Etapa',
        short_name: 'Etapa',
        description: 'Osobní masterclass sportovních partnerství. 30 minut denně.',
        lang: 'cs',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F6F2EA',
        theme_color: '#F6F2EA',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  build: { target: 'es2020' },
});
