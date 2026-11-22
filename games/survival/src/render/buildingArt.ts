// Which frame a building shows (art/SPEC.md section 5): `stage1` to `stage3` while it is built, then `finished`, or
// `winter` in the winter season; a barricade picks its piece by the neighbours it touches; the drying rack loops;
// the fire and fire pits carry a flame. Pure: no Phaser, so a test can check every pick against the validator's frames.
import { entry } from './manifest';

const pad = (n: number): string => String(n).padStart(2, '0');

/** A building's state label: stage1 below 34% built, stage2 below 67%, stage3 below 100%, then finished or winter. */
export function buildingState(built: number, points: number, done: boolean, winter: boolean): string {
  if (done) return winter ? 'winter' : 'finished';
  const f = points > 0 ? built / points : 0;
  return f < 0.34 ? 'stage1' : f < 0.67 ? 'stage2' : 'stage3';
}

/** The state a key really has: a key without a `winter` (or the asked) state shows `finished`, or its first state. */
function stateOf(key: string, state: string): string {
  const states = entry(key).states ?? [];
  if (states.includes(state)) return state;
  if (state === 'winter' && states.includes('finished')) return 'finished';
  return states.includes('finished') ? 'finished' : (states[0] ?? state);
}

/** A barricade's mask: NE (x, y-1) = 1, SE (x+1, y) = 2, SW (x, y+1) = 4, NW (x-1, y) = 8 when that tile holds a barricade. */
export function barricadeMask(has: (x: number, y: number) => boolean, x: number, y: number): number {
  return (has(x, y - 1) ? 1 : 0) | (has(x + 1, y) ? 2 : 0) | (has(x, y + 1) ? 4 : 0) | (has(x - 1, y) ? 8 : 0);
}

/** The loop frame number of an animation at `ms` of scene time, offset by `phase` so a crowd of them is not in step. */
export function loopFrame(frames: number, fps: number, ms: number, phase = 0): number {
  return Math.floor((ms / 1000) * fps + phase) % frames;
}

/**
 * The atlas frame a building key shows: its state (and, for a masked key such as the barricade, its mask); a state
 * with an animation (the drying rack) takes the loop frame at `ms`. `mask` is ignored for keys without masks.
 */
export function buildingFrame(key: string, state: string, mask = 0, ms = 0, phase = 0): string {
  const e = entry(key);
  const st = stateOf(key, state);
  if (e.variants) return `${key}/${st}/${mask}`;
  const anim = e.anims?.[st];
  const n = anim ? loopFrame(anim.frames, anim.fps, ms, phase) : 0;
  return `${key}/${st}/${pad(n)}`;
}

/** The flame loop's frame (`fx_flame`) at `ms`. */
export function flameFrame(ms: number, phase = 0): string {
  const loop = entry('fx_flame').anims?.loop;
  return `fx_flame/loop/${pad(loop ? loopFrame(loop.frames, loop.fps, ms, phase) : 0)}`;
}

/** Buildings that carry a flame (finished only) and the flame's scale relative to the art scale: the fire pit's is half. */
export const FLAMES: Record<string, number> = { fire: 1, fire_pit: 0.5 };
