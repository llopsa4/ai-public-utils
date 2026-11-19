/** Per-sheet distance timing. Old six-frame rigs retain their existing cadence. */
export interface WalkTiming { distancePerFrame: number; plantFrames: number[]; transitionMs?: number }
export const LEGACY_WALK: WalkTiming = { distancePerFrame: 7, plantFrames: [0, 3] };
export function walkTiming(value?: WalkTiming): WalkTiming {
  return value && Number.isFinite(value.distancePerFrame) && value.distancePerFrame > 0
    && Array.isArray(value.plantFrames) && value.plantFrames.every(f => Number.isInteger(f) && f >= 0) ? value : LEGACY_WALK;
}
export function walkFrameAt(distance: number, count: number, timing: WalkTiming): number {
  return Math.floor(distance / timing.distancePerFrame) % count;
}
