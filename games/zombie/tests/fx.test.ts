import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ALERT_MS,
  type Alert,
  type FxEvent,
  alertAlpha,
  edgeArrow,
  flashAlpha,
  liveAlerts,
  lootText,
  newWatch,
  observe,
  pickJump,
  popColor,
  touchAlert,
  worldToScreen,
} from '../src/render/fx';
import { createBase } from '../src/sim/base';
import { type MissionState, createMission } from '../src/sim/mission';

// Z38: hit feedback rules (no Phaser): what `observe` reports and where off-screen alerts are drawn.

const open = (n: number): string[] => Array.from({ length: n }, () => '.'.repeat(n));

function mission(): MissionState {
  return createMission({
    map: open(16),
    survivors: [{ id: 'f', kind: 'fighter', x: 4, y: 4 }, { id: 's', kind: 'scout', x: 6, y: 4 }],
    enemies: [{ id: 'z', kind: 'zombie', x: 12, y: 12 }],
    crates: [{ id: 'c1', x: 2, y: 2, food: 2, scrap: 0, ammo: 3 }],
    extract: { x: 0, y: 0, w: 1, h: 1 },
  });
}
const kinds = (list: FxEvent[]): string[] => list.map((e) => e.kind);

test('the first look only seeds: no events', () => {
  const s = mission();
  s.survivors[0]!.hp -= 10;
  assert.deepEqual(observe(newWatch(), s), []);
});

test('a figure that lost hit points flashes; one that did not, does not', () => {
  const s = mission();
  const w = newWatch();
  observe(w, s);
  s.enemies[0]!.hp -= 20;
  assert.deepEqual(observe(w, s), [{ kind: 'flash', id: 'z' }]);
  assert.deepEqual(observe(w, s), []); // seen once only
});

test('a hit survivor flashes, shakes the view and raises an alert with their name', () => {
  const s = mission();
  const w = newWatch();
  observe(w, s);
  s.survivors[1]!.hp -= 15;
  const ev = observe(w, s);
  assert.deepEqual(kinds(ev), ['flash', 'shake', 'alert']);
  assert.deepEqual(ev[1], { kind: 'shake', strength: 'hit', x: 6, y: 4 });
  assert.deepEqual(ev[2], { kind: 'alert', key: 'u:s', label: 'Scout', x: 6, y: 4 });
});

test('a new shot cue shakes lightly; the same cue seen again does not', () => {
  const s = mission();
  const w = newWatch();
  observe(w, s);
  s.survivors[0]!.act = { kind: 'shot', tick: 5 };
  assert.deepEqual(observe(w, s), [{ kind: 'shake', strength: 'shot', x: 4, y: 4 }]);
  assert.deepEqual(observe(w, s), []);
  s.survivors[0]!.act = { kind: 'shot', tick: 9 };
  assert.deepEqual(kinds(observe(w, s)), ['shake']);
  s.survivors[0]!.act = { kind: 'stab', tick: 12 };
  assert.deepEqual(observe(w, s), []); // a knife is not a shot
});

test('a unit first seen with an old cue does not shake', () => {
  const s = mission();
  s.survivors[0]!.act = { kind: 'shot', tick: 1 };
  const w = newWatch();
  assert.deepEqual(observe(w, s), []);
  assert.deepEqual(observe(w, s), []);
});

test('opening a crate pops its loot once, and an empty crate pops nothing', () => {
  const s = mission();
  s.crates.push({ id: 'c2', x: 3, y: 3, food: 0, scrap: 0, ammo: 0, opened: false });
  const w = newWatch();
  observe(w, s);
  s.crates[0]!.opened = true;
  s.crates[1]!.opened = true;
  assert.deepEqual(observe(w, s), [{ kind: 'pop', text: '+3 ammo  +2 food', x: 2, y: 2 }]);
  assert.deepEqual(observe(w, s), []);
});

test('a kill while a survivor was taking the enemy down pops "Silent kill"; a shot kill does not', () => {
  const s = mission();
  const w = newWatch();
  s.survivors[0]!.order = { type: 'takedown', target: 'z', left: 5 };
  observe(w, s);
  s.survivors[0]!.order = null;
  s.enemies[0]!.hp = 0;
  const ev = observe(w, s);
  assert.deepEqual(ev, [{ kind: 'flash', id: 'z' }, { kind: 'pop', text: 'Silent kill', x: 12, y: 12 }]);

  const t = mission();
  const w2 = newWatch();
  observe(w2, t);
  t.enemies[0]!.hp = 0;
  assert.deepEqual(kinds(observe(w2, t)), ['flash']);
});

test('the last bullet pops "Out of ammo" at the latest shooter, once', () => {
  const s = mission();
  s.ammo = 1;
  const w = newWatch();
  observe(w, s);
  s.ammo = 0;
  s.survivors[1]!.act = { kind: 'shot', tick: 3 };
  const ev = observe(w, s);
  assert.ok(ev.some((e) => e.kind === 'pop' && e.text === 'Out of ammo' && e.x === 6));
  assert.ok(!observe(w, s).some((e) => e.kind === 'pop'));
});

