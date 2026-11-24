// Isometric 2:1 projection, one fixed view (DESIGN §10). Tile (x, y) centre -> world pixels; the
// world origin is offset so tile (0, 0) sits at (size * 32, 32) and the map is in positive space.
export const TILE_W = 64;
export const TILE_H = 32;

export function tileToWorld(x: number, y: number, size: number): { x: number; y: number } {
  return { x: (x - y) * (TILE_W / 2) + size * (TILE_W / 2), y: (x + y) * (TILE_H / 2) + TILE_H };
}

/** Fractional tile coordinates under a world point. */
export function worldToTileF(wx: number, wy: number, size: number): { x: number; y: number } {
  const sx = wx - size * (TILE_W / 2);
  const sy = wy - TILE_H;
  return { x: sy / TILE_H + sx / TILE_W, y: sy / TILE_H - sx / TILE_W };
}

/** The tile whose diamond contains a world point. */
export function worldToTile(wx: number, wy: number, size: number): { x: number; y: number } {
  const t = worldToTileF(wx, wy, size);
  return { x: Math.floor(t.x + 0.5), y: Math.floor(t.y + 0.5) };
}

/** World size of the whole map in pixels. */
export function worldBounds(size: number): { w: number; h: number } {
  return { w: size * TILE_W, h: size * TILE_H + TILE_H * 2 };
}
