import assert from 'node:assert/strict';
import { test } from 'node:test';
import { REACH, STRIDE, type SoundEvent, type SoundId, hash01, newSoundWatch, soundEvents } from '../src/audio/events';
import { LEVEL, RECIPES } from '../src/audio/sfx';
import { AUDIBLE, PAN_MAX, Throttle, spatial } from '../src/audio/space';
import { createBase } from '../src/sim/base';
import { type ActKind, type MissionState, createMission } from '../src/sim/mission';
import { emitNoise } from '../src/sim/noise';

// Z39: the pure side of the audio (DESIGN §6 *Audio*): which sounds a change in the sim makes, where they are
// placed from the camera, and how a crowd of them is kept in check. WebAudio itself is checked in the browser.

const open = (n: number): string[] => Array.from({ length: n }, () => '.'.repeat(n));

function mission(): MissionState {
  return createMission({
    map: open(20),
    survivors: [{ id: 'f', kind: 'fighter', x: 4, y: 4 }, { id: 's', kind: 'scout', x: 6, y: 4 }],
    enemies: [{ id: 'z', kind: 'zombie', x: 15, y: 15 }],
    crates: [{ id: 'c1', x: 2, y: 2, food: 2, scrap: 0, ammo: 3 }],
    extract: { x: 0, y: 0, w: 1, h: 1 },
  });
}
const ids = (list: SoundEvent[]): SoundId[] => list.map((e) => e.id);

test('the first look only seeds: nothing sounds for what already was', () => {
  const s = mission();
  s.survivors[0]!.act = { kind: 'shot', tick: 3 };
  s.crates[0]!.opened = true;
  assert.deepEqual(soundEvents(newSoundWatch(), s), []);
});

test('every kind of action cue has its sound, and a cue seen again is silent', () => {
  const s = mission();
  const w = newSoundWatch();
  soundEvents(w, s);
  const f = s.survivors[0]!;
  const want: [ActKind, SoundId][] = [['stab', 'knife'], ['shot', 'shot'], ['club', 'club'], ['throw', 'throw'], ['takedown', 'knife']];
  want.forEach(([kind, id], i) => {
    f.act = { kind, tick: 10 + i };
    assert.deepEqual(ids(soundEvents(w, s)), [id], kind);
    assert.deepEqual(soundEvents(w, s), [], `${kind} again`);
  });
});

test('a takedown is quieter than a stab', () => {
  const s = mission();
  const w = newSoundWatch();
  soundEvents(w, s);
  s.survivors[0]!.act = { kind: 'takedown', tick: 5 };
  const take = soundEvents(w, s)[0]!;
  s.survivors[0]!.act = { kind: 'stab', tick: 9 };
  assert.ok(take.gain < soundEvents(w, s)[0]!.gain);
});

test('a zombie bite next to a survivor is a bite; the same cue away from every survivor is chewing', () => {
  const s = mission();
  const w = newSoundWatch();
  soundEvents(w, s);
  const z = s.enemies[0]!;
  z.x = 5;
  z.y = 5;
  z.act = { kind: 'bite', tick: 4 };
  assert.deepEqual(ids(soundEvents(w, s)).filter((i) => i === 'bite' || i === 'chew'), ['bite']);
  z.x = 12;
  z.y = 12;
  z.act = { kind: 'bite', tick: 8 };
  assert.deepEqual(ids(soundEvents(w, s)).filter((i) => i === 'bite' || i === 'chew'), ['chew']);
});

test('the sound sits where the action is', () => {
  const s = mission();
  const w = newSoundWatch();
  soundEvents(w, s);
  s.survivors[1]!.act = { kind: 'shot', tick: 2 };
  const e = soundEvents(w, s)[0]!;
  assert.deepEqual([e.x, e.y], [6, 4]);
});

test('an opened crate makes one sound', () => {
  const s = mission();
  const w = newSoundWatch();
  soundEvents(w, s);
  s.crates[0]!.opened = true;
  assert.deepEqual(ids(soundEvents(w, s)), ['crate']);
  assert.deepEqual(soundEvents(w, s), []);
});

test('a spike pit going off sounds once; a can ringing sounds once however many looks see its ring', () => {
  const s = createBase({ calm: true });
  s.traps.push({ id: 't1', kind: 'spike', x: 9, y: 9, armed: true, cooldown: 0 });
  const w = newSoundWatch();
  soundEvents(w, s);
  s.traps[0]!.armed = false;
  assert.deepEqual(ids(soundEvents(w, s)), ['spike']);
  assert.deepEqual(soundEvents(w, s), []);

  emitNoise(s, 7, 7, 8, 'can', 'z1');
  assert.deepEqual(ids(soundEvents(w, s)), ['can']);
  assert.deepEqual(soundEvents(w, s), []);
  emitNoise(s, 7, 7, 8, 'shot', 'f'); // a shot's noise ring is not a sound of its own: the action cue makes the shot
  assert.deepEqual(soundEvents(w, s), []);
});

