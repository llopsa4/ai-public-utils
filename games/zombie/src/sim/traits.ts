// Survivor traits (DESIGN §5, §14): one passive, always-on trait each. Cass runs silently (her run noise
// radius is 0); Eli runs at 6.5 tiles/s, the fastest survivor; Ray tracks zombies within 6 tiles and June draws her bow
// in 0.75 s (`trackedEnemies` below; Quick draw is `cooldownOf` in combat.ts). The numbers live in data/characters.json
// (`moveNoise` per survivor overrides the shared one; `speed.run`); this file only reads them.
import chars from '../data/characters.json';
import type { Enemy, MissionState } from './mission';
import type { Mode } from './vision';

export type TraitKind = 'fighter' | 'scout' | 'hunter' | 'archer';

/** The noise radius of a step: the survivor's own `moveNoise` for that mode when it has one, else the shared one. */
export function moveNoiseOf(kind: TraitKind, mode: Mode): number {
  const own = (chars[kind] as { moveNoise?: Partial<Record<Mode, number>> }).moveNoise;
  return own?.[mode] ?? chars.moveNoise[mode];
}

/** Ray's Tracker (DESIGN §5): the living enemies within his radius of any living Tracker, which the scene marks even behind walls. */
export function trackedEnemies(s: Pick<MissionState, 'survivors' | 'enemies'>): Enemy[] {
  const r = chars.hunter.tracker.radius;
  const trackers = s.survivors.filter((u) => u.hp > 0 && 'tracker' in chars[u.kind]);
  if (!trackers.length) return [];
  return s.enemies.filter((e) => e.hp > 0 && trackers.some((u) => Math.hypot(e.x - u.x, e.y - u.y) <= r + 1e-9));
}

/** The trait line shown on the squad card on hover and in the Mission 1 start hint, keyed by the name the player sees. */
export function traitLine(name: string): string {
  if (name === 'Cass' && moveNoiseOf('fighter', 'run') === 0) return 'Cass runs silently: her running makes no noise.';
  if (name === 'Eli') return `Eli is the fastest runner: ${chars.scout.speed.run} tiles/s.`;
  if (name === 'Ray') return `Ray is a Tracker: zombies within ${chars.hunter.tracker.radius} tiles of him always show, even behind walls.`;
  if (name === 'June') return `June has a quick draw: her bow is ready again in ${chars.archer.quickDraw.bowCooldown} s.`;
  return '';
}
