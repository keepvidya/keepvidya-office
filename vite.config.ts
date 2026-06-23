import { defineConfig } from 'vite';

// Web-first static SPA (ADR-0002). Vite is dev server + minifier only.
export default defineConfig({
  base: './',
  server: { port: 5180, open: false },
  build: { target: 'es2021', outDir: 'dist' },
});
