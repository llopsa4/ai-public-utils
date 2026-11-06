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

/** Kiln Courier's source (the card rules and battle screens), shared with FFCardGame. */
const KC = fileURLToPath(new URL('../FFCardGame/client/src', import.meta.url));
/**
 * Kiln Courier modules the adventure supplies itself: its small WebP art instead of Kiln Courier's
 * full-size PNGs, and the scavenger drawn in the lesson too (see each file's header).
 */
const KC_OVERRIDES: Record<string, string> = {
  'hooks/useBattle.ts': fileURLToPath(new URL('./src/kc/useBattle.ts', import.meta.url)),
  'components/Battlefield.tsx': fileURLToPath(new URL('./src/kc/Battlefield.tsx', import.meta.url)),
  'assets.ts': fileURLToPath(new URL('./src/kc/assets.ts', import.meta.url)),
  'presentation.ts': fileURLToPath(new URL('./src/kc/presentation.ts', import.meta.url)),
  'components/EquipmentArt.tsx': fileURLToPath(new URL('./src/kc/EquipmentArt.tsx', import.meta.url)),
};
function kcOverrides(): Plugin {
  const norm = (p: string) => p.replace(/\\/g, '/');
  const kc = norm(KC);
  return {
    name: 'kc-overrides',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer || !source.startsWith('.')) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (!resolved) return null;
      const id = norm(resolved.id);
      for (const [file, replacement] of Object.entries(KC_OVERRIDES)) {
        if (id === `${kc}/${file}` && norm(importer) !== norm(replacement)) return replacement;
      }
      return null;
    },
  };
}

export default defineConfig(({ command }) => ({
  root: fileURLToPath(new URL('./src', import.meta.url)),
  // Relative URLs so the game works from any sub-path, e.g. https://<user>.github.io/<repo>/adventure/.
  base: './',
  publicDir: false,
  plugins: [phaserFlags(), kcOverrides()],
  // Production builds bundle only the parts of Phaser the game uses (see src/phaser-custom.cjs).
  // The dev server keeps the full prebuilt Phaser, since it cannot serve Phaser's CommonJS sources.
  resolve: {
    alias: [
      { find: /^@kc\//, replacement: `${KC}/` },
      ...(command === 'build' ? [{ find: /^phaser$/, replacement: fileURLToPath(new URL('./src/phaser-custom.cjs', import.meta.url)) }] : []),
    ],
    // One React for the adventure and Kiln Courier's files (FFCardGame has its own node_modules).
    dedupe: ['react', 'react-dom'],
  },
  server: { fs: { allow: [fileURLToPath(new URL('.', import.meta.url)), KC] } },
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
