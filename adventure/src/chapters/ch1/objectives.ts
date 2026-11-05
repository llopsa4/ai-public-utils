import type { GameState } from '../../engine/types';
import type { Objective } from '../types';

/**
 * Mara's notebook of goals, derived only from existing story flags (no new story).
 * Shown in order; steps after the current one stay hidden so the notebook never spoils.
 */
const STEPS: { key: string; done: (s: GameState) => boolean; optional?: boolean }[] = [
  // The morning in everyday clothes (a game saved before these existed is already past them).
  { key: 'obj.wren', done: s => !!(s.flags.hoistHelped || s.flags.hasGauntlet) },
  { key: 'obj.bread', done: s => !!(s.flags.nellFed || s.flags.hasGauntlet) },
  { key: 'obj.dress', done: s => !!(s.flags.dressed || s.flags.hasGauntlet) },
  { key: 'obj.cell', done: s => !!s.flags.hasGauntlet },
  { key: 'obj.notebook', done: s => !!s.flags.hasNotebook },
  { key: 'obj.latch', done: s => !!s.flags.latchFixed },
  { key: 'obj.oren', done: s => !!s.flags.patchFailed },
  { key: 'obj.talk', done: s => !!s.flags.decided },
  { key: 'obj.procedure', done: s => !!s.flags.procedureKnown },
  { key: 'obj.release', done: s => !!s.flags.kilnCold },
  { key: 'obj.goodbye', done: s => !!s.flags.gotBread, optional: true },
  { key: 'obj.leave', done: s => s.room === 'ashways' },
  { key: 'obj.sweeper', done: s => !!s.flags.valveVented },
];

export const OBJECTIVE_KEYS = STEPS.map(s => s.key);


/** Completed steps plus the first open required step (optional steps show only while relevant). */
export function objectives(state: GameState): Objective[] {
  const shown: Objective[] = [];
  for (const step of STEPS) {
    const done = step.done(state);
    const optional = !!step.optional;
    if (done) { shown.push({ key: step.key, done, optional }); continue; }
    shown.push({ key: step.key, done, optional });
    if (!optional) break;
  }
  return shown;
}
