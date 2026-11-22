// Pure minimap maths (no Phaser): DESIGN-map.md `## Minimap`. The minimap is the whole isometric map drawn at
// 1/32 scale: 192 x 96 px on the 96 x 96 map. One minimap pixel is 32 world pixels, so a tile is a 2 x 1 px diamond.
import { TILE_H, TILE_W, tileToWorld, worldToTile } from './iso';

/** World pixels per minimap pixel. */
export const MINI_SCALE = 32;

/** Minimap pixels of a map `size` tiles a side (tile (0, 0)'s top corner is at the top, (size - 1, 0)'s right corner at the right). */
export function miniSize(size: number): { w: number; h: number } {
  return { w: (size * TILE_W) / MINI_SCALE, h: (size * TILE_H) / MINI_SCALE };
}

/** A world point in minimap pixels. The world's top edge is half a tile above tile (0, 0)'s centre. */
export function worldToMini(wx: number, wy: number): { x: number; y: number } {
  return { x: wx / MINI_SCALE, y: (wy - TILE_H / 2) / MINI_SCALE };
}

export function miniToWorld(mx: number, my: number): { x: number; y: number } {
  return { x: mx * MINI_SCALE, y: my * MINI_SCALE + TILE_H / 2 };
}

/** Where a (fractional) tile's centre sits on the minimap. */
export function tileToMini(x: number, y: number, size: number): { x: number; y: number } {
  const w = tileToWorld(x, y, size);
  return worldToMini(w.x, w.y);
}

/** The tile under a minimap point, or null outside the map (the corners of the rectangle are empty). */
export function miniToTile(mx: number, my: number, size: number): { x: number; y: number } | null {
  const w = miniToWorld(mx, my);
  const t = worldToTile(w.x, w.y, size);
  return t.x < 0 || t.y < 0 || t.x >= size || t.y >= size ? null : t;
}

/** A rectangle in minimap pixels. */
export interface MiniRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The camera's visible world area (`x`, `y`, `width`, `height` in world pixels) as a minimap rectangle, clipped to the minimap. */
export function viewRect(view: { x: number; y: number; width: number; height: number }, size: number): MiniRect {
  const m = miniSize(size);
  const a = worldToMini(view.x, view.y);
  const b = worldToMini(view.x + view.width, view.y + view.height);
  const x0 = Math.max(0, Math.min(m.w, a.x));
  const y0 = Math.max(0, Math.min(m.h, a.y));
  const x1 = Math.max(0, Math.min(m.w, b.x));
  const y1 = Math.max(0, Math.min(m.h, b.y));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/**
 * RGBA pixels (row by row, `miniSize(size)` wide) of the terrain: each pixel takes the colour of the tile under its
 * centre; pixels outside the diamond are fully transparent. `colors` maps a tile type to 0xRRGGBB.
 */
export function terrainPixels(tiles: readonly string[], size: number, colors: Record<string, number>): Uint8ClampedArray<ArrayBuffer> {
  const m = miniSize(size);
  const out = new Uint8ClampedArray(m.w * m.h * 4);
  for (let py = 0; py < m.h; py++) {
    for (let px = 0; px < m.w; px++) {
      const t = miniToTile(px + 0.5, py + 0.5, size);
      if (!t) continue;
      const c = colors[tiles[t.y * size + t.x]];
      if (c === undefined) continue;
      const i = (py * m.w + px) * 4;
      out[i] = (c >> 16) & 0xff;
      out[i + 1] = (c >> 8) & 0xff;
      out[i + 2] = c & 0xff;
      out[i + 3] = 255;
    }
  }
  return out;
}
