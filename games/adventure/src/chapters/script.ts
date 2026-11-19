// Small builders for the commands and conditions every chapter's click rules are written with
// (src/chapters/<id>/interactions.ts), so each chapter does not declare its own copies.
import type { ActorId, Command, Condition, Point, Speaker } from '../engine/types';

/** A spoken line (the hero's unless another speaker is named), optionally at a point. */
export const say = (text: string, actor: Speaker = 'hero', at?: Point): Command => (at ? { type: 'say', actor, text, at } : { type: 'say', actor, text });
/** Sets a story flag (or clears it with `false`). */
export const flag = (name: string, value = true): Command => ({ type: 'setFlag', flag: name, value });
export const add = (item: string): Command => ({ type: 'addItem', item });
export const drop = (item: string): Command => ({ type: 'removeItem', item });
export const pose = (actor: ActorId, p: 'stand' | 'crouch' | 'dead'): Command => ({ type: 'pose', actor, pose: p });
export const wait = (ms: number): Command => ({ type: 'wait', ms });
export const go = (room: string, entry: string): Command => ({ type: 'room', room, entry });
export const walk = (x: number, y: number, face: 'left' | 'right' | 'up' | 'down'): Command => ({ type: 'walk', to: { x, y }, face });
export const shake = (ms: number): Command => ({ type: 'shake', ms });
/** Holds while the flag is set. */
export const F = (name: string): Condition[] => [{ flag: name }];
/** Holds while the flag is not set. */
export const NOT = (name: string): Condition[] => [{ notFlag: name }];
