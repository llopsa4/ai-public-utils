import Phaser from 'phaser';
import manifest from '../../art/manifest.json';
import { type Rect, spriteRect } from './occlude';

// Grey code stand-ins for every manifest key with a `placeholder` block (DEVELOPMENT.md
// *Art placeholders*). Claude never draws real art; Codex replaces keys with final art.
export type Shape = 'diamond' | 'capsule' | 'box' | 'ring' | 'ellipse' | 'cube' | 'spire' | 'post' | 'strip';
/** A mark on a cube's long face: an opening, or a wall variant's vertical beam or boarded patch. */
export type Mark = 'door' | 'window' | 'beam' | 'board';

export interface ManifestEntry {
  /** Source px: for a `scale: 2` key this is the double-size art, shown at half. */
  size: [number, number];
  anchor: [number, number];
  frames: number;
  status: 'placeholder' | 'final';
  /** `env` for the environment kit (art/STYLE.md *Environment art*); its final art is art/frames/env/<key>.png. */
  group?: string;
  /** Resolution of the art: 2 = authored at double size and drawn at 1/2. Default 1. */
  scale?: number;
  /**
   * `cube` is an isometric block: `h` its height in source px (default: fills the sprite), `mark` drawn on its `face`.
   * `strip` is a band running down-right across the sprite (a roof ridge or trim): `h` its thickness.
   */
  placeholder?: { shape: Shape; color: string; h?: number; mark?: Mark; face?: 'left' | 'right' };
}

export const MANIFEST = manifest.keys as unknown as Record<string, ManifestEntry>;

export function anchorOf(key: string): [number, number] {
  return MANIFEST[key]?.anchor ?? [0.5, 0.5];
}

/** The factor a key's image is drawn at: 1 / its art resolution (a 2x key is shown at 0.5). */
export function drawScale(key: string): number {
  return 1 / (MANIFEST[key]?.scale ?? 1);
}

/** True once Codex has installed the key's final art (its manifest status): the world label for it goes (art/STYLE.md *Labels*). */
export function isFinalKey(key: string): boolean {
  return MANIFEST[key]?.status === 'final';
}

/** The names of the environment kit keys (manifest `group: env`), in manifest order. */
export const ENV_KEYS: readonly string[] = Object.entries(MANIFEST)
  .filter(([, e]) => e.group === 'env')
  .map(([k]) => k);

/** The world-px box of a key's image with its foot at (x, y): where the wall and tree fade tests overlap (art/STYLE.md *Occlusion*). */
export function boxOf(key: string, x: number, y: number): Rect {
  const [w, h] = MANIFEST[key]!.size;
  const [ax, ay] = anchorOf(key);
  const k = drawScale(key);
  return spriteRect(x, y, w * k, h * k, ax, ay);
}

/** One image of a manifest key standing at world (x, y): its anchor and its drawing scale applied, so scenes never hard-code a size. */
export function addSprite(scene: Phaser.Scene, key: string, x: number, y: number, depth?: number): Phaser.GameObjects.Image {
  const img = scene.add.image(x, y, key).setOrigin(...anchorOf(key)).setScale(drawScale(key));
  if (depth !== undefined) img.setDepth(depth);
  return img;
}

const hex = (c: string): number => parseInt(c.replace('#', ''), 16);

