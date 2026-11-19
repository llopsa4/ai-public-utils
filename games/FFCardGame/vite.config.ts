import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('./client', import.meta.url)),
  base: './',
  // Deliberately disable public-directory copying: private documents never enter builds.
  publicDir: false,
  server: { fs: { allow: [fileURLToPath(new URL('.', import.meta.url))] } },
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
    assetsDir: 'build',
    sourcemap: false,
  },
});
