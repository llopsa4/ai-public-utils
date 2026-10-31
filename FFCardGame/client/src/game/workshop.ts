import { EQUIPMENT, STARTING_EQUIPMENT } from '../content/equipment';
import { deriveStats, openingHandSize, withEquipment } from './equipment';
import type { CharacterProfile, EquippedItem } from './types';

export const SHOP_PRICES: Readonly<Record<string, number>> = { 'heavy-gauntlet': 32, 'balanced-gauntlet': 24, 'layered-armor': 32, 'light-armor': 24, 'quick-harness': 24, 'insulated-kit': 24 };
export const GEAR_UPGRADE_COST = 20, CARD_UPGRADE_COST = 16, CARD_REMOVE_COST = 20, MIN_DECK = 8;
export function equipOwned(profile: CharacterProfile, item: EquippedItem): CharacterProfile {
  return withEquipment(profile, { ...(profile.equipment ?? STARTING_EQUIPMENT), [EQUIPMENT[item.id].slot]: item });
}

// A catalogue entry must represent the version actually owned, not a fresh base item.
export function catalogueItem(owned: readonly EquippedItem[], id: string): EquippedItem {
  return { ...(owned.find(item => item.id === id) ?? { id }) };
}

export function equipmentComparison(profile: CharacterProfile, item: EquippedItem) {
  const current = deriveStats(profile), after = deriveStats(equipOwned(profile, item));
  const values = [
    { key:'power', label:'Power', before:current.power, after:after.power, lowerBetter:false },
    { key:'defense', label:'Defense', before:current.defense, after:after.defense, lowerBetter:false },
    { key:'speed', label:'Speed', before:current.speed, after:after.speed, lowerBetter:false },
    { key:'opening', label:'Opening cards', before:openingHandSize(5,current.speed), after:openingHandSize(5,after.speed), lowerBetter:false },
    { key:'maxMp', label:'Maximum MP', before:current.maxMp, after:after.maxMp, lowerBetter:false },
    { key:'attackStrain', label:'Extra attack strain', before:current.attackStrain, after:after.attackStrain, lowerBetter:true },
  ];
  return { values, changed:values.filter(value => value.before !== value.after) };
}
