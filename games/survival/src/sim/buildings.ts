// Buildings (DESIGN-slice.md `## Buildings`): placement, construction sites, workers, auto-work.
// Pure TypeScript, no Phaser. The person-level walking and working is in jobs.ts.
import buildingsData from '../data/buildings.json';
import jobsData from '../data/jobs.json';
import { canWork, idleTask, releaseJob, walkable } from './people';
import {
  addBuilding, addMessage, footprint, type Building, type GameState, type Job, type JobKind, type Person, type Res,
  type Tile2,
} from './state';

export interface BuildingDef {
  size: [number, number];
  hp?: number;
  buildable?: boolean;
  cost?: Partial<Record<Res, number>>;
  buildPoints?: number;
  houses?: number;
  workers?: number;
  job?: JobKind;
  society?: string;
  caps?: Record<Res, number>;
}

export const buildingDefs = buildingsData.types as unknown as Record<string, BuildingDef>;
/** The types the player can place, in menu order. */
export const BUILDABLE = Object.keys(buildingDefs).filter((k) => buildingDefs[k].buildable !== false);

const NAMES: Record<string, string> = {
  tipi: 'tipi', gathering_spot: 'gathering spot', hunting_lodge: 'hunting lodge', store: 'store', fire: 'fire',
};
export function buildingName(type: string): string {
  return NAMES[type] ?? type;
}

function campCentre(s: GameState): Tile2 {
  return [s.map.fire[0] + 1, s.map.fire[1] + 1];
}

/** Why a building cannot be placed there (a short sentence), or null when it can. */
export function placementError(s: GameState, type: string, x: number, y: number): string | null {
  const def = buildingDefs[type];
  if (!def || def.buildable === false || !def.cost) return "Can't build that.";
  const [cx, cy] = campCentre(s);
  const tiles = footprint(x, y);
  if (tiles.some(([tx, ty]) => tx < 0 || ty < 0 || tx >= s.map.size || ty >= s.map.size)) return 'Outside the map.';
  for (const [tx, ty] of tiles) {
    if (s.map.tiles[ty * s.map.size + tx] !== buildingsData.placement.tile) return 'Needs open grass.';
    if (Math.max(Math.abs(tx - cx), Math.abs(ty - cy)) > buildingsData.placement.maxDistFromFire) {
      return 'Too far from the fire.';
    }
    if (s.blocked[ty * s.map.size + tx]) return 'Something is in the way.';
  }
  for (const res of Object.keys(def.cost) as Res[]) {
    if (s.store[res] < (def.cost[res] ?? 0)) return `Not enough ${res}.`;
  }
  return null;
}

/** Places a construction site and takes its whole cost from the store at once. */
export function placeBuilding(s: GameState, type: string, x: number, y: number): { building?: Building; error?: string } {
  const error = placementError(s, type, x, y);
  if (error) {
    addMessage(s, error);
    return { error };
  }
  const cost = buildingDefs[type].cost!;
  for (const res of Object.keys(cost) as Res[]) s.store[res] -= cost[res] ?? 0;
  return { building: addBuilding(s, type, x, y, false) };
}

/** Cancels a construction site: the full cost is refunded and the tiles are freed. */
export function cancelSite(s: GameState, id: number): boolean {
  const i = s.buildings.findIndex((b) => b.id === id);
  if (i < 0 || s.buildings[i].done) {
    addMessage(s, "Only a building site can be cancelled.");
    return false;
  }
  const b = s.buildings[i];
  const cost = buildingDefs[b.type].cost ?? {};
  for (const res of Object.keys(cost) as Res[]) s.store[res] += cost[res] ?? 0;
  for (const [tx, ty] of footprint(b.x, b.y)) s.blocked[ty * s.map.size + tx] = false;
  s.buildings.splice(i, 1);
  for (const p of s.people) {
    if (p.job?.building === id) {
      releaseJob(p);
      p.task = idleTask();
    }
  }
  return true;
}

export function materialsComplete(b: Building): boolean {
  const cost = buildingDefs[b.type].cost ?? {};
  return (Object.keys(cost) as Res[]).every((res) => (b.delivered[res] ?? 0) >= (cost[res] ?? 0) - 1e-9);
}