test('footsteps follow the distance walked and the movement state', () => {
  const s = mission();
  const w = newSoundWatch();
  const f = s.survivors[0]!;
  const walk = (x: number, n: number): SoundId[] => {
    const out: SoundId[] = [];
    for (let i = 0; i < n; i++) {
      f.x += x;
      out.push(...ids(soundEvents(w, s)));
    }
    return out;
  };
  soundEvents(w, s);
  assert.deepEqual(walk(0.13, 4), [], 'half a tile is not yet a stride'); // 0.52 < 0.6
  assert.deepEqual(walk(0.13, 1), ['step'], 'the stride completes');
  f.stance = 'crouch';
  assert.deepEqual(walk(0.13, 4), ['stepSoft']); // 0.52 >= 0.5
  f.stance = 'walk';
  f.running = true;
  f.path = [[9, 9]];
  assert.deepEqual(walk(0.2, 4), ['stepRun']); // 0.8 >= 0.75
  assert.ok(STRIDE.crawl < STRIDE.crouch && STRIDE.crouch < STRIDE.walk && STRIDE.walk < STRIDE.run);
});

test('a unit that is moved far in one look (a restart, a teleport) makes no step', () => {
  const s = mission();
  const w = newSoundWatch();
  soundEvents(w, s);
  s.survivors[0]!.x += 9;
  assert.deepEqual(soundEvents(w, s), []);
});

test('a standing unit is silent; a dead one too', () => {
  const s = mission();
  const w = newSoundWatch();
  soundEvents(w, s);
  s.enemies[0]!.hp = 0;
  s.enemies[0]!.x += 2;
  for (let i = 0; i < 400; i++) {
    s.tick++;
    assert.deepEqual(soundEvents(w, s), []);
  }
});

test('a zombie groans from time to time, and more often while it chases', () => {
  const count = (mode: 'wander' | 'chase'): number => {
    const s = mission();
    s.enemies[0]!.ai.mode = mode;
    const w = newSoundWatch();
    soundEvents(w, s);
    let n = 0;
    for (let i = 0; i < 3000; i++) {
      s.tick++;
      n += ids(soundEvents(w, s)).filter((x) => x === 'groan').length;
    }
    return n;
  };
  const idle = count('wander');
  const chase = count('chase');
  assert.ok(idle >= 10 && idle <= 60, `idle ${idle}`);
  assert.ok(chase > idle * 1.5, `chase ${chase} vs idle ${idle}`);
});

test('the same state gives the same sounds (the groan timing is repeatable)', () => {
  const run = (): SoundEvent[] => {
    const s = mission();
    const w = newSoundWatch();
    const out: SoundEvent[] = [];
    for (let i = 0; i < 600; i++) {
      s.tick++;
      out.push(...soundEvents(w, s));
    }
    return out;
  };
  assert.deepEqual(run(), run());
});

test('hash01 stays in [0, 1) and differs by name and counter', () => {
  for (let i = 0; i < 50; i++) {
    const v = hash01('z' + i, i);
    assert.ok(v >= 0 && v < 1);
  }
  assert.notEqual(hash01('a', 1), hash01('b', 1));
  assert.notEqual(hash01('a', 1), hash01('a', 2));
});

test('every sound has a recipe and a reach', () => {
  for (const id of Object.keys(REACH)) {
    assert.equal(typeof RECIPES[id as SoundId], 'function', id);
    assert.ok(REACH[id as SoundId] > 0);
    assert.ok(LEVEL[id as SoundId] > 0, `level ${id}`);
  }
  assert.equal(Object.keys(RECIPES).length, Object.keys(REACH).length);
  assert.equal(Object.keys(LEVEL).length, Object.keys(REACH).length);
});

test('placing: full level on screen, panned by where it is, silent about a screen beyond the edge', () => {
  const W = 1280;
  const here = spatial(0, 0, 1, W);
  assert.deepEqual(here, { gain: 1, pan: 0 });
  assert.equal(spatial(W / 2 - 1, 0, 1, W).gain, 1, 'inside the screen');
  assert.ok(spatial(-300, 0, 1, W).pan < 0 && spatial(300, 0, 1, W).pan > 0);
  assert.ok(Math.abs(spatial(5000, 0, 1, W).pan) <= PAN_MAX + 1e-9);
  const edge = spatial(W / 2, 0, 1, W).gain;
  const off = spatial(W, 0, 1, W).gain;
  assert.ok(edge > off && off > 0, 'a groan just off screen is still heard');
  assert.equal(spatial(W / 2 + W, 0, 1, W).gain, 0, 'one screen beyond the edge is silent');
});

test('placing: zoom makes the world look bigger, so the same distance fades sooner; a longer reach carries further', () => {
  const W = 1280;
  assert.ok(spatial(900, 0, 2, W).gain < spatial(900, 0, 1, W).gain);
  assert.ok(spatial(1400, 0, 1, W, REACH.shot).gain > spatial(1400, 0, 1, W, REACH.stepSoft).gain);
});

test('placing: fading is monotonic with distance', () => {
  let last = 2;
  for (let d = 0; d < 2400; d += 40) {
    const g = spatial(d, 0, 1, 1280).gain;
    assert.ok(g <= last + 1e-9);
    last = g;
  }
});

test('the throttle keeps a crowd in check: a gap per sound, and only loud ones once it is busy', () => {
  const t = new Throttle();
  assert.equal(t.allow('step', 0, 1), true);
  assert.equal(t.allow('step', 30, 1), false, 'too soon');
  assert.equal(t.allow('step', 80, 1), true);
  assert.equal(t.allow('groan', 80, AUDIBLE / 2), false, 'inaudible sounds never start');
  for (let i = 0; i < 40; i++) t.allow(`x${i}`, 100 + i, 1);
  assert.equal(t.allow('step', 300, 0.2), false, 'busy: quiet sounds wait');
  assert.equal(t.allow('shot', 300, 1), true, 'busy: a shot still goes');
  assert.equal(t.allow('step', 2000, 0.2), true, 'a second later it is calm again');
});
