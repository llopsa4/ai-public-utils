// Buildings (DESIGN-slice.md `## Buildings`): placement, construction sites, workers, auto-work.
// Pure TypeScript, no Phaser. The person-level walking and working is in jobs.ts.
import buildingsData from '../data/buildings.json';
import jobsData from '../data/jobs.json';
import { canWork, idleTask, releaseJob, walkable } from './people';
import {
  addBuilding, addMessage, footprintOf, type Building, type GameState, type Job, type JobKind, type Person, type Res,
  type Tile2,
} from './state';
import { campCentre } from './map';
import { heldTiles } from './occupancy';
import { upgradeLabel, type UpgradeId } from './upgrades';

export interface BuildingDef {
  size: [number, number];
  /** The Dakota word for the label, empty until the user approves one in CULTURE.md. */
  dakota?: string;
  hp?: number;
  buildable?: boolean;
  /** The Build menu page the type is on: Camp or Societies (Tab switches). */
  page?: 'camp' | 'societies';
  cost?: Partial<Record<Res, number>>;
  buildPoints?: number;
  houses?: number;
  workers?: number;
  job?: JobKind;
  society?: string;
  /** Placed by dragging a straight line of 1x1 segments, each its own site (the barricade). */
  line?: boolean;
  /** An upgrade id that must be bought before this can be placed. */
  requires?: string;
  caps?: Record<Res, number>;
}

export const buildingDefs = buildingsData.types as unknown as Record<string, BuildingDef>;
/** The types the player can place, in menu order. */
export const BUILDABLE = Object.keys(buildingDefs).filter((k) => buildingDefs[k].buildable !== false);

const NAMES: Record<string, string> = {
  tipi: 'tipi', gathering_spot: 'gathering spot', hunting_lodge: 'hunting lodge', store: 'store', fire: 'fire',
  drying_rack: 'drying rack', horse_corral: 'horse corral', healers_lodge: "healers' lodge",
  scouts_lodge: "scouts' lodge", lancers_lodge: "lancers' lodge", archers_lodge: "archers' lodge",
  trap: 'trap', fire_pit: 'fire pit', barricade: 'barricade', spirit_lodge: 'spirit lodge',
};
export function buildingName(type: string): string {
  return NAMES[type] ?? type;
}

/** Why a building cannot be placed there (a short sentence), or null when it can. */
export function placementError(s: GameState, type: string, x: number, y: number): string | null {
  const def = buildingDefs[type];
  if (!def || def.buildable === false || !def.cost) return "Can't build that.";
  if (def.requires && !s.upgrades.includes(def.requires)) return `Needs the ${upgradeLabel(def.requires as UpgradeId)}.`;
  const [cx, cy] = campCentre(s.map);
  const tiles = footprintOf(type, x, y);
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

/**
 * The tiles of a line dragged from a to b: horizontal, vertical or diagonal on the tile grid, whichever is
 * nearest the drag, starting at a.
 */
export function lineTiles(a: Tile2, b: Tile2): Tile2[] {
  let dx = b[0] - a[0];
  let dy = b[1] - a[1];
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax >= 2 * ay) dy = 0;
  else if (ay >= 2 * ax) dx = 0;
  else {
    const len = Math.max(ax, ay);
    dx = Math.sign(dx) * len;
    dy = Math.sign(dy) * len;
  }
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  const out: Tile2[] = [];
  for (let i = 0; i <= steps; i++) out.push([a[0] + Math.sign(dx) * i, a[1] + Math.sign(dy) * i]);
  return out;
}

/**
 * Which tiles of a dragged line can take a site: each must pass `placementError`, and the store pays for the
 * segments in order until it runs short. `error` is the first refusal, for a toast when nothing fits.
 */
