import assert from 'node:assert/strict';
import { test } from 'node:test';
import story from '../src/data/story.json';
import { BARK_GAP, CLOSE, IDLE_TICKS, barkEvents, newBarkWatch } from '../src/sim/barks';
import { createBase } from '../src/sim/base';
import { type MissionState, createMission } from '../src/sim/mission';

// Z61: the bark rules (no Phaser): eight triggers, the 20 s limit, each line once per scene.

const open = (n: number): string[] => Array.from({ length: n }, () => '.'.repeat(n));

function mission(): MissionState {
  return createMission({
    map: open(24),
    survivors: [{ id: 'f', kind: 'fighter', x: 4, y: 4 }, { id: 's', kind: 'scout', x: 6, y: 4 }],
    enemies: [{ id: 'z', kind: 'zombie', x: 20, y: 20 }],
    extract: { x: 0, y: 0, w: 1, h: 1 },
  });
}
const L = story.barks;
const seeded = (s: MissionState, hearth: { x: number; y: number } | null = null) => {
  const w = newBarkWatch();
  assert.equal(barkEvents(w, s, hearth), null); // the first look only seeds
  return w;
};

test('every survivor has 1-3 lines for each of the eight triggers', () => {
  for (const voice of ['Cass', 'Eli'] as const) {
    assert.equal(Object.keys(L[voice]).length, 8);
    for (const lines of Object.values(L[voice])) assert.ok(lines.length >= 1 && lines.length <= 3);
  }
});

test('low HP: a survivor falling under 35% speaks, with their own voice, once per fall', () => {
  const s = mission();
  const w = seeded(s);
  s.survivors[1]!.hp = Math.floor(s.survivors[1]!.maxHp * 0.3);
  const b = barkEvents(w, s);
  assert.equal(b?.trigger, 'lowHp');
  assert.equal(b?.id, 's');
  assert.ok(L.Eli.lowHp.includes(b!.text));
  s.tick += BARK_GAP;
  assert.equal(barkEvents(w, s), null); // still low: not a new fall
});

test('first kill: the survivor who acted last speaks; later kills do not', () => {
  const s = mission();
  s.enemies.push({ ...s.enemies[0]!, id: 'z2' });
  const w = seeded(s);
  s.survivors[0]!.act = { kind: 'stab', tick: 5 };
  s.enemies[0]!.hp = 0;
  const b = barkEvents(w, s);
  assert.equal(b?.trigger, 'firstKill');
  assert.equal(b?.id, 'f');
  s.tick += BARK_GAP;
  s.enemies[1]!.hp = 0;
  assert.equal(barkEvents(w, s), null);
});

test('a zombie coming close speaks once, and again only after they all fell back', () => {
  const s = mission();
  const w = seeded(s);
  s.enemies[0]!.x = 4 + CLOSE - 1;
  s.enemies[0]!.y = 4;
  assert.equal(barkEvents(w, s)?.trigger, 'zombieClose');
  s.tick += BARK_GAP;
  assert.equal(barkEvents(w, s), null); // still close
  s.enemies[0]!.x = 20;
  s.enemies[0]!.y = 20;
  s.tick += BARK_GAP;
  barkEvents(w, s);
  s.enemies[0]!.x = 6;
  s.enemies[0]!.y = 6;
  s.tick += BARK_GAP;
  assert.equal(barkEvents(w, s)?.trigger, 'zombieClose'); // the second line
});

test('out of ammo: the shared count reaching zero speaks', () => {
  const s = mission();
  s.ammo = 1;
  const w = seeded(s);
  s.survivors[1]!.act = { kind: 'shot', tick: 3 };
  s.ammo = 0;
  const b = barkEvents(w, s);
  assert.equal(b?.trigger, 'outOfAmmo');
  assert.equal(b?.id, 's');
});

