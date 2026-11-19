import type { Command } from '../../engine/types';
import { say } from '../script';

/** Kell sees through an undisguised Silas: the alarm, then (only imagined) back at the top of the stairs. */
export const KELL_SEES: Command[] = [
  { type: 'face', actor: 'warden', face: 'left' },
  say('line.i.kellSees', 'warden'),
  { type: 'shake', ms: 400 },
  { type: 'fade', to: 'black', ms: 700 },
  say('line.i.kellSeesThink'),
  { type: 'room', room: 'guardroom', entry: 'fromCell' },
];
