import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FIGURES, animDone, atlasScale, animFrame, drawnFacing, frameName, phaseOf, pickFrame, screenFacing, zombieVariant, ZOMBIE_VARIANTS } from '../src/render/figure';

// Z25: which anim and frame a figure shows, and which way it faces (no Phaser).

const fighter = FIGURES.fighter!.anims;
const zombie = FIGURES.zombie_fresh_a!.anims;
const survivor = (o: Record<string, unknown> = {}) => ({ side: 'survivor', hp: 100, path: [] as unknown[], act: null, stance: 'walk' as const, running: false, order: null, carrying: null, ...o });
const enemy = (mode: string, o: Record<string, unknown> = {}) => ({ side: 'zombie', hp: 60, path: [] as unknown[], act: null, ai: { mode }, ...o });
const moving = [[1, 1]];

test('tile directions map to screen facings, a tie keeps the previous one', () => {
  assert.equal(screenFacing([1, 0]), 'se');
  assert.equal(screenFacing([0, 1]), 'sw');
  assert.equal(screenFacing([0, -1]), 'ne');
  assert.equal(screenFacing([-1, 0]), 'nw');
  assert.equal(screenFacing([1, -1], 'ne'), 'ne'); // straight right on screen
  assert.equal(screenFacing([1, -1], 'se'), 'se');
  assert.equal(screenFacing([1, 1], 'nw'), 'sw'); // straight down: south, keeps west
});

test('SW and NW are the SE and NE frames mirrored', () => {
  assert.deepEqual(drawnFacing('sw'), { facing: 'se', flip: true });
  assert.deepEqual(drawnFacing('nw'), { facing: 'ne', flip: true });
  assert.deepEqual(drawnFacing('se'), { facing: 'se', flip: false });
  assert.equal(frameName('fighter', 'walk', 'ne', 2), 'fighter_walk_ne_2');
});

test('loops wrap and one-shots hold their last frame', () => {
  assert.equal(animFrame('walk', 4, 0), 0);
  assert.equal(animFrame('walk', 4, 0.125), 1); // 8 fps
  assert.equal(animFrame('walk', 4, 0.5), 0);
  assert.equal(animFrame('death', 4, 9), 3);
  assert.equal(animDone('death', 4, 0.49), false);
  assert.equal(animDone('death', 4, 0.5), true);
  assert.equal(animDone('walk', 4, 99), false);
  assert.equal(animFrame('shamble', 6, 0.2, true), 2); // 10.5 fps investigating: 2.1 -> 2
  assert.equal(animFrame('shamble', 6, 0.2, false), 1); // 7.5 fps: 1.5 -> 1
  assert.equal(animFrame('shamble', 6, 0.6, true), 0); // 6.3 -> 6 mod 6
  assert.equal(animFrame('shamble', 6, 0.6, false), 4); // 4.5 -> 4
  assert.equal(animFrame('lurch', 6, 0.4), 0); // 15 fps: one 6-frame cycle in 0.4 s, as 4 frames at 10 fps
});

test('a survivor picks its anim from stance, run, hold, work and carry', () => {
  const at = (u: object) => pickFrame(u as never, fighter, 0, 0, 0, 0).anim;
  assert.equal(at(survivor()), 'idle');
  assert.equal(at(survivor({ path: moving })), 'walk');
  assert.equal(at(survivor({ path: moving, running: true })), 'run');
  assert.equal(at(survivor({ path: moving, stance: 'crouch' })), 'crouch');
  assert.equal(at(survivor({ path: moving, stance: 'crawl' })), 'crawl');
  assert.equal(at(survivor({ stance: 'crouch' })), 'crouch'); // still crouched: the pose
  assert.equal(pickFrame(survivor({ stance: 'crouch' }) as never, fighter, 7, 0, 0, 0).frame, 0);
  assert.equal(at(survivor({ order: { type: 'hold' } })), 'hold');
  assert.equal(at(survivor({ order: { type: 'work', left: 5 } })), 'work');
  assert.equal(at(survivor({ order: { type: 'work', left: -1 }, path: moving })), 'walk'); // not there yet
  assert.equal(at(survivor({ carrying: 'b', path: moving })), 'carry');
  assert.equal(pickFrame(survivor({ order: { type: 'work', left: 5 } }) as never, fighter, 3, 0, 0, 0).frame, 1); // the work loop plays while standing
});

test('a zombie shambles, hurries to investigate, lurches in a chase', () => {
  const at = (u: object) => pickFrame(u as never, zombie, 0, 0, 0, 0).anim;
  assert.equal(at(enemy('wander')), 'idle');
  assert.equal(at(enemy('wander', { path: moving })), 'shamble');
  assert.equal(at(enemy('investigate', { path: moving })), 'shamble');
  assert.equal(at(enemy('chase', { path: moving })), 'lurch');
  assert.equal(at(enemy('chase')), 'idle'); // adjacent and still
});