export function lineSites(s: GameState, type: string, a: Tile2, b: Tile2): { tiles: Tile2[]; ok: boolean[]; error: string | null } {
  const tiles = lineTiles(a, b);
  const cost = buildingDefs[type]?.cost ?? {};
  let afford = Infinity;
  for (const res of Object.keys(cost) as Res[]) if (cost[res]) afford = Math.min(afford, Math.floor(s.store[res] / cost[res]!));
  let error: string | null = null;
  let taken = 0;
  const ok = tiles.map(([x, y]) => {
    const e = placementError(s, type, x, y) ?? (taken >= afford ? `Not enough ${(Object.keys(cost) as Res[]).find((r) => s.store[r] < (taken + 1) * (cost[r] ?? 0))}.` : null);
    if (e) {
      error ??= e;
      return false;
    }
    taken++;
    return true;
  });
  return { tiles, ok, error };
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

/**
 * The next site of a barricade line for one of its builders (DESIGN-hunting.md `## Villager panel and building`): the
 * first unfinished segment of the same line, in placing order, that has room for another builder; null when none.
 */
export function nextLineSite(s: GameState, site: Building, selfId: number): Building | null {
  if (site.lineId === undefined) return null;
  return s.buildings
    .filter((b) => b.lineId === site.lineId && !b.done && b.id !== site.id)
    .sort((a, b) => a.id - b.id)
    .find((b) => countJobs(s, b.id, 'build', selfId) < jobsData.jobs.build.maxPerSite) ?? null;
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
  removeBuilding(s, id);
  return true;
}

/** Takes a building out of the camp: its tiles are free again and anyone working on it is released. */
export function removeBuilding(s: GameState, id: number): void {
  const i = s.buildings.findIndex((b) => b.id === id);
  if (i < 0) return;
  const b = s.buildings[i];
  for (const [tx, ty] of footprintOf(b.type, b.x, b.y)) s.blocked[ty * s.map.size + tx] = false;
  s.buildings.splice(i, 1);
  for (const p of s.people) {
    if (p.job?.building === id) {
      releaseJob(p);
      p.task = idleTask();
    }
  }
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

/** True when a site still needs some of `res` (loads on their way not counted). */
function hauls(site: Building, res: Res): boolean {
  return (buildingDefs[site.type].cost?.[res] ?? 0) - (site.delivered[res] ?? 0) > 1e-9;
}

/** How many people hold a job of this kind on a building (not counting `exceptId`). */
export function countJobs(s: GameState, buildingId: number, kind: JobKind, exceptId = -1): number {
  return s.people.filter((p) => p.id !== exceptId && p.job?.kind === kind && p.job.building === buildingId).length;
}

/**
 * The walkable tile beside a building closest to `from`. With a person's `id`, tiles held by anyone else are
 * skipped (`occupancy.ts`): `'full'` when the ring has walkable tiles but all are held, null when it has none.
 */
export function ringState(s: GameState, from: { x: number; y: number; id?: number }, b: Building): Tile2 | 'full' | null {
  let spot: Tile2 | null = null;
  let bestD = Infinity;
  let any = false;
  const held = from.id === undefined ? null : heldTiles(s, from.id);
  const [w, h] = buildingDefs[b.type].size;
  for (let y = b.y - 1; y <= b.y + h; y++) {
    for (let x = b.x - 1; x <= b.x + w; x++) {
      if (x >= b.x && x < b.x + w && y >= b.y && y < b.y + h) continue;
      if (!walkable(s, x, y)) continue;
      any = true;
      if (held?.has(y * s.map.size + x)) continue;
      const d = Math.hypot(x - from.x, y - from.y);
      if (d < bestD) {
        bestD = d;
        spot = [x, y];
      }
    }
  }
  return spot ?? (any ? 'full' : null);
}

/** The free walkable tile beside a building that is closest to `from` (null when none is free). */
export function ringSpot(s: GameState, from: { x: number; y: number; id?: number }, b: Building): Tile2 | null {
  const r = ringState(s, from, b);
  return r === 'full' ? null : r;
}

/** True when the person stands on the ring of tiles round a building (where a ring walk ends). */
export function standsAt(p: { x: number; y: number }, b: Building): boolean {
  const x = Math.round(p.x);
  const y = Math.round(p.y);
  const [w, h] = buildingDefs[b.type].size;
  return x >= b.x - 1 && x <= b.x + w && y >= b.y - 1 && y <= b.y + h;
}

/** The council plaza (the fire), where idle people sit (DESIGN-hunting.md `## Council plaza`). */
export function plazaOf(s: { buildings: Building[] }): Building | undefined {
  return s.buildings.find((b) => b.type === 'fire' && b.done);
}

/** True when an undrafted person with no job stands still on the ring of the plaza: they sit. */
export function isSitting(p: Person, buildings: Building[]): boolean {
  if (p.drafted || p.job || p.task.step !== 'idle') return false;
  return buildings.some((b) => b.type === 'fire' && b.done && standsAt(p, b));
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
  // Hands already full (a full store, DESIGN-hunting.md `## Full store`): haul only to a site that needs that load.
  const holding = p.carry.amount > 1e-9 ? p.carry.res : (p.carry.hides ?? 0) > 1e-9 ? 'hides' : null;
  for (const site of sites) {
    const load = nextHaulLoad(s, site, p.id);
    if (countJobs(s, site.id, 'haul') < jobsData.jobs.haul.maxPerSite && load && (holding === null || hauls(site, holding))) {
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