test('a fixed opening or barricade that loses hit points raises an alert; chewed through, too', () => {
  const s = createBase({ calm: true });
  const o = s.openings[0]!;
  o.fixed = true;
  o.hp = 100;
  s.barricades.push({ x: 10, y: 10, hp: 100 });
  const w = newWatch();
  observe(w, s);
  o.hp = 80;
  const ev = observe(w, s);
  assert.deepEqual(ev, [{ kind: 'alert', key: `o:${o.id}`, label: o.kind === 'door' ? 'Door' : 'Window', x: o.x, y: o.y }]);
  s.barricades.length = 0; // chewed through
  assert.deepEqual(observe(w, s), [{ kind: 'alert', key: 'b:10,10', label: 'Barricade', x: 10, y: 10 }]);
  o.fixed = false; // the opening was broken
  assert.deepEqual(kinds(observe(w, s)), ['alert']);
  assert.deepEqual(observe(w, s), []);
});

test('fixing an opening or placing a barricade is not an attack', () => {
  const s = createBase({ calm: true });
  const w = newWatch();
  observe(w, s);
  s.openings[0]!.fixed = true;
  s.openings[0]!.hp = 100;
  s.barricades.push({ x: 9, y: 9, hp: 100 });
  assert.deepEqual(observe(w, s), []);
});

test('loot text and pop colours', () => {
  assert.equal(lootText({ ammo: 0, food: 1, scrap: 4 }), '+1 food  +4 scrap');
  assert.equal(lootText({ ammo: 0, food: 0, scrap: 0 }), '');
  assert.equal(popColor('+3 ammo'), '#9bc79b');
  assert.equal(popColor('Out of ammo'), '#e0806a');
  assert.equal(popColor('Silent kill'), '#f4efe0');
});

// ---- alerts and arrows ----

const alert = (key: string, at: number): Alert => ({ key, label: key, x: 1, y: 1, at });

test('an alert is refreshed by a second hit, not duplicated', () => {
  const list = touchAlert(touchAlert([], alert('a', 0)), alert('b', 100));
  const again = touchAlert(list, alert('a', 500));
  assert.equal(again.length, 2);
  assert.equal(again.find((a) => a.key === 'a')!.at, 500);
});

test('alerts expire after ALERT_MS and list newest first', () => {
  const list = [alert('old', 0), alert('new', 4000), alert('mid', 2000)];
  assert.deepEqual(liveAlerts(list, 5000).map((a) => a.key), ['new', 'mid', 'old']);
  assert.deepEqual(liveAlerts(list, ALERT_MS + 10).map((a) => a.key), ['new', 'mid']);
  assert.deepEqual(liveAlerts(list, ALERT_MS + 4000), []);
});

test('the jump key goes to the newest alert, then the next older, then round again', () => {
  const list = [alert('a', 0), alert('b', 1000), alert('c', 2000)];
  assert.deepEqual([0, 1, 2, 3].map((i) => pickJump(list, 3000, i)?.key), ['c', 'b', 'a', 'c']);
  assert.equal(pickJump(list, 99999, 0), null);
});

test('an alert stays solid, then fades out', () => {
  assert.equal(alertAlpha(0), 1);
  assert.equal(alertAlpha(ALERT_MS * 0.7), 1);
  assert.ok(alertAlpha(ALERT_MS * 0.85) < 1 && alertAlpha(ALERT_MS * 0.85) > 0);
  assert.equal(alertAlpha(ALERT_MS), 0);
});

test('world to screen: the camera centre is the middle of the screen, zoom scales around it', () => {
  assert.deepEqual(worldToScreen(500, 300, [500, 300], 2, 1280, 720), [640, 360]);
  assert.deepEqual(worldToScreen(510, 290, [500, 300], 2, 1280, 720), [660, 340]);
});

const ins = { l: 100, t: 100, r: 50, b: 150 }; // free area x 100..1230, y 100..570

test('a point inside the free area has no arrow', () => {
  assert.equal(edgeArrow(640, 300, 1280, 720, ins), null);
  assert.equal(edgeArrow(100, 100, 1280, 720, ins), null); // on the border counts as inside
});

test('a point beyond the right edge gets an arrow on the right border pointing right', () => {
  const a = edgeArrow(2000, 335, 1280, 720, ins)!; // centre of the free area is (665, 335)
  assert.ok(Math.abs(a.x - 1230) < 1e-9);
  assert.ok(Math.abs(a.y - 335) < 1e-9);
  assert.ok(Math.abs(a.angle) < 1e-9);
});

test('a point up and to the left gets an arrow on the top or left border, on the line to the point', () => {
  const a = edgeArrow(-500, -500, 1280, 720, ins)!;
  assert.ok(a.x >= 100 - 1e-9 && a.y >= 100 - 1e-9 && a.x <= 1230 && a.y <= 570);
  assert.ok(Math.abs(a.x - 100) < 1e-9 || Math.abs(a.y - 100) < 1e-9); // on a border
  assert.ok(a.angle < -Math.PI / 2 && a.angle > -Math.PI); // pointing up-left
  const [dx, dy] = [a.x - 665, a.y - 335];
  assert.ok(Math.abs(Math.atan2(dy, dx) - a.angle) < 1e-9);
});

test('a point below the free area (under the action bar) still gets an arrow on the bottom border', () => {
  const a = edgeArrow(665, 700, 1280, 720, ins)!;
  assert.ok(Math.abs(a.y - 570) < 1e-9);
  assert.ok(Math.abs(a.angle - Math.PI / 2) < 1e-9);
});

test('a flash fades linearly and ends', () => {
  assert.equal(flashAlpha(0, 600, 0.5), 0.5);
  assert.equal(flashAlpha(300, 600, 0.5), 0.25);
  assert.equal(flashAlpha(600, 600, 0.5), 0);
  assert.equal(flashAlpha(-5, 600, 0.5), 0);
});
