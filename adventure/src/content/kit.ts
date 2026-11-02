import type { CardInstance, CardType, CharacterProfile, Loadout } from '../combat/types';
import { STARTING_EQUIPMENT } from '../combat/gear';

/**
 * Mara's fighting kit, the same in every chapter: health, MP, his deck (Kiln Courier's card rules,
 * src/combat), the gear he starts with, materials, tonics and salvage. Fights, rewards and the gear
 * a chapter hands out are the chapter's own (src/chapters/<id>/combat.ts).
 */

export const HERO_MAX_HP = 60;
export const HERO_MAX_MP = 10;
/** Kiln Courier's starter deck: the pressure gauntlet's moves. */
export const STARTER_DECK: readonly CardType[] = ['strike', 'strike', 'strike', 'guard', 'guard', 'guard', 'piston', 'piston', 'vent', 'shield', 'cycle', 'pulse'];
export const STARTER_CARDS: readonly CardInstance[] = STARTER_DECK.map((type, i) => ({ type, id: `card-${i}` }));

export { STARTING_EQUIPMENT };

/** Gear Mara starts with; the gauntlet is his mother's and cannot be swapped. */
export const STARTING_OWNED = ['courier-gauntlet', 'patched-coat', 'plain-carrier'] as const;
export const LOCKED_SLOTS = ['gauntlet'] as const;

/** Materials (carried between chapters). */
export const MATERIALS: Record<string, { name: string }> = {
  'pressure-coil': { name: 'material.pressureCoil' },
};

/** The Kiln Tonic peddlers sell. */
export const TONIC = { price: 5, heal: 15, max: 3 } as const;
export const MAX_SALVAGE = 9999;

/** What a won fight pays. */
export interface Reward { salvage: number; materials: Record<string, number> }

/** Mara as the card rules see him, from the saved kit. */
export function maraProfile(kit: { hp: number; mp: number; equipment: Loadout }): CharacterProfile {
  return { id: 'mara', name: 'Mara', maxHp: HERO_MAX_HP, hp: Math.max(1, kit.hp), maxMp: HERO_MAX_MP, mp: kit.mp, deck: STARTER_CARDS, equipment: kit.equipment };
}
