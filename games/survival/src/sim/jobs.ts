// Jobs (DESIGN-slice.md `## Jobs`): a worker cycles walk -> work -> walk to the store -> deliver.
// Implemented: gather (berry tiles and gathering spots), chop, hunt, haul, build. Fight comes with C6.
import jobsData from '../data/jobs.json';
import { animalById, ANIMAL_DATA, carcasses, hurtAnimal, liveAnimals, spottingDistance, takeLoad, type Animal } from './animals';
import {
  buildingDefs, buildingName, findAutoWork, materialsComplete, nearestBuilding, nextHaulLoad, nextLineSite, plazaOf, ringState, standsAt,
} from './buildings';
import { fighterOf, stepFighter, stepFlee } from './combat';
import { HUNGRY_AT, HUNGRY_WORK, unityWork } from './economy';
import { ages, beginWalk, canWork, idleTask, movePerson, releaseJob, walkable } from './people';
import { campCentre } from './map';
import { freeTileAt, heldTiles, isHeld, nearestFreeTile } from './occupancy';
import { rngNext } from './rng';
import { seasonal } from './seasons';
import {
  addMessage, horseCap, storeCap, type Building, type GameState, type Job, type JobKind, type Person, type Res, type Task, type Tile2,
} from './state';
import { buildSpeed } from './upgrades';

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

/** True when a store has room for some of what the person carries. */
function storeHasRoom(s: GameState, p: Person): boolean {
  const room = (res: Res) => storeCap(s, res) - s.store[res] > 1e-9;
  return (p.carry.amount > 1e-9 && room(p.carry.res)) || ((p.carry.hides ?? 0) > 1e-9 && room('hides'));
}

/**
 * Holding goods that no store can take (DESIGN-hunting.md `## Full store`): the person keeps them, stops
 * waiting at the store and delivers once there is room.
 */
export function storeBlocked(s: GameState, p: Person): boolean {
  return loaded(p) && !storeHasRoom(s, p);
}

// People already told `Store is full` while still holding the goods. Kept outside GameState on purpose:
// saving is parked (PLAN.md), and the toast is only a message.
const toldFull = new WeakSet<Person>();

function tellFull(s: GameState, p: Person): void {
  if (toldFull.has(p)) return;
  toldFull.add(p);
  addMessage(s, 'Store is full');
}

/** True when the person can deliver now; otherwise they are blocked and told so once. */
function canDeliver(s: GameState, p: Person): boolean {
  if (storeHasRoom(s, p)) return true;
  tellFull(s, p);
  return false;
}

/** How much of `res` a site still needs, not counting loads already on their way. */
function siteNeeds(site: Building, res: Res): number {
  return Math.max(0, (buildingDefs[site.type].cost?.[res] ?? 0) - (site.delivered[res] ?? 0));
}

/** True when the site needs some of what the person carries. */
function siteTakes(site: Building, p: Person): boolean {
  return (p.carry.amount > 1e-9 && siteNeeds(site, p.carry.res) > 1e-9) || ((p.carry.hides ?? 0) > 1e-9 && siteNeeds(site, 'hides') > 1e-9);
}

/** Puts what the site needs from the person's load into it; the rest stays carried. */
function dropAtSite(site: Building, p: Person): void {
  const put = (res: Res, have: number): number => {
    const n = Math.min(have, siteNeeds(site, res));
    if (n > 0) site.delivered[res] = (site.delivered[res] ?? 0) + n;
    return n;
  };
  if (p.carry.amount > 1e-9) p.carry.amount -= put(p.carry.res, p.carry.amount);
  const hides = p.carry.hides ?? 0;
  if (hides > 1e-9) p.carry.hides = hides - put('hides', hides);
  if (p.carry.amount < 1e-9) p.carry.amount = 0;
  if ((p.carry.hides ?? 0) < 1e-9) p.carry.hides = 0;
}

/** Drops a building job whose building is gone or in the wrong state (finished site, unfinished lodge). */
function validateBuildingJob(s: GameState, p: Person): void {
  const job = p.job;
  if (!job || job.building === null) return;
  const b = building(s, job.building);
  const working = job.kind === 'gather' || job.kind === 'hunt' || job.kind === 'dry' || job.kind === 'heal' || job.kind === 'scout' || job.kind === 'drill' || job.kind === 'tend';
  if (job.kind === 'build' && b?.done) leaveSite(s, p, b);
  else if (!b || (working ? !b.done : b.done)) releaseJob(p);
}

/** A builder whose site is finished: on to the next segment of its barricade line, else free. */
function leaveSite(s: GameState, p: Person, site: Building | undefined): void {
  const next = site ? nextLineSite(s, site, p.id) : null;
  if (next) p.job = { kind: 'build', building: next.id, tile: null };
  else releaseJob(p);
  p.task = idleTask();
}

