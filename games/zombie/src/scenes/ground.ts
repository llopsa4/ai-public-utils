import Phaser from 'phaser';
import { tileToWorld, worldBounds } from '../render/iso';
import { anchorOf } from '../render/placeholders';

/** Room kept around the map so a tile image that overhangs the world box still lands inside the texture. */
const MARGIN = 64;

/**
 * Draws the whole ground once into one texture and shows it as a single image behind everything
 * (depth -1, where the per-tile ground images used to sit): n * n display objects become one.
 * `pick` gives the texture key of the tile at (x, y); the ground never changes, so it is drawn once.
 */
export function bakeGround(scene: Phaser.Scene, n: number, pick: (x: number, y: number) => string): Phaser.GameObjects.RenderTexture {
  const { w, h } = worldBounds(n);
  const rt = scene.add.renderTexture(-MARGIN, -MARGIN, w + 2 * MARGIN, h + 2 * MARGIN).setOrigin(0, 0).setDepth(-1);
  const [ax, ay] = anchorOf('tile_ground');
  const frame = scene.textures.getFrame('tile_ground'); // the tile's real size, not an assumed one
  rt.beginDraw();
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const p = tileToWorld(x, y, n);
      rt.batchDrawFrame(pick(x, y), undefined, p.x - ax * frame.width + MARGIN, p.y - ay * frame.height + MARGIN);
    }
  }
  rt.endDraw();
  return rt;
}

/** The checkerboard of the two ground tiles, shared by every scene. */
export const checker = (x: number, y: number): string => ((x + y) % 2 ? 'tile_ground_b' : 'tile_ground');
