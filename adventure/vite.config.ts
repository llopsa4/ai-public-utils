import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('./src', import.meta.url)),
  // Relative URLs so the game works from any sub-path, e.g. https://<user>.github.io/<repo>/adventure/.
  base: './',
  publicDir: false,
  server: { fs: { allow: [fileURLToPath(new URL('.', import.meta.url))] } },
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
    assetsDir: 'build',
    // Keep art as real files (never inlined) so swapping a PNG never changes the JS bundle.
    assetsInlineLimit: 0,
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
  },
});
