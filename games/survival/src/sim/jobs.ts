// Jobs (DESIGN-slice.md `## Jobs`): a worker cycles walk -> work -> walk to the store -> deliver.
// Implemented: gather (berry tiles and gathering spots), chop, hunt, haul, build. Fight comes with C6.
import jobsData from '../data/jobs.json';
import upgradeData from '../data/upgrades.json';
import {
  buildingDefs, buildingName, findAutoWork, materialsComplete, nearestBuilding, nextHaulLoad, ringState, standsAt,
} from './buildings';
import { stepFighter, stepFlee } from './combat';
import { HUNGRY_AT, HUNGRY_WORK, unityWork } from './economy';
import { ages, beginWalk, canWork, idleTask, movePerson, releaseJob, walkable } from './people';
import { campCentre } from './map';
import { freeTileAt, heldTiles, isHeld, nearestFreeTile } from './occupancy';
import { rngNext } from './rng';
import { seasonal } from './seasons';
import {
  addMessage, horseCap, storeCap, type Building, type GameState, type Job, type JobKind, type Person, type Res, type Task, type Tile2,
} from './state';
import { buildSpeed, hasUpgrade } from './upgrades';

export { canWork };

const TILE_JOBS: Partial<Record<JobKind, { res: Res; tile: 'berry' | 'forest'; rate: number; carry: number }>> = {
  gather: { res: 'food', tile: 'berry', rate: jobsData.jobs.gather.rate, carry: jobsData.jobs.gather.carry },
  chop: { res: 'wood', tile: 'forest', rate: jobsData.jobs.chop.rate, carry: jobsData.jobs.chop.carry },
};
const RETRY = jobsData.storeRetryTicks;
const DRY = jobsData.jobs.dry;
const HEAL = jobsData.jobs.heal;

/** Work units per tick: base rate x age x Wotakuye x hunger (x1.5 at a gathering spot; gathering x the season). */
export function workRate(s: GameState, p: Person, kind: JobKind): number {
  const base = kind === 'build' ? jobsData.jobs.build.rate : TILE_JOBS[kind]?.rate;
  if (base === undefined || !canWork(p, kind)) return 0;
  let rate = base * ages[p.age].rate * unityWork(s) * (p.hunger >= HUNGRY_AT ? HUNGRY_WORK : 1);
  if (kind === 'build') rate *= buildSpeed(s);
  if (kind === 'gather') {
    rate *= seasonal(s, 'gatherRate');
    if (p.job?.building != null) rate *= jobsData.jobs.gather.spotBonus;
  }
  return rate;
}

function building(s: GameState, id: number | null): Building | undefined {
  return id === null ? undefined : s.buildings.find((b) => b.id === id);
}

function tileHasResource(s: GameState, job: Job): boolean {
  const def = TILE_JOBS[job.kind];
  if (!def || !job.tile) return false;
  const i = job.tile[1] * s.map.size + job.tile[0];
  return s.map.tiles[i] === def.tile && s.map.amount[i] > 1e-6;
}

/** The nearest forest tile with wood within `searchRadius` of a tile (ties: first in row order). */
function nearbyForest(s: GameState, from: Tile2): Tile2 | null {
  const r = jobsData.jobs.chop.searchRadius;
  let best: Tile2 | null = null;
  let bestD = Infinity;
  for (let y = from[1] - r; y <= from[1] + r; y++) {
    for (let x = from[0] - r; x <= from[0] + r; x++) {
      if (x < 0 || y < 0 || x >= s.map.size || y >= s.map.size) continue;
      const i = y * s.map.size + x;
      if (s.map.tiles[i] !== 'forest' || s.map.amount[i] <= 1e-6) continue;
      const d = Math.hypot(x - from[0], y - from[1]);
      if (d <= r && d < bestD) {
        bestD = d;
        best = [x, y];
      }
    }
  }
  return best;
}

/** The fullest berry tile within a gathering spot's radius (ties: first in row order). */
function pickSpotTile(s: GameState, spot: Building): Tile2 | null {
  const r = jobsData.jobs.gather.spotRadius;
  const cx = spot.x + 0.5;
  const cy = spot.y + 0.5;
  let best: Tile2 | null = null;
  let bestAmount = 1e-6;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if (x < 0 || y < 0 || x >= s.map.size || y >= s.map.size) continue;
      const i = y * s.map.size + x;
      if (s.map.tiles[i] !== 'berry' || Math.hypot(x - cx, y - cy) > r) continue;
      if (s.map.amount[i] > bestAmount) {
        bestAmount = s.map.amount[i];
        best = [x, y];
      }
    }
  }
  return best;
}

