/**
 * Commandos-style left click (DESIGN §1 *Mouse*): what one left click does and which cursor it earns.
 * Pure, so scenes only describe what lies under the pointer and this decides; the scenes carry out the order.
 */

/** What is under the pointer: a survivor, an enemy, a usable object (stove, crate, broken door or window), open ground, or nothing (off the map). */
export type ClickTarget = 'survivor' | 'enemy' | 'object' | 'ground' | 'none';

/** What the click does. `nothing` leaves the selection and orders alone. */
export type ClickAction = 'select' | 'attack' | 'use' | 'walk' | 'nothing';

/**
 * A survivor is always selected (even while paused). Every other action is an order, so it needs a selected
 * survivor and a scene that accepts orders (`canOrder`); with none, the click does nothing.
 */
export function resolveClick(target: ClickTarget, canOrder: boolean): ClickAction {
  if (target === 'survivor') return 'select';
  if (!canOrder) return 'nothing';
  if (target === 'enemy') return 'attack';
  if (target === 'object') return 'use';
  if (target === 'ground') return 'walk';
  return 'nothing';
}

/** The cursor a click would earn: CSS cursors until Codex's cursor art (A6) replaces them. */
export const CURSORS: Readonly<Record<ClickAction | 'target' | 'invalid', string>> = {
  select: 'pointer',
  attack: 'crosshair',
  use: 'grab',
  walk: 'move',
  nothing: 'default',
  target: 'crosshair', // a pending V / L / B / T / X is waiting for a click
  invalid: 'not-allowed', // Finish aimed at anything but a squatter about to turn (the red-cross pointer)
};

/** The pointer while Finish waits for its click (DESIGN §26). */
export const finishCursor = (valid: boolean): string => (valid ? CURSORS.target : CURSORS.invalid);

export function cursorFor(action: ClickAction, pending: boolean): string {
  return pending ? CURSORS.target : CURSORS[action];
}

/** A second walk click within this long and this close upgrades the walk to a run. */
export const DOUBLE_MS = 300;
export const DOUBLE_PX = 24;

/**
 * Tells a double left-click on the ground from two single ones. Walking has no delay: the first click orders
 * a walk at once and `walkClick` of the second returns true, so the scene re-orders it as a run. Only walk
 * clicks count; any other click (a survivor, an object, an attack, a pending order) calls `reset`, so a
 * double-click on a survivor only selects.
 */
export class DoubleClick {
  private last: { x: number; y: number; at: number } | null = null;

  /** A walk click at screen (x, y) at time `at` (ms). True when it is the second of a double-click. */
  walkClick(x: number, y: number, at: number): boolean {
    const l = this.last;
    if (l && at - l.at <= DOUBLE_MS && Math.hypot(x - l.x, y - l.y) <= DOUBLE_PX) {
      this.last = null; // a third click starts over
      return true;
    }
    this.last = { x, y, at };
    return false;
  }

  reset(): void {
    this.last = null;
  }
}
