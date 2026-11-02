import type { EncounterDefinition } from '../../combat/types';
import type { Reward } from '../../content/kit';
import { LESSON_ENCOUNTER } from '../../kc/content/tutorial';

/** Chapter 1's fight, what it pays, and the gear Oren hands over afterwards. */

export const ENCOUNTERS: Record<string, EncounterDefinition> = {
  // A pressure scavenger squeezed out of the gallery's maintenance hatch, drawn by the regulator's
  // pulse: the enemy of Kiln Courier's guided lesson (src/kc/content/tutorial.ts).
  hatchScavenger: LESSON_ENCOUNTER,
};

export const REWARDS: Record<string, Reward> = {
  hatchScavenger: { salvage: 12, materials: { 'pressure-coil': 1 } },
};

/** What Oren hands over after the fight: his spares for the armor and utility slots. */
export const OREN_SPARES = ['light-armor', 'quick-harness'];
