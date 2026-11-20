// No shared standing tile (DESIGN-hunting.md `## No shared standing tile`): anyone standing still holds a tile of
// their own; walkers may pass through each other but hold the tile they are walking to. Spot pickers skip held
// tiles. People are stepped in id order, so within a tick the lowest id claims a tile first. Pure, no rng.
import { walkable } from './people';
import type { GameState, Person, Tile2 } from './state';

/** The tile a person holds: a drafted person their post, a walker (or someone fleeing) their goal, else where they stand. */
export function heldTile(q: Person): Tile2 {
  if (q.drafted && q.post) return q.post;
  if (q.task.target) return q.task.target;
  return [Math.round(q.x), Math.round(q.y)];
}

/** Tile indices (`y * size + x`) held by everyone except `exceptIds`. */
export function heldTiles(s: GameState, ...exceptIds: number[]): Set<number> {
  const held = new Set<number>();
  for (const q of s.people) {
    if (exceptIds.includes(q.id)) continue;
    const [x, y] = heldTile(q);
    held.add(y * s.map.size + x);
  }
  return held;
}

export function isHeld(s: GameState, held: Set<number>, t: Tile2): boolean {
  return held.has(t[1] * s.map.size + t[0]);
}

/** The nearest walkable tile not in `held` (ties: row order), or null when the whole map is full. */
export function nearestFreeTile(s: GameState, from: { x: number; y: number } | Tile2, held: Set<number>): Tile2 | null {
  const fx = Array.isArray(from) ? from[0] : from.x;
  const fy = Array.isArray(from) ? from[1] : from.y;
  const n = s.map.size;
  let best: Tile2 | null = null;
  let bestD = Infinity;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (held.has(y * n + x) || !walkable(s, x, y)) continue;
      const d = Math.hypot(x - fx, y - fy);
      if (d < bestD - 1e-9) {
        bestD = d;
        best = [x, y];
      }
    }
  }
  return best;
}

/** `tile` when no one else holds it, else the nearest free tile beside it. */
export function freeTileAt(s: GameState, p: Person, tile: Tile2): Tile2 | null {
  const held = heldTiles(s, p.id);
  return isHeld(s, held, tile) ? nearestFreeTile(s, tile, held) : tile;
}
