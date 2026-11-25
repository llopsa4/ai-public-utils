import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type BaseState, cloneBase, createBase, restoreBase } from '../src/sim/base';
import { type MissionState, createMission } from '../src/sim/mission';
import { RECORDS_KEY, fileRun, loadRecords, newRecords, parseRecords, recordRun } from '../src/sim/records';
import { SAVE_KEY, newCampaign, saveCampaign } from '../src/sim/campaign';
import {
  type Result,
  type RunStats,
  TRAPPER_KILLS,
  baseBadges,
  baseGrade,
  baseResult,
  clock,
  missionBadges,
  missionGrade,
  missionResult,
  observeStats,
  statsOf,
} from '../src/sim/stats';

// Z62: counters, grades, badges and records (no Phaser).

const open = (n: number): string[] => Array.from({ length: n }, () => '.'.repeat(n));

function mission(): MissionState {
  return createMission({
    map: open(24),
    survivors: [{ id: 'f', kind: 'fighter', x: 4, y: 4 }, { id: 's', kind: 'scout', x: 6, y: 4 }],
    enemies: [{ id: 'z', kind: 'zombie', x: 20, y: 20 }],
    crates: [{ id: 'c1', x: 10, y: 10, food: 1, scrap: 0 }, { id: 'c2', x: 11, y: 10, food: 1, scrap: 0 }],
    extract: { x: 0, y: 0, w: 1, h: 1 },
  });
}

test('mission grades: Ghost, Quiet, Loud', () => {
  assert.equal(missionGrade({ shots: 0, damage: 0 }), 'ghost');
  assert.equal(missionGrade({ shots: 0, damage: 5 }), 'quiet'); // hurt but silent: not a ghost
  assert.equal(missionGrade({ shots: 1, damage: 0 }), 'quiet');
  assert.equal(missionGrade({ shots: 2, damage: 0 }), 'loud');
});

test('base grades: Fortress, Held, Scraped by (starving or under 25% at the end wins over the rest)', () => {
  const calm = { starving: false, lowNow: false };
  assert.equal(baseGrade({ breaches: 0, lowest: 0.5 }, calm), 'fortress');
  assert.equal(baseGrade({ breaches: 1, lowest: 1 }, calm), 'held');
  assert.equal(baseGrade({ breaches: 0, lowest: 0.49 }, calm), 'held');
  assert.equal(baseGrade({ breaches: 0, lowest: 1 }, { starving: true, lowNow: false }), 'scraped');
  assert.equal(baseGrade({ breaches: 0, lowest: 0.1 }, { starving: false, lowNow: true }), 'scraped');
});

test('badges: Silent, Untouched, Swift under 6 minutes; No breach, Well fed, Trapper at 5 trap kills', () => {
  assert.deepEqual(missionBadges({ shots: 0, damage: 0 }, 359), ['silent', 'untouched', 'swift']);
  assert.deepEqual(missionBadges({ shots: 3, damage: 4 }, 360), []);
  assert.deepEqual(baseBadges({ breaches: 0, starved: false, trapKills: TRAPPER_KILLS }), ['noBreach', 'wellFed', 'trapper']);
  assert.deepEqual(baseBadges({ breaches: 2, starved: true, trapKills: TRAPPER_KILLS - 1 }), []);
});

test('clock formats m:ss', () => {
  assert.equal(clock(0), '0:00');
  assert.equal(clock(65), '1:05');
  assert.equal(clock(600), '10:00');
});

test('the first look only seeds; damage taken counts hit points lost', () => {
  const s = mission();
  observeStats(s);
  assert.equal(statsOf(s).damage, 0);
  s.survivors[0]!.hp -= 12;
  observeStats(s);
  s.survivors[1]!.hp -= 5;
  observeStats(s);
  assert.equal(statsOf(s).damage, 17);
  assert.ok(statsOf(s).lowest < 1);
});

test('shots count once per new shot cue, not per look', () => {
  const s = mission();
  observeStats(s);
  s.survivors[0]!.act = { kind: 'shot', tick: 3 };
  observeStats(s);
  observeStats(s);
  assert.equal(statsOf(s).shots, 1);
  s.survivors[0]!.act = { kind: 'shot', tick: 14 };
  observeStats(s);
  s.survivors[1]!.act = { kind: 'stab', tick: 15 }; // a knife is not a shot
  observeStats(s);
  assert.equal(statsOf(s).shots, 2);
});

test('a kill during a takedown is a silent kill; any other kill is not', () => {
  const s = mission();
  s.enemies.push({ ...s.enemies[0]!, id: 'z2' });
  observeStats(s);
  s.survivors[0]!.order = { type: 'takedown', target: 'z', left: 5 };
  observeStats(s);
  s.enemies[0]!.hp = 0; // taken down
  s.enemies[1]!.hp = 0; // shot some other way
  observeStats(s);
  assert.equal(statsOf(s).silentKills, 1);
});

test('mission result reads the crates and time into rows', () => {
  const s = mission();
  s.tick = 650; // 65 s
  s.crates[0]!.opened = true;
  observeStats(s);
  const r = missionResult(s);
  assert.equal(r.scene, 'mission1');
  assert.equal(r.seconds, 65);
  assert.deepEqual(r.rows.find((x) => x[0] === 'Crates'), ['Crates', '1 of 2']);
  assert.deepEqual(r.rows.find((x) => x[0] === 'Time'), ['Time', '1:05']);
  assert.equal(r.grade, 'ghost');
});

