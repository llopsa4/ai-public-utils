import type { GameState } from '../../engine/types';
import type { Objective } from '../types';

/**
 * Mara's notebook of goals for chapter 2, from its story flags (steps after the current one stay
 * hidden). Keys are shared with the hint strings (`hint.<name>.1/.2`), so they are unique across
 * chapters.
 */
const STEPS: { key: string; done: (s: GameState) => boolean; optional?: boolean }[] = [
  { key: 'obj.knock', done: s => !!s.flags.knocked },
  { key: 'obj.spar', done: s => !!s.flags.sparred },
  { key: 'obj.listen', done: s => !!s.flags.namedNeed },
  { key: 'obj.records', done: s => !!s.flags.recordsRead },
  { key: 'obj.retune', done: s => !!s.flags.retuned },
  { key: 'obj.supper', done: s => !!s.flags.ate, optional: true },
  { key: 'obj.letter', done: s => !!s.flags.letterSent },
  { key: 'obj.supplies', done: s => !!s.flags.askedForHelp },
  { key: 'obj.map', done: s => !!s.flags.sawValley },
  { key: 'obj.farDoor', done: () => false },
];

export const OBJECTIVE_KEYS = STEPS.map(s => s.key);

/** Completed steps plus the first open required step (optional steps show only while relevant). */
export function objectives(state: GameState): Objective[] {
  const shown: Objective[] = [];
  for (const step of STEPS) {
    const done = step.done(state);
    const optional = !!step.optional;
    if (done) { shown.push({ key: step.key, done, optional }); continue; }
    if (optional) { if (state.flags.retuned) shown.push({ key: step.key, done, optional }); continue; }
    shown.push({ key: step.key, done, optional });
    break;
  }
  return shown;
}