function decideHaul(s: GameState, p: Person, site: Building): void {
  if (loaded(p)) {
    if (siteTakes(site, p)) {
      if (goToRing(s, p, site, 'drop') === 'fail') p.task = idleTask(RETRY);
    } else if (canDeliver(s, p)) {
      startDeliver(s, p);
    } else {
      // Goods the site does not need and no store can take: leave the haul to someone with free hands.
      releaseJob(p);
      p.task = idleTask(RETRY);
    }
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

const LOOK = ANIMAL_DATA.lookTicks;

/** The hunter's bow, whatever their society (`fighterOf` for a hunter: Better bows and Hunting dogs apply). */
function huntBow(s: GameState, p: Person) {
  return fighterOf(s, { ...p, society: 'hunters', mounted: false });
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * What a hunter goes for (DESIGN-hunting.md `## Hunting`): their chosen animal or carcass while it lasts, else the
 * nearest carcass with meat or hides left, else the nearest live animal within spotting distance of the fire.
 */
function huntTarget(s: GameState, p: Person): Animal | undefined {
  const job = p.job!;
  const chosen = animalById(s, job.animal);
  if (chosen && (!chosen.dead || chosen.meat > 1e-9 || chosen.hides > 0)) return chosen;
  job.animal = null;
  const nearest = (list: Animal[]) => {
    let best: Animal | undefined;
    for (const a of list) if (!best || dist(p, a) < dist(p, best) - 1e-12) best = a;
    return best;
  };
  const carcass = nearest(carcasses(s));
  if (carcass) return carcass;
  const fire = campCentre(s.map);
  const reach = spottingDistance(s);
  return nearest(liveAnimals(s).filter((a) => Math.hypot(a.x - fire[0], a.y - fire[1]) <= reach));
}

/** With nothing to hunt, the hunter waits by the fire and looks again every 50 ticks. */
function waitByFire(s: GameState, p: Person): void {
  const plaza = plazaOf(s);
  if (!plaza || (standsAt(p, plaza) && !isHeld(s, heldTiles(s, p.id), [Math.round(p.x), Math.round(p.y)]))) {
    p.task = idleTask(LOOK);
    return;
  }
  if (goToRing(s, p, plaza, 'idle') === 'fail') p.task = idleTask(LOOK);
  else if (p.task.step === 'idle') p.task.timer = LOOK;
}

function decideHunt(s: GameState, p: Person): void {
  if (loaded(p)) {
    // A load of meat goes to the nearest store; a full store keeps it in the hunter's hands (`## Full store`).
    if (canDeliver(s, p)) startDeliver(s, p);
    else p.task = idleTask(RETRY);
    return;
  }
  const a = huntTarget(s, p);
  if (!a) {
    waitByFire(s, p);
    return;
  }
  p.job!.animal = a.id;
  if (a.dead) {
    // Fetch the next load: walk beside the carcass.
    const stand = freeTileAt(s, p, [Math.round(a.x), Math.round(a.y)]);
    if (!stand || !beginWalk(s, p, stand, 'pickup')) {
      p.job!.animal = null;
      p.task = idleTask(LOOK);
    }
  }
  // A live animal: `stepHunter` closes in and shoots.
}

/**
 * A hunter after a live animal: walks into bow range and shoots (one roll per shot, as in a fight). True while
 * it handled the tick; false lets the normal job code run (no live target, a load to carry).
 */
function stepHunter(s: GameState, p: Person): boolean {
  if (p.job?.kind !== 'hunt' || loaded(p) || p.task.step === 'deliver') return false;
  if (p.task.step === 'walk' && p.task.goal !== 'idle') return false; // delivering, fetching or going to the fire
  const a = animalById(s, p.job.animal);
  if (!a || a.dead) return false;
  const bow = huntBow(s, p);
  if (dist(p, a) <= bow.range) {
    if (p.task.step === 'walk') p.task = idleTask();
    if (p.cooldown <= 0) {
      if (rngNext(s.rng) < bow.accuracy) hurtAnimal(s, a, bow.damage, p);
      else hurtAnimal(s, a, 0, p); // a miss startles the herd too
      p.cooldown = bow.cooldown;
    }
    return true;
  }
  const tile: Tile2 = [Math.round(a.x), Math.round(a.y)];
  const t = p.task.target;
  const near = p.task.step === 'walk' && t && Math.hypot(t[0] - tile[0], t[1] - tile[1]) <= 1.5;
  if (!near && !beginWalk(s, p, tile, 'idle')) {
    p.job.animal = null;
    p.task = idleTask(LOOK);
    return true;
  }
  if (movePerson(s, p) === 'blocked') p.task = idleTask(RETRY);
  return true;
}

/**
 * A drying trip (DESIGN-seasons.md): take 6 food from the nearest store, carry it to the rack, work 200
 * ticks, bring 4 pemmican back. Anything else carried is just delivered.
 */
function decideDry(s: GameState, p: Person, rack: Building): void {
  if (loaded(p)) {
    if (p.carry.res === 'food' && p.carry.amount >= DRY.take - 1e-9) {
      if (goToRing(s, p, rack, 'work') === 'fail') p.task = idleTask(RETRY);
    } else if (canDeliver(s, p)) {
      startDeliver(s, p);
    } else {
      p.task = idleTask(RETRY);
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
  let handsFull = false;
  if (loaded(p)) {
    const full = !!tdef && p.carry.amount >= tdef.carry - 1e-9;
    const other = !!tdef && p.carry.amount > 1e-9 && p.carry.res !== tdef.res;
    if (!tdef || other || full) {
      if (canDeliver(s, p)) {
        startDeliver(s, p);
        return;
      }
      // A full store (`## Full store`): no job means other free work below; a tree or bush waits until a
      // store has room, with the person standing at it rather than at the store.
      handsFull = !!tdef;
    }
  }
  if (job && job.tile && tdef) {
    if (handsFull) {
      const stand = freeTileAt(s, p, job.tile);
      if (stand && stand[0] === Math.round(p.x) && stand[1] === Math.round(p.y)) p.task = idleTask(RETRY);
      else if (!stand || !beginWalk(s, p, stand, 'idle')) p.task = idleTask(RETRY);
      return;
    }
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
    if (auto) {
      p.job = auto;
      return;
    }
  }
  if (goSit(s, p)) return;
  if (p.age !== 'adult') wander(s, p);
}

/**
 * Nothing to do: sit on a free tile of the council plaza's ring (DESIGN-hunting.md `## Council plaza`). True when
 * the person sits or is walking there; false when the ring is full or missing (they wait or wander as before).
 */
function goSit(s: GameState, p: Person): boolean {
  const plaza = plazaOf(s);
  if (!plaza) return false;
  // Adults look for work again every tick; elders and children rest between looks.
  const rest = p.age === 'adult' ? 0 : RETRY;
  if (standsAt(p, plaza) && !isHeld(s, heldTiles(s, p.id), [Math.round(p.x), Math.round(p.y)])) {
    p.task = idleTask(rest);
    return true;
  }
  const r = ringState(s, p, plaza);
  return r !== null && r !== 'full' && beginWalk(s, p, r, 'idle');
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
      leaveSite(s, p, site);
      return;
    }
    if (!materialsComplete(site)) return; // wait for the haulers
    site.built += workRate(s, p, 'build');
    if (site.built >= (buildingDefs[site.type].buildPoints ?? Infinity)) finishSite(s, site);
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
  if (p.carry.res !== def.res && p.carry.amount > 1e-9) {
    p.task = idleTask(); // other goods in hand: deliver them first
    return;
  }
  const i = job.tile[1] * s.map.size + job.tile[0];
  if (p.carry.res !== def.res) p.carry = { res: def.res, amount: 0, hides: p.carry.hides ?? 0 };
  const take = Math.min(workRate(s, p, job.kind), s.map.amount[i], def.carry - p.carry.amount);
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
  if (loaded(p)) tellFull(s, p); // one failed delivery: stop waiting, keep the goods (`## Full store`)
  p.task = idleTask();
}

/** What happens when a walk ends, by the walk's goal. */
function arrive(s: GameState, p: Person): void {
  const goal = p.task.goal;
  const job = p.job;
  const site = job && (job.kind === 'haul') ? building(s, job.building) : undefined;
  switch (goal) {
    case 'work':
      // A builder holding goods the site still needs puts them in (`## Full store`).
      if (job?.kind === 'build' && loaded(p)) {
        const b = building(s, job.building);
        if (b && !b.done) dropAtSite(b, p);
      }
      p.task = {
        step: 'work', target: null, path: [], goal: null,
        timer: job?.kind === 'dry' ? DRY.ticks : job?.kind === 'heal' ? HEAL.ticks : 0,
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
      if (job?.kind === 'hunt') {
        // Beside a carcass: lift the next load (all the hides ride on the first).
        const a = animalById(s, job.animal);
        if (a?.dead && dist(p, a) <= 1.6) {
          const { meat, hides } = takeLoad(a);
          p.carry = { res: 'food', amount: meat, hides };
        }
        p.task = idleTask();
        break;
      }
      const load = site && !site.done ? nextHaulLoad(s, site, p.id) : null;
      if (load) p.carry = { res: load.res, amount: load.amount, hides: 0 };
      else releaseJob(p);
      p.task = idleTask();
      break;
    }
    case 'drop':
      // What the site does not need stays carried and goes back to the store.
      if (site && !site.done) dropAtSite(site, p);
      p.task = idleTask();
      break;
    default:
      p.task = idleTask(p.age === 'adult' ? 0 : wanderDelay(s));
  }
}

/** Advances one person by one tick. */
export function stepPerson(s: GameState, p: Person): void {
  if (p.cooldown > 0) p.cooldown--;
  if (!storeBlocked(s, p)) toldFull.delete(p);
  if (p.drafted) {
    // A drafted person fights, or walks where ordered; their job waits and resumes when undrafted.
    if (stepFighter(s, p) || p.task.step !== 'walk') return;
  } else if (s.enemies.length > 0 || p.task.step === 'flee') {
    if (stepFlee(s, p)) return;
  }
  if (!p.drafted && stepHunter(s, p)) return;
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
