import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Full Phaser (no custom build). `root: src` keeps the source page apart from the published
// index.html, which scripts/publish.mjs writes last (GitHub Pages serves `main` as-is).
export default defineConfig(({ command }) => ({
  root: fileURLToPath(new URL('./src', import.meta.url)),
  base: './',
  publicDir: false,
  // The grey stand-ins exist only on the dev server (?standins); a build gets an empty module in their place.
  resolve: {
    alias:
      command === 'build'
        ? [{ find: /^\.\/standinFiles$/, replacement: fileURLToPath(new URL('./src/render/standinFiles.empty.ts', import.meta.url)) }]
        : [],
  },
  server: { port: 5174, fs: { allow: [fileURLToPath(new URL('.', import.meta.url))] } },
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
    assetsDir: 'build',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
  },
}));
