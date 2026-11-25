import Phaser from 'phaser';
import { tileToWorld, worldBounds } from '../render/iso';
import { anchorOf, drawScale } from '../render/placeholders';

/** Room kept around the map so a tile image that overhangs the world box still lands inside the texture. */
const MARGIN = 64;

/**
 * Draws the whole ground once into one texture and shows it as a single image behind everything
 * (depth -1, where the per-tile ground images used to sit): n * n display objects become one.
 * `pick` gives the texture key of the tile at (x, y); the ground never changes, so it is drawn once.
 * The tile art is 2x (128 x 64 source, shown at half), so one scaled stamp image draws every tile.
 */
export function bakeGround(scene: Phaser.Scene, n: number, pick: (x: number, y: number) => string): Phaser.GameObjects.RenderTexture {
  const { w, h } = worldBounds(n);
  const rt = scene.add.renderTexture(-MARGIN, -MARGIN, w + 2 * MARGIN, h + 2 * MARGIN).setOrigin(0, 0).setDepth(-1);
  const stamp = scene.make.image({}, false);
  rt.beginDraw();
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const key = pick(x, y);
      const p = tileToWorld(x, y, n);
      stamp.setTexture(key).setOrigin(...anchorOf(key)).setScale(drawScale(key));
      rt.batchDraw(stamp, p.x + MARGIN, p.y + MARGIN);
    }
  }
  rt.endDraw();
  stamp.destroy();
  return rt;
}
