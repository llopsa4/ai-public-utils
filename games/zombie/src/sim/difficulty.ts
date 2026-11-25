import base from '../data/base1.json';
import levels from '../data/difficulty.json';
import enemies from '../data/enemies.json';

// Difficulty (DESIGN §21): Easy / Normal / Hard. `data/difficulty.json` holds only what a level changes; Normal
// is empty, so today's tuning in `base1.json` and `enemies.json` stays the one source. The level is chosen in
// Options and stamped on a scene's state when it starts or restarts (`MissionState.difficulty`), so a herd
// checkpoint keeps the level it began with and the record is filed under it. The Intro (tutorial) always
// plays on Normal.

export type Difficulty = 'easy' | 'normal' | 'hard';
export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'normal', 'hard'];
export const DIFFICULTY_NAME: Readonly<Record<Difficulty, string>> = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };

/** The numbers one level plays with. */
export interface Tuning {
  /** Ammo added when Mission 1 or Base 1 starts or restarts. */
  ammoBonus: number;
  /** Added to every Mission 1 crate that holds ammo (never below 0). */
  crateAmmo: number;
  herd: number;
  hungerSeconds: number;
  roamers: { start: number; max: number };
  zombieSight: { radius: number; crouchRadius: number };
}

interface Override {
  ammoBonus?: number;
  crateAmmo?: number;
  herd?: number;
  hungerSeconds?: number;
  roamers?: { start: number; max: number };
  zombieSight?: { radius: number; crouchRadius: number };
}

const NORMAL: Tuning = {
  ammoBonus: 0,
  crateAmmo: 0,
  herd: base.herd.count,
  hungerSeconds: base.hunger.seconds,
  roamers: { start: base.roamers.start, max: base.roamers.max },
  zombieSight: { ...enemies.zombie.sight },
};

const TUNINGS = Object.fromEntries(
  DIFFICULTIES.map((d) => [d, { ...NORMAL, ...((levels as Record<Difficulty, Override>)[d] ?? {}) }]),
) as Record<Difficulty, Tuning>;

export function isDifficulty(v: unknown): v is Difficulty {
  return DIFFICULTIES.some((d) => d === v);
}

/** The numbers for a level; anything that is not a level reads as Normal (old saves). */
export function tuning(d: Difficulty | undefined): Readonly<Tuning> {
  return TUNINGS[isDifficulty(d) ? d : 'normal'];
}

/** The next level in the Options cycle Easy → Normal → Hard → Easy. */
export function nextDifficulty(d: Difficulty): Difficulty {
  return DIFFICULTIES[(DIFFICULTIES.indexOf(d) + 1) % DIFFICULTIES.length]!;
}