test('a walking zombie near its target reaches out; chasing, still or without the anim it does not', () => {
  const at = (u: object, counts = zombie) => pickFrame(u as never, counts, 0, 0, 0, 0).anim;
  const near = (mode: string, o: Record<string, unknown> = {}) => enemy(mode, { ai: { mode, near: true }, ...o });
  assert.equal(at(near('wander', { path: moving })), 'reach');
  assert.equal(at(near('investigate', { path: moving })), 'reach');
  assert.equal(at(near('investigate')), 'idle'); // stopped beside it: arms down
  assert.equal(at(near('chase', { path: moving })), 'lurch');
  const { reach: _, ...noReach } = zombie;
  assert.equal(at(near('wander', { path: moving }), noReach), 'shamble');
});

test('an action cue plays once from its tick, then the state anim returns', () => {
  const u = survivor({ act: { kind: 'stab', tick: 10 } });
  assert.deepEqual(pickFrame(u as never, fighter, 10, 0, 0, 0), { anim: 'stab', frame: 0, finished: false });
  assert.equal(pickFrame(u as never, fighter, 10, 0.5, 0, 0).frame, 0); // 0.05 s of 12 fps
  assert.equal(pickFrame(u as never, fighter, 11, 0.5, 0, 0).frame, 1); // 0.15 s
  assert.equal(pickFrame(u as never, fighter, 11, 0.9, 0, 0).anim, 'stab');
  assert.equal(pickFrame(u as never, fighter, 12, 0.4, 0, 0).anim, 'stab'); // 3 frames at 12 fps = 0.25 s = 2.5 ticks
  assert.equal(pickFrame(u as never, fighter, 12, 0.6, 0, 0).anim, 'idle');
  const z = enemy('chase', { act: { kind: 'bite', tick: 4 } });
  assert.equal(pickFrame(z as never, zombie, 4, 0, 0, 0).anim, 'bite');
  const shot = survivor({ act: { kind: 'shot', tick: 4 } });
  assert.deepEqual(pickFrame(shot as never, fighter, 4, 0, 0, 0), { anim: 'pistol_shot', frame: 0, finished: false }); // Cass has the two-handed anim
  assert.equal(pickFrame(shot as never, FIGURES.scout!.anims, 4, 0, 0, 0).anim, 'shot'); // the scout's is plain `shot`
  assert.equal(pickFrame(shot as never, { idle: 1, walk: 4 }, 4, 0, 0, 0).anim, 'idle'); // a figure with neither ignores the cue
});

test('a dead figure plays death once and then reports finished', () => {
  const dead = survivor({ hp: 0 });
  const p = (tick: number, frac = 0) => pickFrame(dead as never, fighter, tick, frac, 0, 20);
  assert.deepEqual(p(20), { anim: 'death', frame: 0, finished: false });
  assert.deepEqual(p(22), { anim: 'death', frame: 1, finished: false }); // 0.2 s * 8 fps = 1.6
  assert.deepEqual(p(25), { anim: 'death', frame: 3, finished: true });
});

test('zombie figures: stand-ins use all nine, final art is preferred', () => {
  const status = (s: (k: string) => string) => Object.fromEntries(ZOMBIE_VARIANTS.map((k) => [k, { status: s(k) }]));
  assert.equal(ZOMBIE_VARIANTS.length, 9); // fresh/decayed/rotting x bodies a/b/c, from the manifest
  const seen = new Set(Array.from({ length: 300 }, (_, i) => zombieVariant(`z${i}`, status(() => 'placeholder'))));
  assert.equal(seen.size, 9);
  // Only the three fresh bodies are drawn: a mixed crowd of exactly those three.
  const onlyFresh = status((k) => (k.startsWith('zombie_fresh_') ? 'final' : 'placeholder'));
  const crowd = new Set(Array.from({ length: 100 }, (_, i) => zombieVariant(`h${i}`, onlyFresh)));
  assert.deepEqual([...crowd].sort(), ['zombie_fresh_a', 'zombie_fresh_b', 'zombie_fresh_c']);
  assert.equal(zombieVariant('z7'), zombieVariant('z7')); // stable
});

test('phase is stable and below one second', () => {
  assert.equal(phaseOf('r1'), phaseOf('r1'));
  assert.ok(phaseOf('survivor-1') >= 0 && phaseOf('survivor-1') < 1);
});

// Z49: a 2x sheet is drawn at half size; sheets without a scale are 1x.
test('atlasScale reads the sheet scale and defaults to 1', () => {
  assert.equal(atlasScale('fighter', { fighter: { scale: 2 } }), 2);
  assert.equal(atlasScale('zombies', { zombies: {} }), 1);
  assert.equal(atlasScale('nope', {}), 1);
  assert.equal(atlasScale('fighter'), 2); // A7 installs the approved 2x Fighter atlas.
});
