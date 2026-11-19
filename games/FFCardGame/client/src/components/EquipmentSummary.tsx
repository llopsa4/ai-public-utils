import type { BattleState } from '../game/types';
import { openingHandSize } from '../game/equipment';

export function EquipmentSummary({ state }: { state: BattleState }) {
  const stats = state.config.stats;
  if (!stats.power && !stats.defense && !stats.speed && !stats.attackStrain) return null;
  return <aside className="equipment-summary" aria-label="Equipment effects">
    <span>Power +{stats.power}</span><span>Defense +{stats.defense}</span>
    <span>Speed {stats.speed} · opening hand {openingHandSize(state.config.encounter.handSize, stats.speed)}</span>
    {!!stats.attackStrain && <span>Attacks: +{stats.attackStrain} extra strain</span>}
  </aside>;
}
