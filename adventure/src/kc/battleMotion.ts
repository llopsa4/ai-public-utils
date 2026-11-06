import type { CombatMotion } from '@kc/hooks/useBattle';

export const APPROACH_MS = 200;
export const CONTACT_MS = 500;
export const RETURN_MS = 200;
export const ATTACK_MS = APPROACH_MS + CONTACT_MS + RETURN_MS;
export const FEEDBACK_MS = 420;

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
