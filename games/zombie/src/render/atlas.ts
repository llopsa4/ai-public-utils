import Phaser from 'phaser';
import manifest from '../../art/manifest.json';
import { UI_NAMES, UI_TEXTURE, uiOf } from './ui';

// The packed figure atlases (art/atlas/<group>.png + .json, art/STYLE.md Atlas contract). Vite bundles
// whatever is in that folder; a missing group is simply not loaded and its figures use the grey capsules.
const PNGS = import.meta.glob('../../art/atlas/*.png', { query: '?url', import: 'default', eager: true }) as Record<string, string>;
const JSONS = import.meta.glob('../../art/atlas/*.json', { import: 'default', eager: true }) as Record<string, object>;
// The UI art that is not in the `ui` atlas: cursors (used as CSS cursors) and the title images.
const UI_FILES = import.meta.glob('../../art/frames/ui/*.png', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

export const ATLAS_GROUPS = Object.keys(manifest.atlases);

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
    if (uiOf(name).group !== 'title') continue;
    const url = uiImageUrl(name);
    if (url) scene.load.image(name, url);
  }
}

/** Pixel art: nearest-neighbour sampling for the figure atlases and the UI art (the rest of the game stays smooth). */
export function crispAtlases(scene: Phaser.Scene): void {
  for (const group of [...ATLAS_GROUPS, UI_TEXTURE]) if (scene.textures.exists(group)) scene.textures.get(group).setFilter(Phaser.Textures.FilterMode.NEAREST);
  for (const name of UI_NAMES) if (uiOf(name).group === 'title' && scene.textures.exists(name)) scene.textures.get(name).setFilter(Phaser.Textures.FilterMode.NEAREST);
}

/** True when the figure's atlas is loaded and holds its idle frame. */
export function hasFigure(scene: Phaser.Scene, group: string, key: string): boolean {
  return scene.textures.exists(group) && scene.textures.get(group).has(`${key}_idle_se_0`);
}