/** A random walkable tile 14..22 tiles from the fire where a hunt happens. */
function pickHuntSpot(s: GameState): Tile2 | null {
  const [lo, hi] = jobsData.jobs.hunt.spotDist;
  const [cx, cy] = campCentre(s.map);
  const spots: Tile2[] = [];
  for (let y = 0; y < s.map.size; y++) {
    for (let x = 0; x < s.map.size; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d >= lo && d <= hi && walkable(s, x, y)) spots.push([x, y]);
    }
  }
  return spots.length === 0 ? null : spots[Math.floor(rngNext(s.rng) * spots.length)];
}

/**
 * Waits for a free tile (DESIGN-hunting.md `## No shared standing tile`): stays put when no one else holds the
 * person's tile, else walks to the nearest free one; tries again after RETRY. The job is kept.
 */
function waitNearby(s: GameState, p: Person): void {
  const held = heldTiles(s, p.id);
  const own: Tile2 = [Math.round(p.x), Math.round(p.y)];
  if (walkable(s, own[0], own[1]) && !isHeld(s, held, own)) {
    p.task = idleTask(RETRY);
    return;
  }
  const t = nearestFreeTile(s, own, held);
  if (!t || !beginWalk(s, p, t, 'idle')) p.task = idleTask(RETRY);
}

/**
 * Walks to a free tile on a building's ring: 'walk' when on the way, 'wait' when the ring is full (the person
 * waits nearby, job kept), 'fail' when there is no ring tile or no path.
 */
function goToRing(s: GameState, p: Person, b: Building, goal: Task['goal']): 'walk' | 'wait' | 'fail' {
  const r = ringState(s, p, b);
  if (r === 'full') {
    waitNearby(s, p);
    return 'wait';
  }
  return r && beginWalk(s, p, r, goal) ? 'walk' : 'fail';
}

function startDeliver(s: GameState, p: Person): void {
  const store = nearestBuilding(s, p, 'store');
  if (!store || goToRing(s, p, store, 'deliver') === 'fail') p.task = idleTask(RETRY);
}

function wanderDelay(s: GameState): number {
  return jobsData.wander.idleMin + Math.floor(rngNext(s.rng) * jobsData.wander.idleSpan);
}

/** Elders and children stroll within 3 tiles of their tipi (or the fire). */
function wander(s: GameState, p: Person): void {
  const home = s.buildings.find((b) => b.id === p.home) ?? s.buildings.find((b) => b.type === 'fire')!;
  const [cx, cy] = home.type === 'fire' ? campCentre(s.map) : [Math.round(home.x + 0.5), Math.round(home.y + 0.5)];
  const r = jobsData.wander.radius;
  const held = heldTiles(s, p.id);
  for (let tries = 0; tries < 6; tries++) {
    const x = cx + Math.floor(rngNext(s.rng) * (2 * r + 1)) - r;
    const y = cy + Math.floor(rngNext(s.rng) * (2 * r + 1)) - r;
    if (Math.hypot(x - cx, y - cy) <= r && walkable(s, x, y) && !isHeld(s, held, [x, y]) && beginWalk(s, p, [x, y], 'idle')) return;
  }
  p.task = idleTask(jobsData.wander.idleMin);
}

function loaded(p: Person): boolean {
  return p.carry.amount > 1e-9 || (p.carry.hides ?? 0) > 1e-9;
}

/** Drops a building job whose building is gone or in the wrong state (finished site, unfinished lodge). */
function validateBuildingJob(s: GameState, p: Person): void {
  const job = p.job;
  if (!job || job.building === null) return;
  const b = building(s, job.building);
  const working = job.kind === 'gather' || job.kind === 'hunt' || job.kind === 'dry' || job.kind === 'heal' || job.kind === 'scout' || job.kind === 'drill' || job.kind === 'tend';
  if (!b || (working ? !b.done : b.done)) releaseJob(p);
}