test('Base 1: a fixed opening chewed through is a breach; a trap kill and starving are counted', () => {
  const s = createBase({ calm: true });
  const o = s.openings[0]!;
  o.fixed = true;
  s.traps.push({ id: 't1', kind: 'spike', x: 5, y: 5, armed: true, cooldown: 0 });
  s.enemies.push({ ...mission().enemies[0]!, id: 'r9', x: 5, y: 5 });
  observeStats(s);
  o.fixed = false; // chewed through
  s.traps[0]!.armed = false;
  s.enemies.find((e) => e.id === 'r9')!.hp = 0; // died on the sprung pit
  s.hunger[s.survivors[0]!.id]!.left = 0;
  observeStats(s);
  const st = statsOf(s);
  assert.equal(st.breaches, 1);
  assert.equal(st.trapKills, 1);
  assert.equal(st.starved, true);
  const r = baseResult(s);
  assert.equal(r.grade, 'scraped'); // somebody is starving at the end
  assert.deepEqual(r.badges, []); // a breach, a starved survivor and only 1 trap kill: no badge
});

test('a barricade that disappears is a breach, one that only loses hit points is not', () => {
  const s = createBase({ calm: true });
  s.barricades.push({ x: 4, y: 4, hp: 10 });
  observeStats(s);
  s.barricades[0]!.hp = 3;
  observeStats(s);
  assert.equal(statsOf(s).breaches, 0);
  s.barricades.length = 0;
  observeStats(s);
  assert.equal(statsOf(s).breaches, 1);
});

test('the counters travel with the herd checkpoint, so a retry keeps counting', () => {
  const s = createBase({ calm: true });
  s.herd.warned = true;
  observeStats(s);
  s.survivors[0]!.hp -= 7;
  observeStats(s);
  const back = restoreBase(cloneBase(s)) as (BaseState & { stats?: RunStats }) | null;
  assert.ok(back);
  assert.equal(back.stats?.damage, 7);
  back.survivors[0]!.hp -= 3;
  observeStats(back);
  assert.equal(statsOf(back).damage, 10);
});

// ---- Records ----

const result = (over: Partial<Result> = {}): Result => ({ scene: 'mission1', seconds: 300, grade: 'quiet', badges: ['swift'], rows: [], ...over });

test('records: a better grade and a faster time are new bests, kept apart', () => {
  const first = fileRun(newRecords(), result(), 'normal');
  assert.ok(first.newGrade && first.newTime);
  assert.deepEqual(first.newBadges, ['swift']);
  const worse = fileRun(first.records, result({ grade: 'loud', seconds: 200, badges: [] }), 'normal');
  assert.equal(worse.newGrade, false);
  assert.equal(worse.newTime, true);
  assert.deepEqual(worse.records.best.mission1.normal, { grade: 'quiet', seconds: 200 });
  const better = fileRun(worse.records, result({ grade: 'ghost', seconds: 500, badges: ['swift'] }), 'normal');
  assert.equal(better.newGrade, true);
  assert.equal(better.newTime, false);
  assert.deepEqual(better.newBadges, []); // swift on normal was already earned
  assert.deepEqual(better.records.best.mission1.normal, { grade: 'ghost', seconds: 200 });
});

test('records: each difficulty has its own best, and a badge lists the difficulties it was earned on', () => {
  const a = fileRun(newRecords(), result(), 'normal');
  const b = fileRun(a.records, result({ grade: 'loud', seconds: 900 }), 'hard');
  assert.equal(b.newGrade && b.newTime, true); // first win on Hard
  assert.deepEqual(b.records.badges.mission1.swift, ['normal', 'hard']);
  assert.deepEqual(a.records.best.mission1.hard, undefined); // the old records are not changed
});

test('records: parse drops what does not fit and survives garbage', () => {
  assert.equal(parseRecords(null), null);
  assert.equal(parseRecords('not json'), null);
  assert.equal(parseRecords(JSON.stringify({ version: 99 })), null);
  const r = fileRun(newRecords(), result(), 'normal').records;
  assert.deepEqual(parseRecords(JSON.stringify(r)), r);
  const dirty = JSON.parse(JSON.stringify(r));
  dirty.best.mission1.normal.grade = 'legend'; // not a grade of this scene
  dirty.best.base1.easy = { grade: 'held', seconds: -4 };
  dirty.badges.mission1.swift = ['normal', 'impossible'];
  const clean = parseRecords(JSON.stringify(dirty))!;
  assert.equal(clean.best.mission1.normal, undefined);
  assert.equal(clean.best.base1.easy, undefined);
  assert.deepEqual(clean.badges.mission1.swift, ['normal']);
});

test('records live in their own key and survive New Game; storage that throws is tolerated', () => {
  const data = new Map<string, string>();
  const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) };
  recordRun(storage, result(), 'normal');
  assert.ok(data.has(RECORDS_KEY));
  saveCampaign(storage, newCampaign()); // New Game overwrites the save slot only
  data.delete(SAVE_KEY);
  assert.equal(loadRecords(storage).best.mission1.normal?.grade, 'quiet');
  const broken = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
    removeItem: () => {},
  };
  assert.deepEqual(loadRecords(broken), newRecords());
  assert.doesNotThrow(() => recordRun(broken, result(), 'normal'));
  assert.doesNotThrow(() => recordRun(undefined, result(), 'normal'));
});
