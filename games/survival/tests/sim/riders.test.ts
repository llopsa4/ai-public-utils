import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ENEMIES, fighterOf } from '../../src/sim/combat';
import { removePerson } from '../../src/sim/people';
import { queueOrders } from '../../src/sim/orders';
import { freeHorses, type Enemy, type GameState, type Person } from '../../src/sim/state';
import { buyUpgrade, upgradeNeeds } from '../../src/sim/upgrades';
import { addBuilding } from '../../src/sim/state';
import { newGame, step } from '../../src/sim/tick';

/** A camp where the riders upgrade is owned, with `horses` horses and `n` adult lancers. */
function riderCamp(horses: number, n: number, riders = true): { s: GameState; lancers: Person[] } {
  const s = newGame(2);
  s.upgrades.push('warriors', 'horses');
  if (riders) s.upgrades.push('riders');
  s.horses = horses;
  const lancers = s.people.filter((p) => p.age === 'adult').slice(0, n);
  for (const p of lancers) p.society = 'lancers';
  return { s, lancers };
}

const draft = (s: GameState, ids: number[], on: boolean) => {
  queueOrders(s, [{ type: 'draft', ids, on }]);
  step(s, 1);
};

test('Riders needs the horses upgrade and a finished lancers lodge, then costs 8 gift + 10 hides', () => {
  const s = newGame(1);
  s.gift = 20;
  s.store.hides = 20;
  assert.equal(upgradeNeeds(s, 'riders'), 'Needs Breed horses');
  s.upgrades.push('warriors', 'horses');
  assert.equal(upgradeNeeds(s, 'riders'), "Needs a finished lancers' lodge");
  const lodge = addBuilding(s, 'lancers_lodge', 28, 26, false);
  assert.equal(buyUpgrade(s, 'riders'), false, 'an unfinished lodge is not a home');
  lodge.done = true;
  assert.equal(buyUpgrade(s, 'riders'), true);
  assert.equal(s.gift, 12);
  assert.equal(s.store.hides, 10);
  assert.equal(s.messages.at(-1)?.text, 'The lancers can ride.');
});

test('a mounted lancer has range 1.8, damage 18 and rides 2.5 times faster', () => {
  const { s, lancers } = riderCamp(2, 1);
  const [p] = lancers;
  assert.equal(fighterOf(s, p).range, 1.6);
  assert.equal(fighterOf(s, p).damage, 14);
  draft(s, [p.id], true);
  assert.equal(p.mounted, true);
  assert.equal(fighterOf(s, p).range, 1.8);
  assert.equal(fighterOf(s, p).damage, 18);
  const x = p.x;
  queueOrders(s, [{ type: 'move', ids: [p.id], to: [Math.round(p.x) + 15, Math.round(p.y)] }]);
  step(s, 10);
  const mounted = Math.abs(p.x - x);
  const foot = riderCamp(0, 1);
  draft(foot.s, [foot.lancers[0].id], true);
  const fx = foot.lancers[0].x;
  queueOrders(foot.s, [{ type: 'move', ids: [foot.lancers[0].id], to: [Math.round(fx) + 15, Math.round(foot.lancers[0].y)] }]);
  step(foot.s, 10);
  const walked = Math.abs(foot.lancers[0].x - fx);
  assert.ok(walked > 0.3, `walked ${walked.toFixed(2)}`);
  assert.ok(mounted > walked * 2, `rode ${mounted.toFixed(2)} against ${walked.toFixed(2)}`);
});

test('a mounted lancer reaches and hits a distant wolf before one on foot does', () => {
  const timeToHit = (riders: boolean): number => {
    const { s, lancers } = riderCamp(1, 1, riders);
    const [p] = lancers;
    s.people = [p];
    p.x = 24;
    p.y = 30;
    s.horses = 1;
    draft(s, [p.id], true);
    p.stance = 'chase';
    p.post = [24, 30];
    const e: Enemy = { id: s.nextEnemyId++, kind: 'wolf', x: 24, y: 22, hp: ENEMIES.wolf.hp, cooldown: 0, fleeing: false, wave: 0 };
    s.enemies.push(e);
    for (let i = 1; i <= 400; i++) {
      step(s, 1);
      if (e.hp < ENEMIES.wolf.hp) return i;
    }
    return Infinity;
  };
  const ride = timeToHit(true);
  const foot = timeToHit(false);
  assert.ok(ride < Infinity && foot < Infinity, `ride ${ride}, foot ${foot}`);
  assert.ok(ride < foot, `mounted ${ride} ticks, on foot ${foot}`);
});

test('drafting takes a free horse, undrafting gives it back, and with none free the lancer walks', () => {
  const { s, lancers } = riderCamp(2, 3);
  draft(s, lancers.map((p) => p.id), true);
  assert.deepEqual(lancers.map((p) => p.mounted), [true, true, false], 'two horses, three lancers');
  assert.equal(freeHorses(s), 0);
  assert.equal(s.horses, 2, 'the herd is unchanged while ridden');
  draft(s, [lancers[0].id], false);
  assert.equal(lancers[0].mounted, false);
  assert.equal(freeHorses(s), 1);
  draft(s, [lancers[2].id], false);
  draft(s, [lancers[2].id], true);
  assert.equal(lancers[2].mounted, true, 'the returned horse goes to the next draft');
  draft(s, lancers.map((p) => p.id), false);
  assert.deepEqual(lancers.map((p) => p.mounted), [false, false, false]);
  assert.equal(freeHorses(s), 2);
});

test('only lancers ride, and only once the riders upgrade is owned', () => {
  const { s, lancers } = riderCamp(2, 1);
  const hunter = s.people.filter((p) => p.age === 'adult' && p !== lancers[0])[0];
  hunter.society = 'hunters';
  draft(s, [hunter.id], true);
  assert.equal(hunter.mounted, false);
  const none = riderCamp(2, 1, false);
  draft(none.s, [none.lancers[0].id], true);
  assert.equal(none.lancers[0].mounted, false);
});

test('a mounted lancer who dies loses the horse', () => {
  const { s, lancers } = riderCamp(2, 2);
  draft(s, lancers.map((p) => p.id), true);
  assert.equal(s.horses, 2);
  removePerson(s, lancers[0].id);
  assert.equal(s.horses, 1);
  removePerson(s, lancers[1].id);
  assert.equal(s.horses, 0);
  const idle = riderCamp(2, 1);
  removePerson(idle.s, idle.lancers[0].id);
  assert.equal(idle.s.horses, 2, 'a lancer on foot costs no horse');
});
