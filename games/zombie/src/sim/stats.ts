import { type BaseState, hungerLevel } from './base';
import type { MissionState } from './mission';
import { TICK_HZ } from './time';

// Run statistics, grades and badges (DESIGN §21). Pure rules like `sim/barks.ts`: `observeStats` compares the
// state with the last look after every tick and counts what happened; the counters live on the state itself
// (`stats`, plain JSON), so the Base 1 herd checkpoint carries them and a retry keeps counting where it was.
// `missionGrade`, `baseGrade` and the badge lists read the counters at the end of a scene.

export type Scene = 'mission1' | 'base1';
export { type Difficulty, DIFFICULTIES } from './difficulty';

/** Worst to best, so a grade's index is its rank. */
export const GRADES: Readonly<Record<Scene, readonly string[]>> = {
  mission1: ['loud', 'quiet', 'ghost'],
  base1: ['scraped', 'held', 'fortress'],
};
export const GRADE_NAME: Readonly<Record<string, string>> = {
  ghost: 'Ghost',
  quiet: 'Quiet',
  loud: 'Loud',
  fortress: 'Fortress',
  held: 'Held',
  scraped: 'Scraped by',
};
export const GRADE_NOTE: Readonly<Record<string, string>> = {
  ghost: 'no shots, no damage taken',
  quiet: 'at most one shot',
  loud: 'the guns spoke',
  fortress: 'nothing broke through, nobody badly hurt',
  held: 'the house held',
  scraped: 'won with someone starving or nearly dead',
};

/** Badges per scene, in display order (DESIGN §21). */
export const BADGES: Readonly<Record<Scene, readonly { id: string; name: string; note: string }[]>> = {
  mission1: [
    { id: 'silent', name: 'Silent', note: 'no shots' },
    { id: 'untouched', name: 'Untouched', note: 'no damage taken' },
    { id: 'swift', name: 'Swift', note: 'under 6 minutes' },
  ],
  base1: [
    { id: 'noBreach', name: 'No breach', note: 'no opening or barricade destroyed' },
    { id: 'wellFed', name: 'Well fed', note: 'nobody ever starved' },
    { id: 'trapper', name: 'Trapper', note: '5 or more trap kills' },
  ],
};

export const SWIFT_SECONDS = 6 * 60;
export const TRAPPER_KILLS = 5;
export const FORTRESS_HP = 0.5; // nobody ever below this share of their hit points
export const SCRAPED_HP = 0.25; // someone below this share at the end

/** What the last look saw, so the next look can tell what changed. */
export interface Seen {
  hp: Record<string, number>;
  acts: Record<string, number>; // unit id → tick of its latest action cue
  takedowns: string[]; // enemies a survivor was taking down
  armed: string[]; // spike pits that were armed
  blocks: string[]; // fixed openings (`o:id`) and barricades (`b:x,y`)
  alive: string[]; // living enemies
}

export interface RunStats {
  shots: number; // pistol shots
  damage: number; // hit points the survivors lost
  silentKills: number; // enemies taken down silently
  trapKills: number; // zombies a spike pit killed
  breaches: number; // fixed openings and barricades chewed through
  starved: boolean; // somebody reached the starving level at some point
  lowest: number; // the lowest share of maximum hit points any survivor fell to (0..1)
  seen: Seen | null; // null until the first look
}

export const newStats = (): RunStats => ({ shots: 0, damage: 0, silentKills: 0, trapKills: 0, breaches: 0, starved: false, lowest: 1, seen: null });

/** What `observeStats` reads: a mission or Base state (Base adds openings, barricades, traps and hunger). */
export type StatState = MissionState & { openings?: BaseState['openings']; barricades?: BaseState['barricades']; traps?: BaseState['traps']; hunger?: BaseState['hunger']; stats?: RunStats };

/** The state's counters, made on first use. */
export function statsOf(s: StatState): RunStats {
  return (s.stats ??= newStats());
}

