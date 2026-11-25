import type { BaseState } from '../sim/base';
import type { ActKind, MissionState } from '../sim/mission';
import { type Mode, moveMode } from '../sim/vision';

// What the player hears (DESIGN §6 *Audio*): pure rules turning changes in the sim into sound events, like
// `render/fx.ts` does for what is seen. `soundEvents` compares the state with the last look and returns the
// sounds to start, each placed at a tile; `scenes/Feel.ts` places them from the camera and plays them.
// Nothing here touches WebAudio or Phaser, and nothing here changes the sim (the groan timing is its own).

/** Every effect the game plays. `ui` and `blip` are not placed in the world (menus and the dialogue box). */
export type SoundId =
  | 'shot'
  | 'knife'
  | 'club'
  | 'throw'
  | 'bite'
  | 'chew'
  | 'step'
  | 'stepSoft'
  | 'stepRun'
  | 'stepZombie'
  | 'can'
  | 'spike'
  | 'crate'
  | 'groan'
  | 'ui'
  | 'blip';

export interface SoundEvent {
  id: SoundId;
  x: number; // tile
  y: number;
  gain: number; // level of this play, 0..1, before the distance fade
  variant: number; // 0..1: picks pitch and detail, so a crowd does not sound like one voice
}

/** How far a sound carries, in screen widths beyond the screen's edge (`audio/space.ts`). */
export const REACH: Record<SoundId, number> = {
  shot: 1.6,
  knife: 0.7,
  club: 0.8,
  throw: 0.6,
  bite: 0.9,
  chew: 0.9,
  step: 0.45,
  stepSoft: 0.3,
  stepRun: 0.6,
  stepZombie: 0.6,
  can: 1.3,
  spike: 1,
  crate: 0.7,
  groan: 1,
  ui: 1,
  blip: 1,
};

/** Tiles of walking between two footsteps, by how the unit moves. */
export const STRIDE = { run: 0.75, walk: 0.6, crouch: 0.5, crawl: 0.4, zombie: 0.7 } as const;
const STEP_SOUND: Record<Mode | 'zombie', { id: SoundId; gain: number }> = {
  run: { id: 'stepRun', gain: 0.9 },
  walk: { id: 'step', gain: 0.7 },
  crouch: { id: 'stepSoft', gain: 0.55 },
  crawl: { id: 'stepSoft', gain: 0.3 },
  zombie: { id: 'stepZombie', gain: 0.6 },
};
const JUMP = 3; // a unit that moved further than this in one look was moved, not walking: no steps

/** A zombie's gap between groans, in ticks: shorter while it chases. */
const GROAN_CHASE = [25, 65] as const;
const GROAN_IDLE = [70, 210] as const;
const BITE_REACH = 1.6; // tiles: a zombie this near a survivor is biting, further it is chewing a barricade

type Watched = MissionState & { traps?: BaseState['traps'] };

/** What `soundEvents` saw last time. The first look only seeds it, so nothing sounds for what already was. */
export interface SoundWatch {
  seeded: boolean;
  acts: Map<string, number>; // unit id → tick of its latest action cue
  opened: Set<string>; // crates seen opened
  armed: Map<string, boolean>; // spike pits and cans by id: was armed at the last look
  rings: WeakSet<object>; // noise rings already sounded
  walked: Map<string, { x: number; y: number; acc: number }>; // unit id → where it was and the distance since its last step
  groanAt: Map<string, number>; // zombie id → tick of its next groan
}

export const newSoundWatch = (): SoundWatch => ({
  seeded: false,
  acts: new Map(),
  opened: new Set(),
  armed: new Map(),
  rings: new WeakSet(),
  walked: new Map(),
  groanAt: new Map(),
});

/** A repeatable number in [0, 1) from a name and a counter (not the sim's random numbers: the sim stays untouched). */
export function hash01(name: string, n: number): number {
  let h = 2166136261 ^ n;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619);
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  return ((h >>> 0) % 100000) / 100000;
}

const between = (r: readonly [number, number], k: number): number => Math.round(r[0] + (r[1] - r[0]) * k);

