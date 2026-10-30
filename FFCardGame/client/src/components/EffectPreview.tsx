import { cardDefinition } from '../content/cards';
import { preview, cardAvailability } from '../game/combat';
import type { BattleState, CardInstance } from '../game/types';

export function EffectPreview({ state, card, busy }: { state: BattleState; card: CardInstance | null; busy: boolean }) {
  const active = !busy && !state.outcome && card && state.hand.some(item => item.id === card.id) ? card : null;
  const effect = active ? preview(state, active) : null;
  const parts: string[] = [];
  if (active && effect) {
    const data = cardDefinition(active);
    const available = cardAvailability(state, active);
    if (available.energyReason) parts.push(available.energyReason.trim());
    if (available.mpReason) parts.push(available.mpReason.trim());
    if (effect.damage) parts.push(`${effect.damage} damage${effect.hot ? ' (+2 hot bonus)' : ''} → ${effect.hpDamage} HP after block.`);
    if (effect.block) parts.push(`Gain ${effect.block} block.`);
    if (data.draw) parts.push(`Draw ${data.draw} cards.`);
    if (data.mpCost) parts.push(available.affordable ? `MP ${state.mp} → ${available.mpAfter}.` : `MP stays at ${state.mp} until this card can be played.`);
    parts.push(`Strain ${state.strain} → ${effect.strain}.`);
    if (effect.overload) parts.push('OVERLOAD: lose 6 HP, ignoring block.');
  }
  return <div className={`effect-preview${effect?.overload ? ' danger' : ''}`} id="effect-preview" aria-live="polite">{parts.length ? parts.join(' ') : state.outcome ? 'The furnace falls silent. Your battle is over.' : state.energy === 0 ? 'No energy left. Play a zero-cost card, or end your turn.' : 'Hover or focus a card to inspect its effect.'}</div>;
}
