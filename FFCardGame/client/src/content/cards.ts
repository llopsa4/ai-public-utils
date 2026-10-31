import type { CardType, CardDefinition, CardInstance } from '../game/types';

export const CARDS: Readonly<Record<CardType, Readonly<CardDefinition>>> = Object.freeze({
  strike: { name: 'Knuckle Drive', kind: 'Attack', cost: 1, damage: 6, strain: 1, icon: 'strike', text: 'Deal 6 damage. Gain 1 strain.' },
  guard: { name: 'Ceramic Guard', kind: 'Skill', cost: 1, block: 5, icon: 'guard', text: 'Gain 5 block.' },
  piston: { name: 'Piston Strike', kind: 'Attack', cost: 1, damage: 10, strain: 3, icon: 'piston', text: 'Deal 10 damage. Gain 3 strain.' },
  vent: { name: 'Open the Vents', kind: 'Skill', cost: 0, strain: -4, icon: 'vent', text: 'Remove 4 strain.' },
  shield: { name: 'Heat Shield', kind: 'Skill', cost: 1, block: 9, strain: 2, icon: 'shield', text: 'Gain 9 block. Gain 2 strain.' },
  cycle: { name: 'Pressure Cycle', kind: 'Skill', cost: 0, draw: 2, strain: 1, icon: 'cycle', text: 'Draw 2 cards. Gain 1 strain.' },
  pulse: { name: 'Kiln Pulse', kind: 'Attack', cost: 2, mpCost: 4, damage: 16, block: 6, strain: 4, icon: 'pulse', text: 'Deal 16 damage. Gain 6 block. Gain 4 strain.' },
  'measured-drive': { name: 'Measured Drive', kind: 'Attack', cost: 1, damage: 5, icon: 'strike', text: 'Deal 5 damage. No strain.' },
  'fitted-brace': { name: 'Fitted Brace', kind: 'Skill', cost: 1, block: 7, icon: 'guard', text: 'Gain 7 block. No strain.' },
  'ember-hook': { name: 'Ember Hook', kind: 'Attack', cost: 1, damage: 6, hotDamage: 4, strain: 1, icon: 'piston', text: 'Deal 6 damage. While hot, gain 4 more damage in addition to the normal hot bonus. Gain 1 strain.' },
  'return-stroke': { name: 'Return Stroke', kind: 'Skill', cost: 0, draw: 1, strain: -1, icon: 'cycle', text: 'Draw 1 card. Remove 1 strain.' },
  'pressure-return': { name: 'Pressure Return', kind: 'Attack', cost: 1, mpCost: 1, damage: 5, block: 5, strain: -2, icon: 'pulse', text: 'Deal 5 damage. Gain 5 block. Remove 2 strain.' },
});

export const TEMPERED_FLOW: Readonly<CardDefinition> = Object.freeze({
  ...CARDS.pulse, technique: 'Tempered Flow', mpCost: 3, strain: 3,
  text: 'Deal 16 damage. Gain 6 block. Gain 3 strain.',
});

export function cardDefinition(card: Readonly<CardInstance>): Readonly<CardDefinition> {
  if (!Object.hasOwn(CARDS, card.type)) throw new Error('Unknown card definition');
  if (card.upgrade === undefined) return CARDS[card.type];
  if (card.upgrade === 'refined' && card.type !== 'pulse') {
    const base = CARDS[card.type];
    const changed = card.type === 'vent' ? { strain: -6 } : card.type === 'cycle' ? { strain: 0 } : card.type === 'return-stroke' ? { strain: -2 } : {
      ...(base.damage ? { damage: base.damage + 2 } : {}), ...(base.block ? { block: base.block + 2 } : {}),
    };
    const data = { ...base, ...changed, technique: 'Refined' };
    return { ...data, text: `${data.damage ? `Deal ${data.damage} damage. ` : ''}${data.block ? `Gain ${data.block} block. ` : ''}${data.draw ? `Draw ${data.draw}. ` : ''}${data.hotDamage ? `Hot: +${data.hotDamage} extra damage. ` : ''}${(data.strain ?? 0) < 0 ? `Remove ${-data.strain!} strain.` : data.strain ? `Gain ${data.strain} strain.` : 'No strain.'}` };
  }
  if (card.type === 'pulse' && card.upgrade === 'tempered-flow') return TEMPERED_FLOW;
  throw new Error('Invalid card technique');
}

export function cardLabel(card: Readonly<CardInstance>): string {
  const data = cardDefinition(card);
  return data.technique ? `${data.name} (${data.technique})` : data.name;
}
