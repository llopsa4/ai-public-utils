// Theo's enemy highlight (DESIGN §5, §25): when the button exists and who it marks. Pure; the toggle itself is a
// view setting in the scene and changes nothing in the sim.
import type { MissionState, SurvivorKind } from './mission';

/** Theo's survivor kind (DESIGN §5). */
export const THEO_KIND: SurvivorKind = 'tinkerer';

/** True while Theo is in the scene: a living squad member, or the voice on the speaker (Mission 2). */
export function highlightAvailable(s: Pick<MissionState, 'survivors' | 'theoOnAir'>): boolean {
  return s.theoOnAir === true || s.survivors.some((u) => u.kind === THEO_KIND && u.hp > 0);
}

/** The enemies the highlight marks: every living one, wherever it is; none when Theo is not in the scene. */
export function highlighted(s: Pick<MissionState, 'survivors' | 'theoOnAir' | 'enemies'>): MissionState['enemies'] {
  return highlightAvailable(s) ? s.enemies.filter((e) => e.hp > 0) : [];
}
