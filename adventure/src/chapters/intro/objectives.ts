import type { GameState } from '../../engine/types';
import type { Objective } from '../types';

/** Silas's goals for the escape (steps after the current one stay hidden). Keys share `hint.<name>.1/.2`. */
const STEPS: { key: string; done: (s: GameState) => boolean }[] = [
  { key: 'obj.i.light', done: s => !!s.flags.cellLit },
  { key: 'obj.i.frame', done: s => !!s.flags.gotFrame },
  { key: 'obj.i.face', done: s => !!s.flags.harrowMade },
  { key: 'obj.i.guard', done: s => !!s.flags.guardGone },
  { key: 'obj.i.door', done: s => !!s.flags.cellOpen },
  { key: 'obj.i.past', done: s => !!s.flags.wardenBusy },
  { key: 'obj.i.grate', done: s => !!s.flags.grateOpen },
  { key: 'obj.i.out', done: s => !!s.flags.metSigrid },
];

export const OBJECTIVE_KEYS = STEPS.map(s => s.key);

export function objectives(state: GameState): Objective[] {
  const open = STEPS.findIndex(s => !s.done(state));
  const shown = open < 0 ? STEPS : STEPS.slice(0, open + 1);
  return shown.map(s => ({ key: s.key, done: s.done(state), optional: false }));
}

/** What Silas has read in people, for his notebook. */
export function reflections(state: GameState): string[] {
  return [
    ...(state.flags.readGuard ? ['note.i.guard'] : []),
    ...(state.flags.sawHarrow ? ['note.i.harrow'] : []),
    ...(state.flags.readWarden ? ['note.i.warden'] : []),
  ];
}
