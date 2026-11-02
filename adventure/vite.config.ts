import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

/**
 * Phaser's sources expect webpack's compile-time flags (`typeof WEBGL_RENDERER` and friends).
 * This replaces them in Phaser's files: WebGL and Canvas on, Phaser's sound manager, debug and
 * platform plugins off (the game synthesizes its own sound).
 */
const PHASER_FLAGS: Record<string, string> = {
  WEBGL_RENDERER: 'true',
  CANVAS_RENDERER: 'true',
  FEATURE_SOUND: 'false',
  WEBGL_DEBUG: 'false',
  PLUGIN_CAMERA3D: 'false',
  PLUGIN_FBINSTANT: 'false',
};
function phaserFlags(): Plugin {
  return {
    name: 'phaser-flags',
    enforce: 'pre',
    transform(code, id) {
      if (!/[\\/]phaser[\\/]src[\\/]/.test(id)) return null;
      return code.replace(/typeof (WEBGL_RENDERER|CANVAS_RENDERER|FEATURE_SOUND|WEBGL_DEBUG|PLUGIN_CAMERA3D|PLUGIN_FBINSTANT)\b/g, (_, flag: string) => PHASER_FLAGS[flag]);
    },
  };
}

export default defineConfig(({ command }) => ({
  root: fileURLToPath(new URL('./src', import.meta.url)),
  // Relative URLs so the game works from any sub-path, e.g. https://<user>.github.io/<repo>/adventure/.
  base: './',
  publicDir: false,
  plugins: [phaserFlags()],
  // Production builds bundle only the parts of Phaser the game uses (see src/phaser-custom.cjs).
  // The dev server keeps the full prebuilt Phaser, since it cannot serve Phaser's CommonJS sources.
  resolve: command === 'build'
    ? { alias: [{ find: /^phaser$/, replacement: fileURLToPath(new URL('./src/phaser-custom.cjs', import.meta.url)) }] }
    : {},
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
}));
