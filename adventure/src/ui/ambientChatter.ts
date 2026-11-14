import type { Point } from '../engine/types';

/** Retain the old short-remark timing, extending complete phrases for comfortable reading. */
export function chatterDuration(text: string): number {
  return Math.max(2600, 900 + text.length * 55);
}

/** One complete outlined phrase follows its speaker, then drifts and fades within the stage. */
export function placeChatter(anchor: Point, size: { width: number; height: number },
  stage: { width: number; height: number }, progress: number, reducedMotion: boolean): Point & { opacity: number } {
  const p = Math.max(0, Math.min(1, progress));
  const drift = reducedMotion ? 0 : p;
  const clamp = (value: number, extent: number, total: number) => Math.max(4, Math.min(total - extent - 4, value));
  return {
    x: clamp(anchor.x - size.width / 2 + drift * 10, size.width, stage.width),
    y: clamp(anchor.y - size.height - 8 - drift * 22, size.height, stage.height),
    opacity: Math.max(0, Math.min(1, p / 0.08, (1 - p) / 0.22)),
  };
}