function decideHaul(s: GameState, p: Person, site: Building): void {
  if (loaded(p)) {
    if (goToRing(s, p, site, 'drop') === 'fail') p.task = idleTask(RETRY);
    return;
  }
  const load = nextHaulLoad(s, site, p.id);
  const store = nearestBuilding(s, p, 'store');
  if (!load || !store || goToRing(s, p, store, 'pickup') === 'fail') {
    releaseJob(p);
    p.task = idleTask(RETRY);
  }
}

function decideBuild(s: GameState, p: Person, site: Building): void {
  if (goToRing(s, p, site, 'work') === 'fail') {
    releaseJob(p);
    p.task = idleTask(RETRY);
  }
}

function decideHunt(s: GameState, p: Person): void {
  if (loaded(p)) {
    startDeliver(s, p);
    return;
  }
  const spot = pickHuntSpot(s);
  if (!spot || !beginWalk(s, p, spot, 'work')) p.task = idleTask(RETRY);
}

/**
 * A drying trip (DESIGN-seasons.md): take 6 food from the nearest store, carry it to the rack, work 200
 * ticks, bring 4 pemmican back. Anything else carried is just delivered.
 */
function decideDry(s: GameState, p: Person, rack: Building): void {
  if (loaded(p)) {
    if (p.carry.res === 'food' && p.carry.amount >= DRY.take - 1e-9) {
      if (goToRing(s, p, rack, 'work') === 'fail') p.task = idleTask(RETRY);
    } else {
      startDeliver(s, p);
    }
    return;
  }
  const store = s.store.food >= DRY.take - 1e-9 ? nearestBuilding(s, p, 'store') : null;
  if (!store || goToRing(s, p, store, 'take') === 'fail') p.task = idleTask(RETRY);
}

/** The most wounded person below the healing line (ties to the lowest id), other than the healer. */
function mostWounded(s: GameState, healer: Person): Person | undefined {
  let best: Person | undefined;
  for (const q of s.people) {
    if (q.id === healer.id || q.health >= HEAL.below) continue;
    if (!best || q.health < best.health) best = q;
  }
  return best;
}

/** A healing trip (DESIGN-upgrades.md): walk to the most wounded person, work, treat whoever is near. */
function decideHeal(s: GameState, p: Person): void {
  const patient = mostWounded(s, p);
  // The patient holds their own tile, so the healer stands beside it.
  const tile = patient ? freeTileAt(s, p, [Math.round(patient.x), Math.round(patient.y)]) : null;
  if (!tile || !beginWalk(s, p, tile, 'work')) p.task = idleTask(HEAL.ticks);
}

/** A scout, a drilling warrior or a horse tender: waits on the ring of the building and makes nothing itself. */
function decideStation(s: GameState, p: Person, lodge: Building): void {
  if (standsAt(p, lodge) && !isHeld(s, heldTiles(s, p.id), [Math.round(p.x), Math.round(p.y)])) {
    p.task = idleTask(RETRY);
    return;
  }
  if (goToRing(s, p, lodge, 'work') === 'fail') p.task = idleTask(RETRY);
}

/** Chooses the next step for an idle person. */
function decide(s: GameState, p: Person): void {
  const t = p.task;
  if (t.timer > 0) {
    t.timer--;
    return;
  }
  validateBuildingJob(s, p);
  let job = p.job;
  if (job?.kind === 'haul') return decideHaul(s, p, building(s, job.building)!);
  if (job?.kind === 'build') return decideBuild(s, p, building(s, job.building)!);
  if (job?.kind === 'hunt') return decideHunt(s, p);
  if (job?.kind === 'dry') return decideDry(s, p, building(s, job.building)!);
  if (job?.kind === 'heal') return decideHeal(s, p);
  if (job?.kind === 'scout' || job?.kind === 'drill' || job?.kind === 'tend') return decideStation(s, p, building(s, job.building)!);

  const def = job ? TILE_JOBS[job.kind] : undefined;
  if (job && def) {
    if (job.building !== null) {
      // A gathering spot: take the fullest berry tile in its radius, again whenever one runs out.
      if (!job.tile || !tileHasResource(s, job)) job.tile = pickSpotTile(s, building(s, job.building)!);
      if (!job.tile) {
        if (loaded(p)) startDeliver(s, p);
        else p.task = idleTask(RETRY);
        return;
      }
    } else if (!tileHasResource(s, job)) {
      // An emptied tile: a woodcutter moves to the nearest forest tile, anyone else stops.
      const next = job.kind === 'chop' && job.tile ? nearbyForest(s, job.tile) : null;
      if (next) job.tile = next;
      else releaseJob(p);
      job = p.job;
    }
  }
  const tdef = job ? TILE_JOBS[job.kind] : undefined;
  if (loaded(p)) {
    const full = !!tdef && p.carry.amount >= tdef.carry - 1e-9;
    if (!tdef || p.carry.res !== tdef.res || full) {
      startDeliver(s, p);
      return;
    }
  }
  if (job && job.tile && tdef) {
    // Another worker on the same tree or bush: work it from the nearest free tile beside it.
    const stand = freeTileAt(s, p, job.tile);
    if (!stand || !beginWalk(s, p, stand, 'work')) {
      releaseJob(p);
      addMessage(s, `${p.name} can't reach that spot.`);
    }
    return;
  }
  if (p.age === 'adult') {
    const auto = findAutoWork(s, p);
    if (auto) p.job = auto;
    return;
  }
  wander(s, p);
}

