import type { BattleStats, EquipmentSlot, Loadout } from '../game/types';

export interface EquipmentDefinition {
  readonly name: string;
  readonly slot: EquipmentSlot;
  readonly bonuses: Readonly<Partial<BattleStats>>;
  readonly upgradedBonuses?: Readonly<Partial<BattleStats>>;
}
// Bonuses are totals, not an additional bonus applied on top of the base item.
export const EQUIPMENT: Readonly<Record<string, EquipmentDefinition>> = {
  'courier-gauntlet': { name: 'Courier Gauntlet', slot: 'gauntlet', bonuses: {} },
  'patched-coat': { name: 'Patched Ceramic Coat', slot: 'armor', bonuses: {} },
  'plain-carrier': { name: 'Plain Carrier', slot: 'utility', bonuses: {} },
  'heavy-gauntlet': { name: 'Heavy Gauntlet', slot: 'gauntlet', bonuses: { power: 2, attackStrain: 1 }, upgradedBonuses: { power: 3, attackStrain: 1 } },
  'balanced-gauntlet': { name: 'Balanced Gauntlet', slot: 'gauntlet', bonuses: { power: 1 }, upgradedBonuses: { power: 2 } },
  'layered-armor': { name: 'Layered Armor', slot: 'armor', bonuses: { defense: 2, speed: -1 }, upgradedBonuses: { defense: 3, speed: -1 } },
  'light-armor': { name: 'Light Armor', slot: 'armor', bonuses: { defense: 1, speed: 1 }, upgradedBonuses: { defense: 2, speed: 1 } },
  'quick-harness': { name: 'Quick-release Harness', slot: 'utility', bonuses: { speed: 2 }, upgradedBonuses: { speed: 4 } },
  'insulated-kit': { name: 'Insulated Kit', slot: 'utility', bonuses: { defense: 1, maxMp: 1 }, upgradedBonuses: { defense: 2, maxMp: 1 } },
};
export const STARTING_EQUIPMENT: Loadout = {
  gauntlet: { id: 'courier-gauntlet' }, armor: { id: 'patched-coat' }, utility: { id: 'plain-carrier' },
};
