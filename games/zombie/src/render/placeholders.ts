import Phaser from 'phaser';
import manifest from '../../art/manifest.json';

// Grey code stand-ins for every manifest key with a `placeholder` block (DEVELOPMENT.md
// *Art placeholders*). Claude never draws real art; Codex replaces keys with final art.
export type Shape = 'diamond' | 'capsule' | 'box' | 'ring' | 'ellipse';

export interface ManifestEntry {
  size: [number, number];
  anchor: [number, number];
  frames: number;
  status: 'placeholder' | 'final';
  placeholder?: { shape: Shape; color: string };
}

export const MANIFEST = manifest.keys as unknown as Record<string, ManifestEntry>;

export function anchorOf(key: string): [number, number] {
  return MANIFEST[key]?.anchor ?? [0.5, 0.5];
}

const hex = (c: string): number => parseInt(c.replace('#', ''), 16);

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
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }
}
