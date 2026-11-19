import { EQUIPMENT, STARTING_EQUIPMENT } from '../content/equipment';
import type { BattleStats, CharacterProfile, EquipmentSlot, Loadout } from './types';

export const EQUIPMENT_SLOTS: readonly EquipmentSlot[] = ['gauntlet', 'armor', 'utility'];
export function deriveStats(profile: CharacterProfile): BattleStats {
  if (!Number.isSafeInteger(profile.maxMp) || profile.maxMp < 0) throw new Error('Invalid base maximum MP');
  const stats: BattleStats = { power: 0, defense: 0, speed: 0, maxMp: profile.maxMp, attackStrain: 0 };
  const loadout = profile.equipment ?? STARTING_EQUIPMENT;
  for (const slot of EQUIPMENT_SLOTS) {
    const equipped = loadout[slot];
    const item = equipped && Object.hasOwn(EQUIPMENT, equipped.id) ? EQUIPMENT[equipped.id] : undefined;
    if (!item || item.slot !== slot || (equipped.upgraded !== undefined && typeof equipped.upgraded !== 'boolean') || (equipped.upgraded && !item.upgradedBonuses)) throw new Error('Invalid equipped item');
    const bonuses = equipped.upgraded ? item.upgradedBonuses! : item.bonuses;
    for (const key of Object.keys(stats) as (keyof BattleStats)[]) stats[key] += bonuses[key] ?? 0;
  }
  for (const key of Object.keys(stats) as (keyof BattleStats)[]) {
    if (!Number.isSafeInteger(stats[key])) throw new Error('Equipment statistic exceeds valid bounds');
    stats[key] = Math.max(0, stats[key]);
  }
  return stats;
}
export function openingHandSize(normal: number, speed: number): number {
  return normal + (speed >= 4 ? 2 : speed >= 2 ? 1 : 0);
}
// Ownership and out-of-combat eligibility belong to campaign commands.
// Preserve resources: increasing the maximum never fills MP.
export function withEquipment(profile: CharacterProfile, equipment: Loadout): CharacterProfile {
  const next = { ...profile, equipment: structuredClone(equipment) };
  return { ...next, mp: Math.min(profile.mp, deriveStats(next).maxMp) };
}
