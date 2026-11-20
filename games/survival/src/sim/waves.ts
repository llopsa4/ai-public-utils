// Waves (DESIGN-slice.md `## Waves`): a warning 30 s ahead, wolves spawning along one map edge,
// and the end of the run. Pure TypeScript, no Phaser.
import wavesData from '../data/waves.json';
import mapConfig from '../data/map.json';
import { standsAt } from './buildings';
import { ENEMIES } from './combat';
import { rngNext } from './rng';
import { addMessage, type Edge, type GameState, type Tile2, type WaveRun } from './state';

const TILE = mapConfig.tiles as Record<string, { passable: boolean }>;

/** Spawn tiles on an edge: passable tiles of the segment around `centre`, widening if it is all water. */
function edgeTiles(s: GameState, edge: Edge, centre: number, spread: number): Tile2[] {
  const n = s.map.size;
  const at = (k: number): Tile2 => (edge === 'north' ? [k, 0] : edge === 'south' ? [k, n - 1] : [n - 1, k]);
  for (let extra = 0; extra < n; extra++) {
    const lo = centre - Math.floor((spread - 1) / 2) - extra;
    const hi = centre + Math.ceil((spread - 1) / 2) + extra;
    const tiles: Tile2[] = [];
    for (let k = Math.max(0, lo); k <= Math.min(n - 1, hi); k++) {
      const t = at(k);
      if (TILE[s.map.tiles[t[1] * n + t[0]]].passable) tiles.push(t);
    }
    if (tiles.length > 0) return tiles;
  }
  return [at(centre)];
}

/** True when a completed scouts' lodge has at least one scout standing at it (DESIGN-upgrades-2.md). */
export function scoutsStaffed(s: GameState): boolean {
  return s.buildings.some(
    (b) => b.type === 'scouts_lodge' && b.done && s.people.some((p) => p.job?.kind === 'scout' && p.job.building === b.id && standsAt(p, b)),
  );
}

/** "9 and a leader": the wolves of a wave and its pack leaders, as a scouted banner says it. */
function countText(i: number): string {
  const groups = wavesData.waves[i].groups;
  const count = (kind: string): number => groups.filter((g) => g.enemy === kind).reduce((n, g) => n + g.count, 0);
  const wolves = count('wolf');
  const leaders = count('pack_leader');
  return leaders === 0 ? `${wolves}` : leaders === 1 ? `${wolves} and a leader` : `${wolves} and ${leaders} leaders`;
}

/** "north" or "north and east": where a wave comes from. */
function edgeText(run: WaveRun): string {
  return run.edge2 ? `${run.edge} and ${run.edge2}` : `${run.edge}`;
}

function warn(s: GameState, i: number, scouted: boolean): void {
  const run = s.waves[i];
  run.scouted = scouted;
  const jitter = wavesData.edgeJitter;
  const pickCentre = (): number => Math.floor(s.map.size / 2) + Math.floor(rngNext(s.rng) * (2 * jitter + 1)) - jitter;
  run.edge = wavesData.edges[Math.floor(rngNext(s.rng) * wavesData.edges.length)] as Edge;
  run.centre = pickCentre();
  run.edge2 = null;
  if (((wavesData.waves[i] as { edges?: number }).edges ?? 1) >= 2) {
    const others = wavesData.edges.filter((e) => e !== run.edge);
    run.edge2 = others[Math.floor(rngNext(s.rng) * others.length)] as Edge;
    run.centre2 = pickCentre();
  }
  run.phase = 'warning';
  s.powersUsed = []; // the spirit powers recharge when a wave warning starts
  addMessage(s, scouted ? `Scouts: wolves coming from the ${edgeText(run)}: ${countText(i)}.` : `Scouts: wolves coming from the ${edgeText(run)}.`);
}

function spawn(s: GameState, i: number): void {
  const run = s.waves[i];
  const def = wavesData.waves[i];
  const sides = [edgeTiles(s, run.edge!, run.centre, def.spread)];
  if (run.edge2) sides.push(edgeTiles(s, run.edge2, run.centre2 ?? run.centre, def.spread));
  for (const group of def.groups) {
    for (let k = 0; k < group.count; k++) {
      // Each group is split evenly between the sides; with an odd count the first side gets the extra one.
      const tiles = sides[k % sides.length];
      const [x, y] = tiles[Math.floor(rngNext(s.rng) * tiles.length)];
      s.enemies.push({
        id: s.nextEnemyId++, kind: group.enemy, x, y, hp: ENEMIES[group.enemy].hp, cooldown: 0, fleeing: false, wave: i,
      });
    }
  }
  run.phase = 'active';
}

/** Runs once per tick, after `s.tick` has advanced: warnings, arrivals, wave end and the run's result. */
export function stepWaves(s: GameState): void {
  wavesData.waves.forEach((def, i) => {
    const run = s.waves[i];
    if (run.phase === 'pending' && s.tick === def.at - wavesData.scoutedWarningTicks && scoutsStaffed(s)) warn(s, i, true);
    else if (run.phase === 'pending' && s.tick >= def.at - wavesData.warningTicks) warn(s, i, false);
    if (run.phase === 'warning' && s.tick >= def.at) spawn(s, i);
    if (run.phase === 'active' && !s.enemies.some((e) => e.wave === i)) {
      run.phase = 'defeated';
      addMessage(s, `Wave ${i + 1} is defeated.`);
    }
  });
  const fire = s.buildings.find((b) => b.type === 'fire');
  if (s.people.length === 0 || (fire?.hp != null && fire.hp <= 0)) s.result = 'lost';
  else if (s.waves[wavesData.winAfterWave - 1].phase === 'defeated') s.result = 'won';
}

/** What the wave banner shows: the warning with its countdown, or the wave under way; null otherwise. */
export function waveBanner(s: GameState): { text: string; seconds: number | null } | null {
  for (let i = 0; i < s.waves.length; i++) {
    const run = s.waves[i];
    if (run.phase === 'warning') {
      const seconds = Math.max(0, Math.ceil((wavesData.waves[i].at - s.tick) / 10));
      const text = run.scouted ? `Wolves from the ${edgeText(run)}: ${countText(i)}` : `Scouts: wolves coming from the ${edgeText(run)}`;
      return { text, seconds };
    }
  }
  const active = s.waves.findIndex((w) => w.phase === 'active');
  return active >= 0 ? { text: `Wave ${active + 1}`, seconds: null } : null;
}