test('opening fixed: the survivor nearest the opening speaks', () => {
  const s = createBase({ calm: true });
  const w = newBarkWatch();
  barkEvents(w, s);
  const o = s.openings[0]!;
  o.fixed = true;
  const b = barkEvents(w, s);
  assert.equal(b?.trigger, 'openingFixed');
  const near = [...s.survivors].sort((a, c) => Math.hypot(a.x - o.x, a.y - o.y) - Math.hypot(c.x - o.x, c.y - o.y))[0]!;
  assert.equal(b?.id, near.id);
});

test('trap kill: a zombie dying on a sprung spike pit', () => {
  const s = createBase({ calm: true });
  s.enemies.push({ ...mission().enemies[0]!, id: 'z', x: 10, y: 10 });
  s.traps.push({ id: 't1', kind: 'spike', x: 10, y: 10, armed: true, cooldown: 0 });
  const w = newBarkWatch();
  barkEvents(w, s);
  s.traps[0]!.armed = false;
  s.enemies[0]!.hp = 0;
  assert.equal(barkEvents(w, s)?.trigger, 'trapKill');
});

test('herd breach: the first herd zombie at a broken opening, and only once', () => {
  const s = createBase({ calm: true });
  const w = newBarkWatch();
  barkEvents(w, s);
  const o = s.openings[0]!;
  s.enemies.push({ ...mission().enemies[0]!, id: 'h1', x: o.x, y: o.y });
  assert.equal(barkEvents(w, s)?.trigger, 'herdBreach');
  s.tick += BARK_GAP;
  assert.equal(barkEvents(w, s), null);
});

test('idle: 20 s standing still at the hearth speaks; walking away resets it', () => {
  const s = mission();
  const hearth = { x: 5, y: 5 };
  const w = seeded(s, hearth);
  s.tick += IDLE_TICKS - 1;
  assert.equal(barkEvents(w, s, hearth), null);
  s.tick += 1;
  const b = barkEvents(w, s, hearth);
  assert.equal(b?.trigger, 'idle');
  assert.equal(b?.text, L.Cass.idle[0]);
  const t = mission();
  const w2 = seeded(t, hearth);
  t.tick += IDLE_TICKS - 1;
  t.survivors.forEach((u) => (u.path = [[9, 9]]));
  barkEvents(w2, t, hearth);
  t.survivors.forEach((u) => (u.path = []));
  t.tick += 1;
  assert.equal(barkEvents(w2, t, hearth), null);
});

test('at most one bark every 20 s: a moment inside the limit is lost', () => {
  const s = mission();
  const w = seeded(s);
  s.survivors[0]!.hp = 5;
  assert.ok(barkEvents(w, s));
  s.tick += BARK_GAP - 1;
  s.survivors[1]!.hp = 5;
  assert.equal(barkEvents(w, s), null);
  s.tick += 1;
  assert.equal(barkEvents(w, s), null); // lost, not delayed
});

test('each line at most once per scene; a new watch starts over', () => {
  const s = mission();
  const w = seeded(s);
  const said: string[] = [];
  for (let i = 0; i < 4; i++) {
    s.survivors[0]!.hp = 5; // falls under the line...
    const b = barkEvents(w, s);
    if (b) said.push(b.text);
    s.survivors[0]!.hp = s.survivors[0]!.maxHp; // ...and recovers
    s.tick += BARK_GAP;
    barkEvents(w, s);
  }
  assert.deepEqual(said, [...L.Cass.lowHp]); // two lines, then silence
  const w2 = seeded(s);
  s.survivors[0]!.hp = 5;
  assert.equal(barkEvents(w2, s)?.text, L.Cass.lowHp[0]);
});

test('the dead do not speak, and nothing is said once the scene is over', () => {
  const s = mission();
  const w = seeded(s);
  s.survivors[0]!.hp = 0;
  assert.equal(barkEvents(w, s), null);
  const t = mission();
  const w2 = seeded(t);
  t.survivors[1]!.hp = 5;
  t.status = 'success';
  assert.equal(barkEvents(w2, t), null);
});
