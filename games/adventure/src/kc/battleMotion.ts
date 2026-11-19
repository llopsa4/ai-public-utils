import type { CombatMotion } from '@kc/hooks/useBattle';

export const APPROACH_MS = 200;
export const CONTACT_MS = 500;
export const RETURN_MS = 200;
export const ATTACK_MS = APPROACH_MS + CONTACT_MS + RETURN_MS;
export const FEEDBACK_MS = 420;

/** Aim the existing punch's upper body while keeping its legs planted. */
export function roomContact(heroSize: number, enemySize: number, gap: number): { degrees: number; advance: number } {
  // Knuckles (97%,21.5%), waist pivot (45%,56%) in the square punch picture.
  const x = .52 * heroSize, y = .345 * heroSize;
  const low = enemySize < heroSize * .78;
  const angle = low ? Math.min(65 * Math.PI / 180, Math.max(0,
    Math.atan2(y, x) + Math.asin(Math.max(-1, Math.min(1, (.44 * heroSize - .55 * enemySize) / Math.hypot(x, y)))))) : 0;
  const reach = low ? -.05 * heroSize + x * Math.cos(angle) + y * Math.sin(angle) : .47 * heroSize;
  return { degrees: angle * 180 / Math.PI, advance: Math.max(24, gap - reach - enemySize * .2) };
}

export type AttackPhase = 'idle' | 'approach' | 'contact' | 'return';
export type HeroPose = 'lower' | 'upper' | 'punch';

export function isOffensive(motion: CombatMotion): boolean {
  return motion === 'strike' || motion === 'heavy' || motion === 'pulse';
}

export function combatDuration(motion: CombatMotion): number {
  return isOffensive(motion) ? ATTACK_MS : FEEDBACK_MS;
}

/** Contact includes its starting boundary and lasts exactly CONTACT_MS. */
export function attackPhase(elapsed: number): AttackPhase {
  if (elapsed < APPROACH_MS) return 'approach';
  if (elapsed < APPROACH_MS + CONTACT_MS) return 'contact';
  if (elapsed < ATTACK_MS) return 'return';
  return 'idle';
}

export function heroPose(phase: AttackPhase): HeroPose {
  return phase === 'approach' ? 'upper' : phase === 'contact' ? 'punch' : 'lower';
}
