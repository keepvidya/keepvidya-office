import { defineConfig } from 'vite';

// Keepvidya Office is a static, dependency-free SPA. Vite is used only for the
// dev server + an optional minified build, exactly like the Emberfall project.
export default defineConfig({
  base: './',
  server: { port: 5180, open: false },
  build: { target: 'es2020', outDir: 'dist' }
});
