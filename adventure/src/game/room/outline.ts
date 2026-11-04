// The hover highlight: a gold outline around the silhouette of whatever the pointer is over.
// Things painted into the room use the outline cut from the painting (art/outlines.py, one sheet per
// room); objects, swinging props and people get one made from their own picture, live, so it follows
// them as they move, swing or animate.
import Phaser from 'phaser';
import { ART_SCALE } from '../../ui/ui';
import { OUTLINES } from '../assets';
import type { RoomScene } from '../scenes';
import type { Target } from './shared';

/** Outline line and halo colours (as the painted outlines in art/outlines.py). */
const LINE = [255, 226, 160, 255];
const GLOW = [255, 200, 96, 110];
/** Art pixels of margin around a frame: room for the line (2) and the halo (2), on the 2-pixel grid. */
const PAD = 4;
/** Painted outlines sit just above the room painting, under everything standing in front of it. */
const PAINTED_DEPTH = -9500;

export const outlineSheetKey = (background: string): string => `outline-${background}`;

/** Grows a mask by r pixels (a square, like the painted outlines' dilation). */
function grow(mask: Uint8Array, w: number, h: number, r: number): Uint8Array {
  const row = new Uint8Array(w * h), out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = 0;
    for (let d = -r; d <= r && !v; d++) { const xx = x + d; if (xx >= 0 && xx < w) v = mask[y * w + xx]; }
    row[y * w + x] = v;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = 0;
    for (let d = -r; d <= r && !v; d++) { const yy = y + d; if (yy >= 0 && yy < h) v = row[yy * w + x]; }
    out[y * w + x] = v;
  }
  return out;
}

/** The outline texture for one frame of a picture (made once, then cached by texture and frame). */
function frameOutline(scene: Phaser.Scene, frame: Phaser.Textures.Frame): string {
  const key = `outline:${frame.texture.key}:${frame.name}`;
  if (scene.textures.exists(key)) return key;
  const w = frame.cutWidth, h = frame.cutHeight, W = w + 2 * PAD, H = h + 2 * PAD;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(frame.source.image as CanvasImageSource, frame.cutX, frame.cutY, w, h, PAD, PAD, w, h);
  const img = ctx.getImageData(0, 0, W, H), a = img.data;
  const solid = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) solid[i] = a[i * 4 + 3] >= 128 ? 1 : 0;
  const line = grow(solid, W, H, 2), halo = grow(line, W, H, 2);
  for (let i = 0; i < W * H; i++) {
    const c = solid[i] ? null : line[i] ? LINE : halo[i] ? GLOW : null;
    for (let k = 0; k < 4; k++) a[i * 4 + k] = c ? c[k] : 0;
  }
  ctx.putImageData(img, 0, 0);
  scene.textures.addCanvas(key, canvas);
  return key;
}

type Shape = Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;

/** The pictures and painted outlines that make up a hover target's silhouette (empty: none known). */
function partsOf(scene: RoomScene, target: Target): { shapes: Shape[]; painted: string | null } {
  if (target.kind === 'actor') return { shapes: target.actor.id === 'hero' ? [] : [target.actor.sprite], painted: null };
  if (target.kind === 'extra') return { shapes: [target.member.actor.sprite], painted: null };
  const h = target.hotspot, o = h.outline ?? {};
  const objects = o.objects ?? (scene.objects.has(h.id) ? [h.id] : []);
  const shapes: Shape[] = [
    ...objects.map(id => scene.objects.get(id)).filter((s): s is Phaser.GameObjects.Sprite => !!s?.visible),
    ...(o.props ?? []).map(p => scene.props?.image(p)).filter((s): s is Phaser.GameObjects.Image => !!s?.visible),
  ];
  const painted = (o.painted ?? !objects.length) && OUTLINES[scene.room.background]?.place[h.id] ? h.id : null;
  return { shapes, painted };
}

/**
 * Shows the outline of what the pointer is over, pulsing gently; hides the rest. Returns false when
 * the target has no known silhouette, so the caller can fall back to tracing its click area.
 */
export function showOutline(scene: RoomScene, target: Target | null, time: number): boolean {
  const pool = scene.hoverOutlines;
  let used = 0;
  const next = (): Phaser.GameObjects.Image => {
    if (!pool[used]) pool[used] = scene.add.image(0, 0, '__DEFAULT');
    return pool[used++].setVisible(true);
  };
  const alpha = 0.75 + 0.25 * Math.sin(time / 260);
  let found = false;
  if (target) {
    const { shapes, painted } = partsOf(scene, target);
    for (const s of shapes) {
      const f = s.frame;
      next().setTexture(frameOutline(scene, f))
        .setOrigin((s.originX * f.cutWidth + PAD) / (f.cutWidth + 2 * PAD), (s.originY * f.cutHeight + PAD) / (f.cutHeight + 2 * PAD))
        .setPosition(s.x, s.y).setScale(s.scaleX, s.scaleY).setAngle(s.angle).setFlip(s.flipX, s.flipY)
        .setDepth(s.depth - 0.01).setAlpha(alpha * s.alpha);
      found = true;
    }
    const sheet = outlineSheetKey(scene.room.background);
    if (painted && scene.textures.exists(sheet)) {
      const at = OUTLINES[scene.room.background].place[painted];
      next().setTexture(sheet, painted).setOrigin(0, 0).setPosition(at.x, at.y).setScale(1 / ART_SCALE)
        .setAngle(0).setFlip(false, false).setDepth(PAINTED_DEPTH).setAlpha(alpha);
      found = true;
    }
  }
  for (let i = used; i < pool.length; i++) pool[i].setVisible(false);
  return found;
}
