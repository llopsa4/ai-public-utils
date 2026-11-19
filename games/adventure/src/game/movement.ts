import type { Point } from '../engine/types';
import type { WalkArea } from '../engine/pathfinding';

/** Direct movement stops at barriers; it never finds a detour or crosses a thin obstacle. */
export function directionalStep(area: WalkArea, from: Point, direction: Point, distance: number): Point {
  const length = Math.hypot(direction.x, direction.y);
  if (!length || distance <= 0) return { ...from };
  const count = Math.ceil(distance / 3);
  const dx = direction.x / length * distance / count, dy = direction.y / length * distance / count;
  let at = { ...from };
  for (let i = 0; i < count; i++) {
    const next = { x: at.x + dx, y: at.y + dy };
    if (!area.lineOfSight(at, next)) break;
    at = next;
  }
  return at;
}
