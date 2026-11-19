import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Full Phaser (no custom build). `root: src` keeps the source page apart from the published
// index.html, which scripts/publish.mjs writes last (GitHub Pages serves `main` as-is).
export default defineConfig({
  root: fileURLToPath(new URL('./src', import.meta.url)),
  base: './',
  publicDir: false,
  server: { port: 5174, fs: { allow: [fileURLToPath(new URL('.', import.meta.url))] } },
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
    assetsDir: 'build',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
  },
});
