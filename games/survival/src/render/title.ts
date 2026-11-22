// The title picture (art/title.jpg, 2560 x 1440, art/SPEC.md section 10): shown behind the menu when it exists.
import type Phaser from 'phaser';

// A folder with no title.jpg gives an empty map, so the menu keeps its plain background until Codex delivers it.
const found = import.meta.glob('../../art/title.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const URL = Object.values(found)[0] as string | undefined;
export const TITLE_KEY = 'title_picture';

/** Queues the picture on the scene's loader (Boot's preload); nothing happens without the file. */
export function loadTitle(scene: Phaser.Scene): void {
  if (URL) scene.load.image(TITLE_KEY, URL);
}

/** True when the picture is loaded. */
export function hasTitle(scene: Phaser.Scene): boolean {
  return scene.textures.exists(TITLE_KEY);
}

/** Adds the picture to fill the 1280 x 720 screen (cover), at the back; returns it, or null without the file. */
export function addTitle(scene: Phaser.Scene): Phaser.GameObjects.Image | null {
  if (!hasTitle(scene)) return null;
  return scene.add.image(640, 360, TITLE_KEY).setDisplaySize(1280, 720).setDepth(-10);
}