function finishSite(s: GameState, site: Building): void {
  site.done = true;
  site.built = buildingDefs[site.type].buildPoints ?? site.built;
  // A barricade line finishes segment by segment; one toast each would bury the others.
  if (!buildingDefs[site.type].line) addMessage(s, `The ${buildingName(site.type)} is finished.`);
}

function doWork(s: GameState, p: Person): void {
  const job = p.job;
  if (!job) {
    p.task = idleTask();
    return;
  }
  if (job.kind === 'build') {
    const site = building(s, job.building);
    if (!site || site.done) {
      releaseJob(p);
      p.task = idleTask();
      return;
    }
    if (!materialsComplete(site)) return; // wait for the haulers
    site.built += workRate(s, p, 'build');
    if (site.built >= (buildingDefs[site.type].buildPoints ?? Infinity)) finishSite(s, site);
    return;
  }
  if (job.kind === 'hunt') {
    if (p.task.timer > 0) {
      p.task.timer--;
      return;
    }
    if (rngNext(s.rng) < jobsData.jobs.hunt.success * seasonal(s, 'huntSuccess') * (hasUpgrade(s, 'dogs') ? upgradeData.upgrades.dogs.huntSuccess : 1)) {
      p.carry = { res: 'food', amount: jobsData.jobs.hunt.food, hides: jobsData.jobs.hunt.hides };
    }
    p.task = idleTask();
    return;
  }
  if (job.kind === 'scout' || job.kind === 'drill' || job.kind === 'tend') {
    p.task = idleTask(RETRY);
    return;
  }
  if (job.kind === 'heal') {
    if (p.task.timer > 0) {
      p.task.timer--;
      return;
    }
    let best: Person | undefined;
    for (const q of s.people) {
      if (q.id === p.id || q.health >= HEAL.below || Math.hypot(q.x - p.x, q.y - p.y) > HEAL.reach) continue;
      if (!best || q.health < best.health) best = q;
    }
    if (best) best.health = Math.min(jobsData.health.max, best.health + HEAL.amount);
    p.task = idleTask();
    return;
  }
  if (job.kind === 'dry') {
    if (p.task.timer > 0) {
      p.task.timer--;
      return;
    }
    if (p.carry.res === 'food' && p.carry.amount >= DRY.take - 1e-9) p.carry = { res: 'pemmican', amount: DRY.give, hides: 0 };
    p.task = idleTask();
    return;
  }
  const def = TILE_JOBS[job.kind];
  if (!def || !job.tile || !tileHasResource(s, job)) {
    p.task = idleTask();
    return;
  }
  const i = job.tile[1] * s.map.size + job.tile[0];
  const take = Math.min(workRate(s, p, job.kind), s.map.amount[i], def.carry - p.carry.amount);
  if (p.carry.res !== def.res) p.carry = { res: def.res, amount: 0 };
  p.carry.amount += take;
  s.map.amount[i] -= take;
  if (s.map.amount[i] <= 1e-9) {
    s.map.amount[i] = 0;
    if (s.map.tiles[i] === 'forest') {
      s.map.tiles[i] = 'grass';
      s.mapVersion++;
    }
  }
  if (p.carry.amount >= def.carry - 1e-9) p.task = idleTask();
}