/** Counts what changed since the last look. The first look only seeds it. Call once after every tick. */
export function observeStats(s: StatState): void {
  const st = statsOf(s);
  const was = st.seen;
  const now: Seen = {
    hp: {},
    acts: {},
    takedowns: s.survivors.flatMap((u) => (u.hp > 0 && u.order?.type === 'takedown' ? [u.order.target] : [])),
    armed: (s.traps ?? []).filter((t) => t.kind === 'spike' && t.armed).map((t) => t.id),
    blocks: [...(s.openings ?? []).filter((o) => o.fixed).map((o) => `o:${o.id}`), ...(s.barricades ?? []).map((b) => `b:${b.x},${b.y}`)],
    alive: s.enemies.filter((e) => e.hp > 0).map((e) => e.id),
  };

  for (const u of s.survivors) {
    now.hp[u.id] = u.hp;
    now.acts[u.id] = u.act?.tick ?? -1;
    st.lowest = Math.min(st.lowest, u.hp / u.maxHp);
    if (was) {
      const before = was.hp[u.id];
      if (before !== undefined && u.hp < before) st.damage += before - u.hp;
      if (u.act?.kind === 'shot' && was.acts[u.id] !== u.act.tick) st.shots++;
    }
    if (s.hunger && hungerLevel(s as BaseState, u.id) === 'starving' && u.hp > 0) st.starved = true;
  }

  if (was) {
    const sprung = (s.traps ?? []).filter((t) => t.kind === 'spike' && !t.armed && was.armed.includes(t.id));
    for (const e of s.enemies) {
      if (e.hp > 0 || !was.alive.includes(e.id)) continue;
      if (was.takedowns.includes(e.id)) st.silentKills++;
      else if (e.side === 'zombie' && sprung.some((t) => t.x === Math.round(e.x) && t.y === Math.round(e.y))) st.trapKills++;
    }
    for (const key of was.blocks) {
      if (now.blocks.includes(key)) continue;
      // A fixed opening that is no longer fixed, or a barricade that is gone, was chewed through.
      st.breaches++;
    }
  }
  st.seen = now;
}

/** The scene's time in whole seconds. */
export const secondsOf = (s: Pick<MissionState, 'tick'>): number => Math.floor(s.tick / TICK_HZ);

/** `m:ss`. */
export function clock(seconds: number): string {
  const t = Math.max(0, Math.round(seconds));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

/** Mission 1: Ghost (no shots, no damage), Quiet (at most one shot), else Loud. */
export function missionGrade(st: Pick<RunStats, 'shots' | 'damage'>): string {
  if (st.shots === 0 && st.damage === 0) return 'ghost';
  return st.shots <= 1 ? 'quiet' : 'loud';
}

/**
 * Base 1 (won): Scraped by when somebody is starving or under 25% at the end, else Fortress when nothing broke
 * through and nobody ever fell under 50%, else Held. `starving` and `lowNow` are read from the end state.
 */
export function baseGrade(st: Pick<RunStats, 'breaches' | 'lowest'>, end: { starving: boolean; lowNow: boolean }): string {
  if (end.starving || end.lowNow) return 'scraped';
  return st.breaches === 0 && st.lowest >= FORTRESS_HP ? 'fortress' : 'held';
}

/** Badge ids earned in Mission 1. */
export function missionBadges(st: Pick<RunStats, 'shots' | 'damage'>, seconds: number): string[] {
  return [st.shots === 0 ? 'silent' : '', st.damage === 0 ? 'untouched' : '', seconds < SWIFT_SECONDS ? 'swift' : ''].filter(Boolean);
}

/** Badge ids earned in Base 1. */
export function baseBadges(st: Pick<RunStats, 'breaches' | 'starved' | 'trapKills'>): string[] {
  return [st.breaches === 0 ? 'noBreach' : '', !st.starved ? 'wellFed' : '', st.trapKills >= TRAPPER_KILLS ? 'trapper' : ''].filter(Boolean);
}

/** What the debrief shows and the records file. */
export interface Result {
  scene: Scene;
  seconds: number;
  grade: string;
  badges: string[];
  /** Label and value rows for the panel, in order. */
  rows: [string, string][];
}

/** Mission 1 won: the counters and the crates opened (of the total) read into a result. */
export function missionResult(s: StatState): Result {
  const st = statsOf(s);
  const seconds = secondsOf(s);
  const opened = s.crates.filter((c) => c.opened).length;
  return {
    scene: 'mission1',
    seconds,
    grade: missionGrade(st),
    badges: missionBadges(st, seconds),
    rows: [
      ['Time', clock(seconds)],
      ['Silent kills', String(st.silentKills)],
      ['Shots', String(st.shots)],
      ['Damage taken', String(Math.round(st.damage))],
      ['Crates', `${opened} of ${s.crates.length}`],
    ],
  };
}

/** Base 1 won: the counters and the survivors' end state read into a result. */
export function baseResult(s: BaseState & { stats?: RunStats }): Result {
  const st = statsOf(s);
  const seconds = secondsOf(s);
  const live = s.survivors.filter((u) => u.hp > 0);
  const grade = baseGrade(st, {
    starving: live.some((u) => hungerLevel(s, u.id) === 'starving'),
    lowNow: live.some((u) => u.hp / u.maxHp < SCRAPED_HP),
  });
  return {
    scene: 'base1',
    seconds,
    grade,
    badges: baseBadges(st),
    rows: [
      ['Time', clock(seconds)],
      ['Shots', String(st.shots)],
      ['Damage taken', String(Math.round(st.damage))],
      ['Trap kills', String(st.trapKills)],
      ['Broken through', String(st.breaches)],
    ],
  };
}
