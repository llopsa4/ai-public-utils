import { EQUIPMENT, STARTING_EQUIPMENT } from '../content/equipment';
import { withEquipment } from './equipment';
import type { CharacterProfile, EquippedItem } from './types';

export const SHOP_PRICES: Readonly<Record<string, number>> = { 'heavy-gauntlet': 32, 'balanced-gauntlet': 24, 'layered-armor': 32, 'light-armor': 24, 'quick-harness': 24, 'insulated-kit': 24 };
export const GEAR_UPGRADE_COST = 20, CARD_UPGRADE_COST = 16, CARD_REMOVE_COST = 20, MIN_DECK = 8;
export function equipOwned(profile: CharacterProfile, item: EquippedItem): CharacterProfile {
  return withEquipment(profile, { ...(profile.equipment ?? STARTING_EQUIPMENT), [EQUIPMENT[item.id].slot]: item });
}
