import type { CardInstance, CardType, CharacterProfile, EncounterDefinition, Loadout } from '../combat/types';
import { STARTING_EQUIPMENT } from '../combat/gear';
import { LESSON_ENCOUNTER } from '../kc/content/tutorial';

/**
 * Mara's fighting kit and the scene's one fight. The card rules are Kiln Courier's
 * (src/combat/*, copied from FFCardGame); everything here is Cinderfold's own content.
 */

export const HERO_MAX_HP = 60;
export const HERO_MAX_MP = 10;
/** Kiln Courier's starter deck: the pressure gauntlet's moves. */
export const STARTER_DECK: readonly CardType[] = ['strike', 'strike', 'strike', 'guard', 'guard', 'guard', 'piston', 'piston', 'vent', 'shield', 'cycle', 'pulse'];
export const STARTER_CARDS: readonly CardInstance[] = STARTER_DECK.map((type, i) => ({ type, id: `card-${i}` }));

export { STARTING_EQUIPMENT };

/** What Oren hands over after the fight: his spares for the armor and utility slots. */
export const OREN_SPARES = ['light-armor', 'quick-harness'] as const;
/** Gear Mara starts with; the gauntlet is his mother's and cannot be swapped in this chapter. */
export const STARTING_OWNED = ['courier-gauntlet', 'patched-coat', 'plain-carrier'] as const;
export const LOCKED_SLOTS = ['gauntlet'] as const;

/** Materials: kept for later chapters (no use yet). */
export const MATERIALS: Record<string, { name: string }> = {
  'pressure-coil': { name: 'material.pressureCoil' },
};

/** The merchant's tonic. */
export const TONIC = { price: 5, heal: 15, max: 3 } as const;
export const MAX_SALVAGE = 9999;

export const ENCOUNTERS: Record<string, EncounterDefinition> = {
  // A pressure scavenger squeezed out of the gallery's maintenance hatch, drawn by the regulator's
  // pulse: the enemy of Kiln Courier's guided lesson (src/kc/content/tutorial.ts).
  hatchScavenger: LESSON_ENCOUNTER,
};

/** What winning each fight gives. */
export const REWARDS: Record<string, { salvage: number; materials: Record<string, number> }> = {
  hatchScavenger: { salvage: 12, materials: { 'pressure-coil': 1 } },
};

/** Mara as the card rules see him, from the saved kit. */
export function maraProfile(kit: { hp: number; mp: number; equipment: Loadout }): CharacterProfile {
  return { id: 'mara', name: 'Mara', maxHp: HERO_MAX_HP, hp: Math.max(1, kit.hp), maxMp: HERO_MAX_MP, mp: kit.mp, deck: STARTER_CARDS, equipment: kit.equipment };
}
