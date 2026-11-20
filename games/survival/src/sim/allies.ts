// Allies from the Spirit powers (DESIGN-upgrades-3.md `## Spirit lodge and powers`): spirit warriors and
// guardian wolves appear at the fire, fight the nearest wolf in sight for 600 ticks, then vanish. They never
// harm people. Pure TypeScript, no Phaser. Allies are not saved (saving is parked, user 2026-11-20).
import enemyData from '../data/enemies.json';
import { rngNext } from './rng';
import type { Ally, Enemy, GameState } from './state';

export interface AllyDef {
  power: string;
  count: number;
  ticks: number;
  hp: number;
  range: number;
  damage: number;
  cooldown: number;
  accuracy: number;
  speed: number;
  sight: number;
}

export const ALLIES = enemyData.allies as Record<Ally['kind'], AllyDef>;

/** The allies of a state; a file saved before allies existed has none, so the list is made on first use. */
export const alliesOf = (s: GameState): Ally[] => (s.allies ??= []);

/** The ally kind a power calls, or undefined for a power that calls none (bison, storm). */
export const allyKindOf = (power: string): Ally['kind'] | undefined =>
  (Object.keys(ALLIES) as Ally['kind'][]).find((k) => ALLIES[k].power === power);

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

function fireCentre(s: GameState): [number, number] {
  return [s.map.fire[0] + 1, s.map.fire[1] + 1];
}

/** Calls the allies of a power around the fire. Returns how many came (0 for a power with no allies). */
export function callAllies(s: GameState, power: string): number {
  const kind = allyKindOf(power);
  if (!kind) return 0;
  const def = ALLIES[kind];
  const [fx, fy] = fireCentre(s);
  const list = alliesOf(s);
  for (let i = 0; i < def.count; i++) {
    const angle = (i / def.count) * Math.PI * 2;
    list.push({
      id: s.nextEnemyId++, kind, x: fx + Math.cos(angle) * 2, y: fy + Math.sin(angle) * 2,
      hp: def.hp, cooldown: 0, expires: s.tick + def.ticks,
    });
  }
  return def.count;
}

function stepToward(a: Ally, speed: number, x: number, y: number): void {
  const d = Math.hypot(x - a.x, y - a.y);
  if (d <= speed) {
    a.x = x;
    a.y = y;
  } else {
    a.x += ((x - a.x) / d) * speed;
    a.y += ((y - a.y) / d) * speed;
  }
}

/** The nearest wolf in sight; one already running away only counts when it is within reach. */
function pickEnemy(s: GameState, a: Ally, def: AllyDef): Enemy | null {
  let best: Enemy | null = null;
  let bestD = Infinity;
  for (const e of s.enemies) {
    if (e.hp <= 0) continue;
    const d = dist(a, e);
    if (d > def.sight || (e.fleeing && d > def.range)) continue;
    if (d < bestD) {
      best = e;
      bestD = d;
    }
  }
  return best;
}

/** One tick for every ally: strike or close in on the nearest wolf, else wait near the fire; gone when spent or dead. */
export function stepAllies(s: GameState): void {
  const list = alliesOf(s);
  if (list.length === 0) return;
  const [fx, fy] = fireCentre(s);
  for (const a of list) {
    const def = ALLIES[a.kind];
    if (a.cooldown > 0) a.cooldown--;
    const target = pickEnemy(s, a, def);
    if (!target) {
      if (Math.hypot(fx - a.x, fy - a.y) > 2.5) stepToward(a, def.speed, fx, fy);
      continue;
    }
    if (dist(a, target) <= def.range) {
      if (a.cooldown <= 0) {
        if (rngNext(s.rng) < def.accuracy) target.hp -= def.damage;
        a.cooldown = def.cooldown;
      }
    } else {
      stepToward(a, def.speed, target.x, target.y);
    }
  }
  s.allies = list.filter((a) => a.hp > 0 && s.tick < a.expires);
}
