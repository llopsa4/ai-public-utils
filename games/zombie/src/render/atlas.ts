import Phaser from 'phaser';
import manifest from '../../art/manifest.json';
import { ENV_KEYS } from './placeholders';
import { UI_NAMES, UI_TEXTURE, uiOf } from './ui';

// The packed figure atlases (art/atlas/<group>.png + .json, art/STYLE.md Atlas contract). Vite bundles
// whatever is in that folder; a missing group is simply not loaded and its figures use the grey capsules.
const PNGS = import.meta.glob('../../art/atlas/*.png', { query: '?url', import: 'default', eager: true }) as Record<string, string>;
const JSONS = import.meta.glob('../../art/atlas/*.json', { import: 'default', eager: true }) as Record<string, object>;
// The UI art that is not in the `ui` atlas: cursors (used as CSS cursors) and the title images.
const UI_FILES = import.meta.glob('../../art/frames/ui/*.png', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

// The environment art (art/STYLE.md *Environment art*): one PNG per kit key, art/frames/env/<key>.png. A key with no
// file keeps its grey code stand-in (placeholders.ts).
const ENV_FILES = import.meta.glob('../../art/frames/env/*.png', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

/** The UI groups loaded as separate images: the title art and the Bios figures (cursors are CSS cursors). */
const STANDALONE: ReadonlySet<string> = new Set(['title', 'bio']);

export const ATLAS_GROUPS =Object.keys(manifest.atlases);

/** The bundled URL of a standalone UI image (a cursor or title item), or undefined. */
export function uiImageUrl(name: string): string | undefined {
  return UI_FILES[`../../art/frames/ui/${name}.png`];
}

/** Queues every atlas that exists, the `ui` atlas and the standalone title images (call from a scene's `preload`). The texture key is the group name. */
export function loadAtlases(scene: Phaser.Scene): void {
  for (const group of [...ATLAS_GROUPS, UI_TEXTURE]) {
    const png = PNGS[`../../art/atlas/${group}.png`];
    const json = JSONS[`../../art/atlas/${group}.json`];
    if (png && json) scene.load.atlas(group, png, json);
  }
  for (const name of UI_NAMES) {
    if (!STANDALONE.has(uiOf(name).group)) continue;
    const url = uiImageUrl(name);
    if (url) scene.load.image(name, url);
  }
  for (const key of ENV_KEYS) {
    const url = ENV_FILES[`../../art/frames/env/${key}.png`];
    if (url) scene.load.image(key, url);
  }
}

/** Pixel art: nearest-neighbour sampling for the figure atlases and the UI art (the rest of the game stays smooth). */
export function crispAtlases(scene: Phaser.Scene): void {
  for (const group of [...ATLAS_GROUPS, UI_TEXTURE]) if (scene.textures.exists(group)) scene.textures.get(group).setFilter(Phaser.Textures.FilterMode.NEAREST);
  for (const name of UI_NAMES) if (STANDALONE.has(uiOf(name).group) && scene.textures.exists(name)) scene.textures.get(name).setFilter(Phaser.Textures.FilterMode.NEAREST);
  for (const key of ENV_KEYS) if (ENV_FILES[`../../art/frames/env/${key}.png`] && scene.textures.exists(key)) scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
}

/** True when the figure's atlas is loaded and holds its idle frame. */
export function hasFigure(scene: Phaser.Scene, group: string, key: string): boolean {
  return scene.textures.exists(group) && scene.textures.get(group).has(`${key}_idle_se_0`);
}
