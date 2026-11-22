// The creature picks (wolves, game, horses, riders, carcasses, allies, effects) name frames a delivery would hold, and
// follow the state as art/SPEC.md section 4 and art/STYLE.md section 6 say.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { expectedFrames } from '../../scripts/art/lib.mjs';
import {
  carcassFrame, carcassStage, corralHorses, CORRAL_SPOTS, gameAnim, herdSpots, offMap, onceFrame, onceLength, restAnim,
  riderAnim, screenDir, wolfAnim, wolfLook,
} from '../../src/render/creatureArt';
import { manifest } from '../../src/render/manifest';
import { facingFrom, frameAt, personFrame } from '../../src/render/personArt';
import { FACINGS } from '../../src/render/manifest';

const names = (key: string) => new Set(expectedFrames(key, manifest[key]).map((f: { name: string }) => f.name));
const still = { moving: false, speed: 0 };

test('a wolf runs, walks when slowed, attacks while its bite cools down, else stands', () => {
  assert.equal(wolfAnim({ fleeing: false, cooldown: 0 }, { moving: true, speed: 0.16 }).anim, 'run');
  assert.equal(wolfAnim({ fleeing: false, cooldown: 0 }, { moving: true, speed: 0.064 }).anim, 'walk', 'in a storm');
  assert.equal(wolfAnim({ fleeing: true, cooldown: 0 }, { moving: true, speed: 0.08 }).anim, 'run', 'fleeing always runs');
  assert.equal(wolfAnim({ fleeing: false, cooldown: 6 }, still).anim, 'attack');
  assert.equal(wolfAnim({ fleeing: false, cooldown: 0 }, still).anim, 'idle');
  assert.equal(wolfAnim({ fleeing: true, cooldown: 6 }, still).anim, 'idle');
});

test('the pack leader is 1.4x and darker, the guardian pale with a glow, a wolf plain', () => {
  assert.deepEqual(wolfLook('wolf'), { scale: 1, tint: 0xffffff, alpha: 1, glow: false });
  const lead = wolfLook('pack_leader');
  assert.equal(lead.scale, 1.4);
  assert.ok(lead.tint < 0xffffff && !lead.glow);
  const guard = wolfLook('guardian');
  assert.equal(guard.scale, 1);
  assert.ok(guard.glow);
});

test('game runs when fleeing, walks when wandering, grazes or stands when still', () => {
  assert.equal(gameAnim({ id: 1, fleeing: 30 }, { moving: true, speed: 0.16 }, 0).anim, 'run');
  assert.equal(gameAnim({ id: 1, fleeing: 0 }, { moving: true, speed: 0.03 }, 0).anim, 'walk');
  const rest = new Set([0, 5000, 10000, 15000].map((ms) => gameAnim({ id: 1, fleeing: 0 }, still, ms).anim));
  assert.deepEqual([...rest].sort(), ['graze', 'idle']);
  assert.equal(restAnim(1, 0).anim, gameAnim({ id: 1, fleeing: 0 }, still, 0).anim);
});

test('a rider gallops when moving, thrusts in a fight, else stands', () => {
  assert.deepEqual(riderAnim({ anim: 'walk', rate: 1.5 }), { anim: 'gallop', rate: 1 });
  assert.equal(riderAnim({ anim: 'carry_walk', rate: 1 }).anim, 'gallop');
  for (const a of ['thrust', 'strike', 'shoot']) assert.equal(riderAnim({ anim: a, rate: 1 }).anim, 'thrust');
  assert.equal(riderAnim({ anim: 'sit', rate: 1 }).anim, 'idle');
});

test('a carcass is whole until a load is taken, half while meat is left, then bones', () => {
  assert.equal(carcassStage(30, 30), 'stage1');
  assert.equal(carcassStage(20, 30), 'stage2');
  assert.equal(carcassStage(0.5, 30), 'stage2');
  assert.equal(carcassStage(0, 30), 'stage3');
  assert.equal(carcassStage(10, 10), 'stage1', 'a whole deer');
});