function doDeliver(s: GameState, p: Person): void {
  const t = p.task;
  if (t.timer > 0) {
    t.timer--;
    return;
  }
  const res = p.carry.res;
  const put = Math.min(p.carry.amount, Math.max(0, storeCap(s, res) - s.store[res]));
  s.store[res] += put;
  p.carry.amount -= put;
  const hides = p.carry.hides ?? 0;
  const putHides = Math.min(hides, Math.max(0, storeCap(s, 'hides') - s.store.hides));
  s.store.hides += putHides;
  p.carry.hides = hides - putHides;
  if (p.carry.amount < 1e-9) p.carry.amount = 0;
  if (p.carry.hides < 1e-9) p.carry.hides = 0;
  if (!loaded(p)) p.task = idleTask();
  else t.timer = RETRY; // the store is full: wait here and try again; the load is not lost
}

/** What happens when a walk ends, by the walk's goal. */
function arrive(s: GameState, p: Person): void {
  const goal = p.task.goal;
  const job = p.job;
  const site = job && (job.kind === 'haul') ? building(s, job.building) : undefined;
  switch (goal) {
    case 'work':
      p.task = {
        step: 'work', target: null, path: [], goal: null,
        timer: job?.kind === 'hunt' ? jobsData.jobs.hunt.huntTicks : job?.kind === 'dry' ? DRY.ticks : job?.kind === 'heal' ? HEAL.ticks : 0,
      };
      break;
    case 'take':
      // At the store: the food for one batch, if it is still there.
      if (job?.kind === 'dry' && s.store.food >= DRY.take - 1e-9) {
        s.store.food -= DRY.take;
        p.carry = { res: 'food', amount: DRY.take, hides: 0 };
      }
      p.task = idleTask();
      break;
    case 'deliver':
      p.task = { step: 'deliver', target: null, path: [], timer: 0, goal: null };
      break;
    case 'pickup': {
      const load = site && !site.done ? nextHaulLoad(s, site, p.id) : null;
      if (load) p.carry = { res: load.res, amount: load.amount, hides: 0 };
      else releaseJob(p);
      p.task = idleTask();
      break;
    }
    case 'drop':
      if (site && !site.done) {
        const cost = buildingDefs[site.type].cost ?? {};
        const res = p.carry.res;
        site.delivered[res] = Math.min(cost[res] ?? 0, (site.delivered[res] ?? 0) + p.carry.amount);
      }
      p.carry = { res: p.carry.res, amount: 0, hides: 0 };
      p.task = idleTask();
      break;
    default:
      p.task = idleTask(p.age === 'adult' ? 0 : wanderDelay(s));
  }
}

/** Advances one person by one tick. */
export function stepPerson(s: GameState, p: Person): void {
  if (p.cooldown > 0) p.cooldown--;
  if (p.drafted) {
    // A drafted person fights, or walks where ordered; their job waits and resumes when undrafted.
    if (stepFighter(s, p) || p.task.step !== 'walk') return;
  } else if (s.enemies.length > 0 || p.task.step === 'flee') {
    if (stepFlee(s, p)) return;
  }
  switch (p.task.step) {
    case 'idle':
      decide(s, p);
      break;
    case 'walk': {
      if (p.job?.building != null) {
        // A finished site or a cancelled building ends the trip at once.
        validateBuildingJob(s, p);
        if (!p.job) {
          p.task = idleTask();
          break;
        }
      }
      const r = movePerson(s, p);
      if (r === 'moving') break;
      if (r === 'blocked') p.task = idleTask(RETRY);
      else arrive(s, p);
      break;
    }
    case 'work':
      doWork(s, p);
      break;
    case 'deliver':
      doDeliver(s, p);
      break;
  }
}

/**
 * Horse breeding (DESIGN-upgrades-3.md `## Horses and riders`): a corral with a tender on its ring gathers
 * tended time; each 3600 ticks adds a horse while the corrals have room. At the cap the time waits, full.
 */
export function stepCorrals(s: GameState): void {
  const need = jobsData.jobs.tend.ticksPerHorse;
  for (const b of s.buildings) {
    if (b.type !== 'horse_corral' || !b.done) continue;
    const tended = s.people.some((p) => !p.drafted && p.job?.kind === 'tend' && p.job.building === b.id && standsAt(p, b));
    if (tended) b.tended = Math.min(need, b.tended + 1);
    if (b.tended >= need && s.horses < horseCap(s)) {
      b.tended -= need;
      s.horses++;
      addMessage(s, 'A foal was born.');
    }
  }
}
