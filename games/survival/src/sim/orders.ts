// Orders (DESIGN-slice.md `## Orders`): the scenes and `window.camp.orders` queue them, and they are
// applied at the start of the next tick. Pure TypeScript, no Phaser.
import { assignWorkers, cancelSite, countJobs, placeBuilding } from './buildings';
import { ages, beginWalk, canWork, idleTask, releaseJob, walkable } from './people';
import { buyUpgrade, castPower, hasUpgrade, UPGRADE_IDS, type UpgradeId } from './upgrades';
import { addMessage, freeHorses, type GameState, type Order, type Person, type Tile2 } from './state';

/** Queues orders; they take effect at the start of the next tick (or at once while paused). */
export function queueOrders(s: GameState, orders: Order[]): void {
  s.orders.push(...orders);
}

/** Applies and clears the queue. The Game scene calls this alone while the game is paused. */
export function flushOrders(s: GameState): void {
  if (s.orders.length === 0) return;
  const list = s.orders;
  s.orders = [];
  for (const o of list) applyOrder(s, o);
}

function people(s: GameState, ids: number[]): Person[] {
  const found: Person[] = [];
  for (const id of ids) {
    const p = s.people.find((q) => q.id === id);
    if (p) found.push(p);
  }
  return found;
}

/**
 * `n` distinct walkable tiles gathered around a target, nearest first (ties: row order), so a group
 * ordered to one spot spreads out instead of stacking. With `n` = 1 it is the target itself, or the
 * nearest walkable tile when the target is blocked.
 */
export function spreadTargets(s: GameState, to: Tile2, n: number): Tile2[] {
  const reach = Math.ceil(Math.sqrt(Math.max(1, n))) + 2;
  const tiles: { t: Tile2; d: number }[] = [];
  for (let y = to[1] - reach; y <= to[1] + reach; y++) {
    for (let x = to[0] - reach; x <= to[0] + reach; x++) {
      if (walkable(s, x, y)) tiles.push({ t: [x, y], d: Math.hypot(x - to[0], y - to[1]) });
    }
  }
  tiles.sort((a, b) => a.d - b.d || a.t[1] - b.t[1] || a.t[0] - b.t[0]);
  if (tiles.length === 0) return [];
  return Array.from({ length: n }, (_, i) => tiles[i % tiles.length].t);
}

function orderMove(s: GameState, ids: number[], at: Tile2): void {
  const n = s.map.size;
  const to: Tile2 = [Math.min(n - 1, Math.max(0, Math.round(at[0]))), Math.min(n - 1, Math.max(0, Math.round(at[1])))];
  const who = people(s, ids);
  const targets = spreadTargets(s, to, who.length);
  who.forEach((p, i) => {
    // A drafted person keeps the job to go back to when undrafted.
    if (!p.drafted) releaseJob(p);
    if (!targets[i] || !beginWalk(s, p, targets[i], 'idle')) addMessage(s, `${p.name} can't reach there.`);
    else if (p.drafted) {
      p.post = targets[i];
      p.attackTarget = null;
    }
  });
}

function orderAssignTile(s: GameState, o: Extract<Order, { job: 'gather' | 'chop' }>): void {
  const n = s.map.size;
  const i = o.tile[1] * n + o.tile[0];
  const want = o.job === 'gather' ? 'berry' : 'forest';
  let skippedDrafted = false;
  const refused: Person[] = [];
  for (const p of people(s, o.ids)) {
    if (p.drafted) {
      skippedDrafted = true;
      continue;
    }
    if (!canWork(p, o.job) || s.map.tiles[i] !== want || s.map.amount[i] <= 1e-6) {
      refused.push(p);
      continue;
    }
    releaseJob(p);
    p.job = { kind: o.job, building: null, tile: o.tile };
    p.task = idleTask();
  }
  // One message per order, not one per person.
  if (refused.length === 1) addMessage(s, `${refused[0].name} can't ${o.job} there.`);
  else if (refused.length > 1) addMessage(s, `${refused.length} people can't ${o.job} there.`);
  if (skippedDrafted) addMessage(s, "Drafted people can't take work orders.");
}

function orderAssignBuilding(s: GameState, ids: number[], buildingId: number): void {
  const b = s.buildings.find((q) => q.id === buildingId);
  if (!b) addMessage(s, 'That building is gone.');
  else if (!b.done) assignSite(s, ids, b.id);
  else assignWorkers(s, ids, buildingId);
}

/** A site takes any adult as a builder (max 3); material hauling is picked up by itself. */
function assignSite(s: GameState, ids: number[], siteId: number): void {
  for (const p of people(s, ids)) {
    if (p.drafted || !canWork(p, 'build') || countJobs(s, siteId, 'build', p.id) >= 3) continue;
    releaseJob(p);
    p.job = { kind: 'build', building: siteId, tile: null };
    p.task = idleTask();
  }
}

function orderDraft(s: GameState, ids: number[], on: boolean): void {
  let adults = 0;
  for (const p of people(s, ids)) {
    if (!ages[p.age].draft) continue;
    adults++;
    if (p.drafted === on) continue;
    p.drafted = on;
    // A drafted lancer takes a free horse when the camp can ride; undrafting gives it back.
    p.mounted = on && p.society === 'lancers' && hasUpgrade(s, 'riders') && freeHorses(s) > 0;
    // Drafting stops whatever they were doing; the job stays and resumes when undrafted.
    p.task = idleTask();
    p.attackTarget = null;
    p.post = on ? [Math.round(p.x), Math.round(p.y)] : null;
  }
  if (adults === 0) addMessage(s, 'Only adults can be drafted.');
}

export function applyOrder(s: GameState, o: Order): void {
  switch (o.type) {
    case 'place':
      placeBuilding(s, o.building, o.at[0], o.at[1]);
      return;
    case 'cancel':
      cancelSite(s, o.building);
      return;
    case 'move':
      orderMove(s, o.ids, o.to);
      return;
    case 'assign':
      if ('building' in o) orderAssignBuilding(s, o.ids, o.building);
      else orderAssignTile(s, o);
      return;
    case 'draft':
      orderDraft(s, o.ids, o.on);
      return;
    case 'attack':
      // Only drafted people take it; the others keep working (or fleeing).
      if (s.enemies.some((e) => e.id === o.enemy)) for (const p of people(s, o.ids)) if (p.drafted) p.attackTarget = o.enemy;
      return;
    case 'stance':
      for (const p of people(s, o.ids)) if (p.drafted) p.stance = o.stance;
      return;
    case 'speed':
      if (o.value === 1 || o.value === 2 || o.value === 4) s.speed = o.value;
      return;
    case 'pause':
      s.paused = o.on;
      return;
    case 'buy':
      if (UPGRADE_IDS.includes(o.upgrade as UpgradeId)) buyUpgrade(s, o.upgrade as UpgradeId);
      return;
    case 'cast':
      castPower(s, o.power, o.at);
      return;
  }
}
