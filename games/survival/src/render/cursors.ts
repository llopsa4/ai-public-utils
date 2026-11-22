// Mouse cursors (art/SPEC.md section 10): five CSS cursors cut from the `ui` atlas (`cursor_<name>` at 1x, `@2x` for
// dense screens) and set as the canvas's default cursor. Without art (no atlas frame) the browser's own cursors stay.
import type Phaser from 'phaser';
import { fromAtlas } from './art';
import { entry } from './manifest';
import { CURSOR_KINDS, cursorCss, cursorHotspot, type CursorKind } from './cursorLogic';

export { CURSOR_KINDS, cursorCss, cursorHotspot, pickCursor } from './cursorLogic';
export type { CursorContext, CursorKind } from './cursorLogic';

/** Copies an atlas frame into a canvas at its source size and returns it as a PNG data URL, or null. */
function frameToDataUrl(scene: Phaser.Scene, atlas: string, name: string): string | null {
  const texture = scene.textures.get(atlas);
  if (!texture.has(name)) return null;
  const f = texture.get(name);
  const canvas = document.createElement('canvas');
  canvas.width = f.realWidth;
  canvas.height = f.realHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(f.source.image as CanvasImageSource, f.cutX, f.cutY, f.cutWidth, f.cutHeight, f.x, f.y, f.cutWidth, f.cutHeight);
  return canvas.toDataURL('image/png');
}

const css = new Map<CursorKind, string>();
let current: CursorKind | null = null;

/** Builds the CSS cursors from the atlas for every kind that has art. Safe to call again after a scene restart. */
export function installCursors(scene: Phaser.Scene): void {
  css.clear();
  current = null;
  for (const kind of CURSOR_KINDS) {
    const key = `cursor_${kind}`;
    if (!fromAtlas(scene, key, key)) continue;
    const atlas = entry(key).atlas as string;
    const one = frameToDataUrl(scene, atlas, key);
    if (!one) continue;
    css.set(kind, cursorCss(one, frameToDataUrl(scene, atlas, `${key}@2x`), cursorHotspot(kind)));
  }
}

/** The cursors installed (for the smoke test). */
export function installedCursors(): CursorKind[] {
  return [...css.keys()];
}

/** Shows a cursor as the canvas's default; a kind without art leaves the browser's own. Only touches the DOM on a change. */
export function showCursor(scene: Phaser.Scene, kind: CursorKind): void {
  if (kind === current) return;
  current = kind;
  scene.input.setDefaultCursor(css.get(kind) ?? '');
}

/** The cursor shown now, or null before the first (for the smoke test). */
export function shownCursor(): CursorKind | null {
  return current;
}