/** The next load a hauler should fetch for a site, net of what other haulers already carry. */
export function nextHaulLoad(s: GameState, site: Building, selfId: number): { res: Res; amount: number } | null {
  const cost = buildingDefs[site.type].cost ?? {};
  for (const res of Object.keys(cost) as Res[]) {
    let remaining = (cost[res] ?? 0) - (site.delivered[res] ?? 0);
    for (const q of s.people) {
      if (q.id !== selfId && q.job?.kind === 'haul' && q.job.building === site.id && q.carry.res === res) {
        remaining -= q.carry.amount;
      }
    }
    if (remaining > 1e-9) return { res, amount: Math.min(jobsData.jobs.haul.carry, remaining) };
  }
  return null;
}

/** How many people hold a job of this kind on a building (not counting `exceptId`). */
export function countJobs(s: GameState, buildingId: number, kind: JobKind, exceptId = -1): number {
  return s.people.filter((p) => p.id !== exceptId && p.job?.kind === kind && p.job.building === buildingId).length;
}

/** The free walkable tile beside a 2x2 building that is closest to `from`. */
export function ringSpot(s: GameState, from: { x: number; y: number }, b: Building): Tile2 | null {
  let spot: Tile2 | null = null;
  let bestD = Infinity;
  for (let y = b.y - 1; y <= b.y + 2; y++) {
    for (let x = b.x - 1; x <= b.x + 2; x++) {
      if (x >= b.x && x <= b.x + 1 && y >= b.y && y <= b.y + 1) continue;
      if (!walkable(s, x, y)) continue;
      const d = Math.hypot(x - from.x, y - from.y);
      if (d < bestD) {
        bestD = d;
        spot = [x, y];
      }
    }
  }
  return spot;
}

/** The nearest completed building of a type. */
export function nearestBuilding(s: GameState, from: { x: number; y: number }, type: string): Building | null {
  let best: Building | null = null;
  let bestD = Infinity;
  for (const b of s.buildings) {
    if (b.type !== type || !b.done) continue;
    const d = Math.hypot(b.x + 0.5 - from.x, b.y + 0.5 - from.y);
    if (d < bestD) {
      bestD = d;
      best = b;
    }
  }
  return best;
}

/**
 * Work an idle, undrafted adult takes by itself: haul to the nearest site that still needs material
 * (max 2 haulers), else build the nearest site whose material is in (max 3 builders).
 */
export function findAutoWork(s: GameState, p: Person): Job | null {
  if (p.drafted || !canWork(p, 'haul')) return null;
  const sites = s.buildings
    .filter((b) => !b.done)
    .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y) || a.id - b.id);
  for (const site of sites) {
    if (countJobs(s, site.id, 'haul') < jobsData.jobs.haul.maxPerSite && nextHaulLoad(s, site, p.id)) {
      return { kind: 'haul', building: site.id, tile: null };
    }
  }
  for (const site of sites) {
    if (materialsComplete(site) && countJobs(s, site.id, 'build') < jobsData.jobs.build.maxPerSite) {
      return { kind: 'build', building: site.id, tile: null };
    }
  }
  return null;
}

/**
 * Puts people to work in a finished gathering spot or hunting lodge, up to its worker limit.
 * Returns how many were taken; the rest are refused with a message.
 */
export function assignWorkers(s: GameState, ids: number[], buildingId: number): number {
  const b = s.buildings.find((q) => q.id === buildingId);
  const def = b && buildingDefs[b.type];
  if (!b || !def?.job || !def.workers) {
    addMessage(s, 'Nobody can work there.');
    return 0;
  }
  if (!b.done) {
    addMessage(s, `The ${buildingName(b.type)} is not finished.`);
    return 0;
  }
  let taken = 0;
  let refusedFull = false;
  for (const id of ids) {
    const p = s.people.find((q) => q.id === id);
    if (!p || p.drafted) continue;
    if (!canWork(p, def.job)) {
      addMessage(s, `${p.name} can't work at the ${buildingName(b.type)}.`);
      continue;
    }
    if (p.job?.building === b.id && p.job.kind === def.job) continue;
    if (countJobs(s, b.id, def.job) >= def.workers) {
      refusedFull = true;
      continue;
    }
    releaseJob(p);
    p.job = { kind: def.job, building: b.id, tile: null };
    p.task = idleTask();
    if (def.society) p.society = def.society;
    taken++;
  }
  if (refusedFull) addMessage(s, `The ${buildingName(b.type)} is full.`);
  syncWorkers(s);
  return taken;
}

/** Rebuilds each working building's `workers` list from the people's jobs. */
export function syncWorkers(s: GameState): void {
  for (const b of s.buildings) {
    const def = buildingDefs[b.type];
    if (!def.job) continue;
    b.workers = s.people.filter((p) => p.job?.building === b.id && p.job.kind === def.job).map((p) => p.id);
  }
}
