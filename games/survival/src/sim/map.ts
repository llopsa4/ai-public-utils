// Map generation from a seed (DESIGN-slice.md `## Map`). Pure TypeScript, no Phaser.
import buildingsData from '../data/buildings.json';
import { makeRng, rngNext } from './rng';

export type TileType = 'grass' | 'river' | 'ford' | 'forest' | 'berry';

export interface TileDef {
  cost: number;
  passable: boolean;
  buildable: boolean;
  wood?: number;
  food?: number;
  regrow?: number;
}

/** The parts of `src/data/map.json` the generator reads. */
export interface MapConfig {
  size: number;
  tiles: Record<string, TileDef>;
  river: { startMin: number; startSpan: number; width: number; clamp: number[]; fordRows: number[][] };
  forest: { clusters: number; minDistFromCamp: number; radius: number[]; density: number };
  berry: { patches: number; distFromCamp: number[]; tilesPerPatch: number };
  camp: { fire: number[]; clearRadius: number; prebuilt: { type: string; at: number[] }[] };
}

export interface GameMap {
  seed: number;
  size: number;
  /** Row-major, `tiles[y * size + x]`. */
  tiles: TileType[];
  /** Wood left on a forest tile / food on a berry tile, same indexing. */
  amount: number[];
  /** Top-left tile of the central fire (its size is in `buildings.json`). */
  fire: [number, number];
  prebuilt: { type: string; at: [number, number] }[];
}

/** Half the side of the square council fire: 2 for the 4x4 plaza. */
export const FIRE_HALF = buildingsData.types.fire.size[0] / 2;

/**
 * The camp centre: the fire's top-left tile plus half its side (24, 24 for the slice). Every distance
 * "from the fire" (wolves' goal, flee, spawn, hunt spots, building range, allies) is measured from here.
 */
export function campCentre(map: { fire: [number, number] | number[] }): [number, number] {
  return [map.fire[0] + FIRE_HALF, map.fire[1] + FIRE_HALF];
}

export function tileIndex(map: { size: number }, x: number, y: number): number {
  return y * map.size + x;
}

export function inBounds(map: { size: number }, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < map.size && y < map.size;
}

export function generateMap(seed: number, cfg: MapConfig): GameMap {
  const n = cfg.size;
  const r = makeRng(seed);
  const rnd = () => rngNext(r);
  const int = (k: number) => Math.floor(rnd() * k);
  const idx = (x: number, y: number) => y * n + x;
  const tiles: TileType[] = new Array(n * n).fill('grass');
  const amount: number[] = new Array(n * n).fill(0);
  const ok = (x: number, y: number) => x >= 0 && y >= 0 && x < n && y < n;
  const water = (t: TileType) => t === 'river' || t === 'ford';
  const fire: [number, number] = [cfg.camp.fire[0], cfg.camp.fire[1]];
  const [cx0, cy0] = campCentre({ fire });
  const dist = (x: number, y: number) => Math.hypot(x - cx0, y - cy0);
  const cleared = (x: number, y: number) =>
    Math.max(Math.abs(x - cx0), Math.abs(y - cy0)) <= cfg.camp.clearRadius;

  // 1-2. River north to south through the west half.
  const { startMin, startSpan, width, clamp, fordRows } = cfg.river;
  let rx = startMin + int(startSpan);
  for (let y = 0; y < n; y++) {
    for (let w = 0; w < width; w++) tiles[idx(rx + w, y)] = 'river';
    const p = rnd();
    rx += p < 0.25 ? -1 : p < 0.75 ? 0 : 1;
    rx = Math.min(clamp[1], Math.max(clamp[0], rx));
  }

  // 3. Fords: both river tiles on two rows.
  for (const [base, span] of fordRows) {
    const y = base + int(span);
    for (let x = 0; x < n; x++) if (tiles[idx(x, y)] === 'river') tiles[idx(x, y)] = 'ford';
  }

  // 5. Forest clusters.
  const woodAmount = cfg.tiles.forest?.wood ?? 30;
  for (let c = 0; c < cfg.forest.clusters; c++) {
    let fx = 0;
    let fy = 0;
    for (let tries = 0; tries < 20; tries++) {
      fx = int(n);
      fy = int(n);
      if (dist(fx, fy) >= cfg.forest.minDistFromCamp && !water(tiles[idx(fx, fy)])) break;
    }
    const [rMin, rMax] = cfg.forest.radius;
    const radius = rMin + int(rMax - rMin + 1);
    for (let y = fy - radius; y <= fy + radius; y++) {
      for (let x = fx - radius; x <= fx + radius; x++) {
        if (!ok(x, y) || Math.hypot(x - fx, y - fy) > radius || water(tiles[idx(x, y)])) continue;
        if (rnd() < cfg.forest.density) {
          tiles[idx(x, y)] = 'forest';
          amount[idx(x, y)] = woodAmount;
        }
      }
    }
  }

  // 4. Camp clearing: no forest or berries near the fire (the river is never overwritten).
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (cleared(x, y) && (tiles[idx(x, y)] === 'forest' || tiles[idx(x, y)] === 'berry')) {
        tiles[idx(x, y)] = 'grass';
        amount[idx(x, y)] = 0;
      }
    }
  }

  // 6. Berry patches: centre, 4 orthogonal neighbours and (tilesPerPatch - 5) random diagonals.
  const berryAmount = cfg.tiles.berry?.food ?? 40;
  const [dMin, dMax] = cfg.berry.distFromCamp;
  const orth = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
  const diag = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (let p = 0; p < cfg.berry.patches; p++) {
    for (let tries = 0; tries < 400; tries++) {
      const px = 1 + int(n - 2);
      const py = 1 + int(n - 2);
      // Shuffle the diagonals (Fisher-Yates) and keep the first few.
      const d = diag.slice();
      for (let i = d.length - 1; i > 0; i--) {
        const j = int(i + 1);
        [d[i], d[j]] = [d[j], d[i]];
      }
      const dc = dist(px, py);
      if (dc < dMin || dc > dMax) continue;
      const cells = [...orth, ...d.slice(0, cfg.berry.tilesPerPatch - orth.length)].map(([dx, dy]) => [px + dx, py + dy]);
      const valid = cells.every(([x, y]) => {
        if (!ok(x, y) || cleared(x, y)) return false;
        const t = tiles[idx(x, y)];
        return t === 'grass' || t === 'forest';
      });
      if (!valid) continue;
      for (const [x, y] of cells) {
        tiles[idx(x, y)] = 'berry';
        amount[idx(x, y)] = berryAmount;
      }
      break;
    }
  }

  // 7. Start position: the fire and the prebuilt buildings are fixed in the data.
  return {
    seed,
    size: n,
    tiles,
    amount,
    fire,
    prebuilt: cfg.camp.prebuilt.map((b) => ({ type: b.type, at: [b.at[0], b.at[1]] as [number, number] })),
  };
}
