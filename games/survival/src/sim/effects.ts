// The bison charge and the storm (DESIGN-upgrades-3.md `## Spirit lodge and powers`): both are aimed at a
// clicked point and hurt wolves only, never people. Pure TypeScript, no Phaser. Not saved (saving is parked).
import enemyData from '../data/enemies.json';
import type { Enemy, GameState, PowerEffect, Tile2 } from './state';

const BISON = enemyData.powers.bison_charge;
const STORM = enemyData.powers.storm_caller;

/** The running effects of a state; a file saved before they existed has none, so the list is made on first use. */
export const effectsOf = (s: GameState): PowerEffect[] => (s.effects ??= []);

/** The power ids that make an effect rather than allies. */
export const isEffectPower = (power: string): boolean => power === 'bison_charge' || power === 'storm_caller';

export const STORM_RADIUS = STORM.radius;
export const BISON_HALF_WIDTH = BISON.halfWidth;

/** The unit direction a herd runs when aimed at `at`: away from the nearest map edge, across the map. */
export function bisonDirection(size: number, at: Tile2): Tile2 {
  const n = size - 1;
  const opts: [number, Tile2][] = [
    [at[0], [1, 0]], [n - at[0], [-1, 0]], [at[1], [0, 1]], [n - at[1], [0, -1]],
  ];
  return opts.reduce((a, b) => (b[0] < a[0] ? b : a))[1];
}

/** Starts the effect of a power at a point. Returns true when the power makes one (false for the ally powers). */
export function startEffect(s: GameState, power: string, at: Tile2 | undefined): boolean {
  if (!at || !isEffectPower(power)) return false;
  const n = s.map.size - 1;
  if (power === 'storm_caller') {
    effectsOf(s).push({ id: s.nextEnemyId++, kind: 'storm', x: at[0], y: at[1], dx: 0, dy: 0, expires: s.tick + STORM.ticks, hit: [] });
    return true;
  }
  const [dx, dy] = bisonDirection(s.map.size, at);
  // The herd starts on the edge, on the line through the point, and runs the whole way across.
  const x = dx > 0 ? 0 : dx < 0 ? n : at[0];
  const y = dy > 0 ? 0 : dy < 0 ? n : at[1];
  effectsOf(s).push({
    id: s.nextEnemyId++, kind: 'bison', x, y, dx, dy, expires: s.tick + Math.ceil(n / BISON.speed) + 1, hit: [],
  });
  return true;
}

/** 0.4 for a wolf inside any running storm (storms do not stack), else 1. */
export function stormSlow(s: GameState, e: Enemy): number {
  return effectsOf(s).some((f) => f.kind === 'storm' && Math.hypot(e.x - f.x, e.y - f.y) <= STORM.radius) ? STORM.speedFactor : 1;
}

/** One tick: herds move and hit the wolves they touch once; storms hurt the wolves inside; spent effects go. */
export function stepEffects(s: GameState): void {
  const list = effectsOf(s);
  if (list.length === 0) return;
  for (const f of list) {
    if (f.kind === 'bison') {
      f.x += f.dx * BISON.speed;
      f.y += f.dy * BISON.speed;
      for (const e of s.enemies) {
        if (e.hp <= 0 || f.hit.includes(e.id)) continue;
        // `along` is the distance ahead of or behind the herd, `across` the distance from the lane's middle.
        const along = (e.x - f.x) * f.dx + (e.y - f.y) * f.dy;
        const across = Math.abs((e.x - f.x) * f.dy - (e.y - f.y) * f.dx);
        if (across <= BISON.halfWidth && Math.abs(along) <= BISON.depth) {
          e.hp -= BISON.damage;
          f.hit.push(e.id);
        }
      }
    } else {
      for (const e of s.enemies) {
        if (e.hp > 0 && Math.hypot(e.x - f.x, e.y - f.y) <= STORM.radius) e.hp -= STORM.damagePerTick;
      }
    }
  }
  s.effects = list.filter((f) => s.tick < f.expires);
}