const ACT_SOUND: Record<Exclude<ActKind, 'bite'>, { id: SoundId; gain: number }> = {
  stab: { id: 'knife', gain: 0.9 },
  takedown: { id: 'knife', gain: 0.5 }, // a silent kill is quiet to the ear too
  shot: { id: 'shot', gain: 1 },
  club: { id: 'club', gain: 1 },
  hatchet: { id: 'knife', gain: 0.9 },
  bow_shot: { id: 'throw', gain: 0.5 }, // silent to zombies; a soft twang-like swish for the player
  throw: { id: 'throw', gain: 0.8 },
};

/** The sounds to start now: new action cues, an opened crate, a sprung trap, a ringing can, footsteps and groans. */
export function soundEvents(w: SoundWatch, s: Watched): SoundEvent[] {
  const out: SoundEvent[] = [];
  const first = !w.seeded;
  w.seeded = true;
  const units = [...s.survivors, ...s.enemies];

  for (const u of units) {
    // Action cues: a new tick on the unit's `act` is one new action.
    const seen = w.acts.get(u.id);
    if (u.act) {
      if (!first && seen !== undefined && seen !== u.act.tick) {
        if (u.act.kind === 'bite') {
          const near = s.survivors.some((v) => v.hp > 0 && Math.hypot(v.x - u.x, v.y - u.y) <= BITE_REACH);
          out.push({ id: near ? 'bite' : 'chew', x: u.x, y: u.y, gain: 1, variant: hash01(u.id, u.act.tick) });
        } else {
          const a = ACT_SOUND[u.act.kind];
          out.push({ id: a.id, x: u.x, y: u.y, gain: a.gain, variant: hash01(u.id, u.act.tick) });
        }
      }
      w.acts.set(u.id, u.act.tick);
    } else if (seen === undefined) w.acts.set(u.id, -1);

    // Footsteps: one every `stride` tiles walked, by how it moves.
    const was = w.walked.get(u.id);
    if (u.hp > 0 && was) {
      const d = Math.hypot(u.x - was.x, u.y - was.y);
      if (d > JUMP) was.acc = 0;
      else was.acc += d;
      const mode: Mode | 'zombie' = u.side === 'survivor' ? moveMode(u) : u.side === 'zombie' ? 'zombie' : 'walk'; // a human guard walks
      if (!first && was.acc >= STRIDE[mode]) {
        was.acc = 0;
        out.push({ id: STEP_SOUND[mode].id, x: u.x, y: u.y, gain: STEP_SOUND[mode].gain, variant: hash01(u.id, s.tick) });
      }
      was.x = u.x;
      was.y = u.y;
    } else w.walked.set(u.id, { x: u.x, y: u.y, acc: 0 });

    // Groans: a living zombie calls out now and then, more often while it chases.
    if (u.side === 'zombie' && u.hp > 0) {
      const due = w.groanAt.get(u.id);
      const chase = u.ai.mode === 'chase';
      if (due === undefined) w.groanAt.set(u.id, s.tick + between(GROAN_IDLE, hash01(u.id, 0)) / 2);
      else if (s.tick >= due) {
        if (!first) out.push({ id: 'groan', x: u.x, y: u.y, gain: chase ? 1 : 0.8, variant: hash01(u.id, s.tick) });
        w.groanAt.set(u.id, s.tick + between(chase ? GROAN_CHASE : GROAN_IDLE, hash01(u.id, s.tick + 1)));
      }
    }
  }

  for (const c of s.crates) {
    if (c.opened && !w.opened.has(c.id)) {
      w.opened.add(c.id);
      if (!first) out.push({ id: 'crate', x: c.x, y: c.y, gain: 1, variant: hash01(c.id, s.tick) });
    }
  }

  for (const t of s.traps ?? []) {
    const was = w.armed.get(t.id);
    if (t.kind === 'spike' && was === true && !t.armed) out.push({ id: 'spike', x: t.x, y: t.y, gain: 1, variant: hash01(t.id, s.tick) });
    w.armed.set(t.id, t.armed);
  }

  for (const r of s.rings) {
    if (w.rings.has(r)) continue;
    w.rings.add(r);
    if (!first && r.kind === 'can') out.push({ id: 'can', x: r.x, y: r.y, gain: 1, variant: hash01(r.from, s.tick) });
  }
  return out;
}
