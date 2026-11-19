import type { CardInstance, CardType, CardUpgrade, CharacterProfile, Loadout } from '../combat/types';
import { EQUIPMENT, STARTING_EQUIPMENT } from '../combat/gear';

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

/**
 * What Mara wears besides his gear: shown on the paper doll in their own slots, always worn and
 * without bonuses (Kiln Courier's rules have no pants or boots slots, so fights ignore them).
 */
export const BASIC_WEAR = {
  pants: { id: 'work-trousers', name: 'Work Trousers', description: 'Heavy cloth with ceramic knee plates, patched at both knees.' },
  boots: { id: 'courier-boots', name: 'Courier Boots', description: 'Stitched leather, resoled more than once.' },
} as const;
export type WearSlot = keyof typeof BASIC_WEAR;

/** Every piece of gear in Kiln Courier's rules (the debug gear screen shows them all). */
export const ALL_GEAR: readonly string[] = Object.keys(EQUIPMENT);

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

/**
 * Techniques a teacher can pass on: Kiln Courier's card upgrades, with the growth that comes with
 * them (as Kiln Courier's teacher stop grants). Tempered Flow turns the Kiln Pulse into a cheaper,
 * cooler strike (3 MP, 3 strain).
 */
export const TECHNIQUES: Partial<Record<CardUpgrade, { name: string; card: CardType; maxHp: number; maxMp: number }>> & Record<string, { name: string; card: CardType; maxHp: number; maxMp: number }> = {
  'tempered-flow': { name: 'Tempered Flow', card: 'pulse', maxHp: 6, maxMp: 2 },
};

/** Mara's deck with what he has learned: the technique's card carries its upgrade. */
export function maraDeck(techniques: readonly string[] = []): readonly CardInstance[] {
  return STARTER_CARDS.map(card => {
    const t = Object.entries(TECHNIQUES).find(([id, def]) => techniques.includes(id) && def.card === card.type);
    return t ? { ...card, upgrade: t[0] as CardUpgrade } : { ...card };
  });
}

/** Mara as the card rules see him, from the saved kit. */
export function maraProfile(kit: { hp: number; mp: number; equipment: Loadout; maxHp?: number; maxMp?: number; techniques?: readonly string[] }): CharacterProfile {
  return {
    id: 'mara', name: 'Mara', maxHp: kit.maxHp ?? HERO_MAX_HP, hp: Math.max(1, kit.hp), maxMp: kit.maxMp ?? HERO_MAX_MP, mp: kit.mp,
    deck: maraDeck(kit.techniques), equipment: kit.equipment,
  };
}
