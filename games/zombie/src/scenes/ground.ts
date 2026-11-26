import Phaser from 'phaser';
import { TILE_H, TILE_W, tileToWorld, worldBounds } from '../render/iso';
import { type Fadable, type Occlusion } from '../render/occlude';
import { type HousePiece } from '../render/dressing';
import { addSprite, anchorOf, boxOf, drawScale } from '../render/placeholders';
import { BORDER, type Dressing, FOREST_FOG, GROUND_KEY, forestBorder, forestFog } from '../render/terrain';

/** Room kept around the map for the forest border: its tiles, and the height of the tall trees at the back. */
const MARGIN_X = BORDER * TILE_W + 64;
const MARGIN_Y = BORDER * TILE_H + 192;
/** Width, in tiles, of one step of the mist. */
const FOG_STEP = 0.5;

/**
 * Draws the whole ground once into one texture and shows it as a single image behind everything
 * (depth -1, where the per-tile ground images used to sit): n * n display objects become one.
 * `pick` gives the texture key of the tile at (x, y); the ground never changes, so it is drawn once.
 * `dressing` (patches and scatter) is drawn into the same texture, over all the tiles.
 * The tile art is 2x (128 x 64 source, shown at half), so one scaled stamp image draws every tile.
 * Around the map: moss fading into mist, with the border trees that stand behind the map (`addForestFront` adds the rest).
 */
export function bakeGround(scene: Phaser.Scene, n: number, pick: (x: number, y: number) => string, dressing: readonly Dressing[] = []): Phaser.GameObjects.RenderTexture {
  const { w, h } = worldBounds(n);
  const rt = scene.add.renderTexture(-MARGIN_X, -MARGIN_Y, w + 2 * MARGIN_X, h + 2 * MARGIN_Y).setOrigin(0, 0).setDepth(-1);
  const stamp = scene.make.image({}, false);
  const draw = (key: string, x: number, y: number, alpha = 1) => {
    stamp.setTexture(key).setOrigin(...anchorOf(key)).setScale(drawScale(key)).setAlpha(alpha);
    rt.batchDraw(stamp, x + MARGIN_X, y + MARGIN_Y);
  };
  const mist = mistGraphics(scene, n);
  rt.beginDraw();
  for (let y = -BORDER; y < n + BORDER; y++) {
    for (let x = -BORDER; x < n + BORDER; x++) {
      if (x >= 0 && y >= 0 && x < n && y < n) continue;
      const p = tileToWorld(x, y, n);
      draw(GROUND_KEY, p.x, p.y);
    }
  }
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const p = tileToWorld(x, y, n);
      draw(pick(x, y), p.x, p.y);
    }
  }
  for (const d of dressing) {
    const p = tileToWorld(d.x, d.y, n);
    draw(d.key, p.x + d.dx, p.y + d.dy);
  }
  rt.batchDraw(mist, MARGIN_X, MARGIN_Y);
  for (const b of forestBorder(n)) {
    if (!b.back) continue;
    const p = tileToWorld(b.x, b.y, n);
    draw(b.key, p.x, p.y, b.alpha);
  }
  rt.endDraw();
  stamp.destroy();
  mist.destroy();
  return rt;
}

/** The mist over the border ground: rings around the map, thicker the further out, solid at the end. */
function mistGraphics(scene: Phaser.Scene, n: number): Phaser.GameObjects.Graphics {
  const g = scene.make.graphics({}, false);
  const corners = (e: number) => {
    const [lo, hi] = [-0.5 - e, n - 0.5 + e];
    return [tileToWorld(lo, lo, n), tileToWorld(hi, lo, n), tileToWorld(hi, hi, n), tileToWorld(lo, hi, n)];
  };
  for (let e = 0; e < BORDER + 1; e += FOG_STEP) {
    const inner = corners(e);
    const outer = corners(e + FOG_STEP);
    g.fillStyle(FOREST_FOG, forestFog(e + FOG_STEP / 2));
    for (let i = 0; i < 4; i++) g.fillPoints([inner[i]!, inner[(i + 1) % 4]!, outer[(i + 1) % 4]!, outer[i]!], true);
  }
  return g;
}

/** The border trees on the two near sides: real sprites, so they overlap the map and fade in front of a figure. */
export function addForestFront(scene: Phaser.Scene, n: number, occlusion: Occlusion<Fadable>): void {
  for (const b of forestBorder(n)) {
    if (b.back) continue;
    const p = tileToWorld(b.x, b.y, n);
    const img = addSprite(scene, b.key, p.x, p.y, p.y).setAlpha(b.alpha);
    occlusion.add(b.x, b.y, { setAlpha: (a: number) => img.setAlpha(a * b.alpha) }, boxOf(b.key, p.x, p.y));
  }
}

/** The upright house pieces (furniture, porch steps): sorted by foot like walls; they block nothing but fade in front of a figure. */
export function addHousePieces(scene: Phaser.Scene, n: number, pieces: readonly HousePiece[], occlusion: Occlusion<Fadable>): void {
  for (const f of pieces) {
    const p = tileToWorld(f.x, f.y, n);
    const img = addSprite(scene, f.key, p.x, p.y, p.y);
    occlusion.add(Math.round(f.x), Math.round(f.y), img, boxOf(f.key, p.x, p.y));
  }
}
