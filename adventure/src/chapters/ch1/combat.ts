import type { EncounterDefinition } from '../../combat/types';
import type { Reward } from '../../content/kit';

/** Chapter 1's fight, what it pays, and the gear Oren hands over afterwards. */

export const ENCOUNTERS: Record<string, EncounterDefinition> = {
  ashwaysBoss: {
    id: 'berserk-ash-sweeper', title: 'ASHWAYS', energyPerTurn: 3, handSize: 5,
    enemy: { name: 'Berserk Ash Sweeper', label: 'Sweeper', maxHp: 52, intents: [
      { name: 'Pressure winding', damage: 0, block: 4 },
      { name: 'Brush surge', damage: 12, block: 0 },
      { name: 'Motor stall', damage: 0, block: 0 },
    ] },
    introduction: 'Pressure gathers behind the damaged brushes. Watch for the heavy sweep; strike when its motor stalls.',
    victoryText: 'The brushes slow. The damaged motor clicks once and goes safely still.',
  },
  // A pressure scavenger squeezed out of the gallery's maintenance hatch, drawn by the regulator's
  // pulse. The first fight is Kiln Courier's guided lesson taught against it (same cards and steps).
  hatchScavenger: {
    id: 'hatch-scavenger', title: 'REGULATOR GALLERY',
    enemy: { name: 'Hatch Scavenger', label: 'Scavenger', maxHp: 30, intents: [{ name: 'Collect', damage: 4, block: 0 }] },
    energyPerTurn: 3, handSize: 5,
    introduction: 'Something squeezed out of the hatch, drawn to the regulator. Read its intention before acting.',
    victoryText: 'The scavenger shudders, sparks, and goes still.',
  },
};

/** The lesson's prompts that name its enemy, reworded for the scavenger (by step index). */
export const LESSON_PROMPTS: Readonly<Record<number, string>> = {
  0: 'Inspect what the scavenger will do.',
  17: 'Finish the scavenger off.',
  18: 'It is down.',
};

export const REWARDS: Record<string, Reward> = {
  ashwaysBoss: { salvage: 8, materials: {} },
  hatchScavenger: { salvage: 12, materials: { 'pressure-coil': 1 } },
};

/** What Oren hands over after the fight: his spares for the armor and utility slots. */
export const OREN_SPARES = ['light-armor', 'quick-harness'];