test('every creature pick names a frame the delivery holds', () => {
  for (const key of ['animal_wolf', 'animal_deer', 'animal_bison', 'animal_horse', 'person_rider']) {
    const have = names(key);
    for (const anim of Object.keys(manifest[key].anims!)) {
      for (const f of FACINGS) {
        for (const ms of [0, 130, 999, 5000]) {
          const frame = personFrame(key, 'base', anim, f, frameAt(key, anim, ms));
          assert.ok(have.has(frame), `${key}: ${frame}`);
        }
      }
    }
  }
  // Every animation a pick can ask for exists on its model.
  const wolf = manifest.animal_wolf.anims!;
  for (const m of [still, { moving: true, speed: 0.16 }, { moving: true, speed: 0.05 }]) {
    for (const cd of [0, 5]) assert.ok(wolfAnim({ fleeing: false, cooldown: cd }, m).anim in wolf);
  }
  for (const key of ['animal_deer', 'animal_bison', 'animal_horse']) {
    for (const ms of [0, 5000, 10000]) assert.ok(gameAnim({ id: 2, fleeing: 0 }, still, ms).anim in manifest[key].anims!);
  }
  for (const a of ['walk', 'idle', 'thrust']) assert.ok(riderAnim({ anim: a, rate: 1 }).anim in manifest.person_rider.anims!);
  for (const kind of ['deer', 'bison', 'wolf']) {
    const have = names(`carcass_${kind}`);
    for (const st of ['stage1', 'stage2', 'stage3']) assert.ok(have.has(carcassFrame(kind, st)), `${kind} ${st}`);
  }
  for (const [key, anim] of [['ally_spirit', 'float'], ['fx_storm', 'loop'], ['fx_hit', 'burst'], ['fx_dust', 'puff'], ['fx_sparkle', 'rise'], ['animal_fish', 'jump']]) {
    const have = names(key);
    for (const ms of [0, 90, 400, 2000]) assert.ok(have.has(onceFrame(key, anim, ms, 0.4)), `${key}: ${onceFrame(key, anim, ms, 0.4)}`);
  }
  assert.ok(names('fx_arrow').has('fx_arrow'));
  assert.ok(names('fx_arrow_stuck').has('fx_arrow_stuck'));
});

test('a one-shot holds its last frame and ends after its length; a loop wraps', () => {
  assert.equal(onceFrame('fx_hit', 'burst', 0), 'fx_hit/burst/00');
  assert.equal(onceFrame('fx_hit', 'burst', 10000), 'fx_hit/burst/03');
  assert.equal(onceLength('fx_hit', 'burst'), (4 * 1000) / 14);
  assert.equal(onceFrame('fx_storm', 'loop', 800), 'fx_storm/loop/00'); // 8 frames at 10 fps
});

test('a wolf that vanished on the map border ran off; one inside died', () => {
  assert.ok(offMap(0, 40, 96));
  assert.ok(offMap(40, 95, 96));
  assert.ok(!offMap(40, 40, 96));
});

test('free horses fill the finished corrals in id order, up to the cap and the six spots', () => {
  const corrals = [{ id: 9, cx: 10.5, cy: 10.5 }, { id: 3, cx: 20.5, cy: 20.5 }];
  const h = corralHorses(corrals, 8, 6);
  assert.equal(h.length, 8);
  assert.deepEqual(h.slice(0, 6).map((x) => x.corral), [3, 3, 3, 3, 3, 3]);
  assert.deepEqual(h.slice(6).map((x) => x.corral), [9, 9]);
  assert.equal(corralHorses(corrals, 20, 6).length, 12);
  assert.equal(corralHorses(corrals, 0, 6).length, 0);
  assert.equal(corralHorses([], 4, 6).length, 0);
  // Every spot is inside the 2x2 footprint (centre +-1 tile) and the spots are distinct.
  for (const s of CORRAL_SPOTS) assert.ok(Math.abs(s.dx) < 0.8 && Math.abs(s.dy) < 0.8);
  assert.equal(new Set(CORRAL_SPOTS.map((s) => `${s.dx},${s.dy}`)).size, CORRAL_SPOTS.length);
});

test('a stampede is seven bison abreast, and its run direction gives the facing on screen', () => {
  const spots = herdSpots({ x: 10, y: 10, dx: 1, dy: 0 }, 1.5);
  assert.equal(spots.length, 7);
  assert.deepEqual(spots[3], { x: 10, y: 10 });
  assert.ok(spots.every((p) => p.x === 10), 'abreast across a run along x');
  // Running along +x (tile) goes down and right on screen: south-east.
  const d = screenDir(1, 0);
  assert.equal(facingFrom(d.x, d.y), 'se');
  const up = screenDir(0, -1);
  assert.equal(facingFrom(up.x, up.y), 'ne');
});