/** `color` scaled by `k` per channel (0..1.2), as a 0xrrggbb number. */
function shade(color: number, k: number): number {
  const ch = (shift: number) => Math.min(255, Math.round(((color >> shift) & 255) * k));
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

type Pt = { x: number; y: number };

/** An isometric block standing on the bottom diamond of its w x h sprite: lit top, mid left face, dark right face. */
function drawCube(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number, height: number, mark?: Mark, face?: 'left' | 'right'): void {
  const d = w / 2; // the diamond's height
  const t0 = h - d - height; // y of the top diamond's upper corner
  const top: Pt[] = [{ x: w / 2, y: t0 }, { x: w, y: t0 + d / 2 }, { x: w / 2, y: t0 + d }, { x: 0, y: t0 + d / 2 }];
  const left: Pt[] = [{ x: 0, y: t0 + d / 2 }, { x: w / 2, y: t0 + d }, { x: w / 2, y: t0 + d + height }, { x: 0, y: t0 + d / 2 + height }];
  const right: Pt[] = [{ x: w / 2, y: t0 + d }, { x: w, y: t0 + d / 2 }, { x: w, y: t0 + d / 2 + height }, { x: w / 2, y: t0 + d + height }];
  const edge = 0x1a1c19;
  g.fillStyle(shade(color, 1.12)).fillPoints(top, true);
  g.fillStyle(shade(color, 0.95)).fillPoints(left, true);
  g.fillStyle(shade(color, 0.72)).fillPoints(right, true);
  g.lineStyle(1, edge, 0.9);
  for (const poly of [top, left, right]) g.strokePoints(poly, true);
  if (!mark) return;
  // A mark set into the long face: a quad between u0..u1 across the face and v0..v1 down it.
  const onLeft = face !== 'right';
  const p = (u: number, v: number): Pt =>
    onLeft ? { x: u * (w / 2), y: t0 + d / 2 + u * (d / 2) + v * height } : { x: w / 2 + u * (w / 2), y: t0 + d - u * (d / 2) + v * height };
  const marks: Record<Mark, [number, number, number, number, number]> = {
    door: [0.28, 0.72, 0.22, 1, 0x22241f],
    window: [0.28, 0.72, 0.2, 0.55, 0xb8b8ae],
    beam: [0.44, 0.56, 0, 1, shade(color, 0.6)],
    board: [0.12, 0.88, 0.42, 0.62, shade(color, 0.8)],
  };
  const [u0, u1, v0, v1, fill] = marks[mark];
  const quad = [p(u0, v0), p(u1, v0), p(u1, v1), p(u0, v1)];
  g.fillStyle(fill, 1).fillPoints(quad, true);
  g.lineStyle(1, edge, 0.9).strokePoints(quad, true);
}

/** Makes one texture per placeholder key; keys with final art are left to the loader. */
export function ensureTextures(scene: Phaser.Scene): void {
  for (const [key, e] of Object.entries(MANIFEST)) {
    if (!e.placeholder || e.status === 'final' || scene.textures.exists(key)) continue;
    const [w, h] = e.size;
    const color = hex(e.placeholder.color);
    const g = scene.make.graphics({}, false);
    const edge = 0x1a1c19;
    switch (e.placeholder.shape) {
      case 'diamond':
        g.fillStyle(color).fillPoints([{ x: w / 2, y: 0 }, { x: w, y: h / 2 }, { x: w / 2, y: h }, { x: 0, y: h / 2 }], true);
        g.lineStyle(1, edge, 0.35).strokePoints([{ x: w / 2, y: 0 }, { x: w, y: h / 2 }, { x: w / 2, y: h }, { x: 0, y: h / 2 }], true);
        break;
      case 'ring':
        g.lineStyle(2, color).strokePoints([{ x: w / 2, y: 1 }, { x: w - 1, y: h / 2 }, { x: w / 2, y: h - 1 }, { x: 1, y: h / 2 }], true);
        break;
      case 'capsule':
        g.fillStyle(color).fillRoundedRect(0, 0, w, h, Math.min(w, h) / 2);
        g.lineStyle(1, edge).strokeRoundedRect(0.5, 0.5, w - 1, h - 1, Math.min(w, h) / 2);
        break;
      case 'box':
        g.fillStyle(color).fillRect(0, 0, w, h);
        g.lineStyle(1, edge).strokeRect(0.5, 0.5, w - 1, h - 1);
        break;
      case 'ellipse':
        g.fillStyle(color, 0.85).fillEllipse(w / 2, h / 2, w, h);
        break;
      case 'spire': // a tall tree: a narrow triangle on a thin trunk, so the ground between trees stays visible
        g.fillStyle(shade(color, 0.8)).fillRect(w * 0.45, h * 0.6, w * 0.1, h * 0.4);
        g.fillStyle(color).fillTriangle(w / 2, 0, w * 0.85, h * 0.72, w * 0.15, h * 0.72);
        g.lineStyle(1, edge).strokeTriangle(w / 2, 0, w * 0.85, h * 0.72, w * 0.15, h * 0.72);
        break;
      case 'post': // a dead snag: a bare trunk
        g.fillStyle(color).fillRect(w * 0.4, h * 0.05, w * 0.2, h * 0.95);
        g.lineStyle(1, edge).strokeRect(w * 0.4, h * 0.05, w * 0.2, h * 0.95);
        break;
      case 'strip': { // a band running down-right, its top edge from the top-left corner: a roof ridge or trim
        const t = e.placeholder.h ?? h - w / 2;
        const band = [{ x: 0, y: 0 }, { x: w, y: w / 2 }, { x: w, y: w / 2 + t }, { x: 0, y: t }];
        g.fillStyle(color).fillPoints(band, true);
        g.lineStyle(1, edge).strokePoints(band, true);
        break;
      }
      case 'cube':
        drawCube(g, w, h, color, e.placeholder.h ?? h - w / 2, e.placeholder.mark, e.placeholder.face);
        break;
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }
}
