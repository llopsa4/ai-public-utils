import type { CardType, CardDefinition } from '../game/types';

export const CARDS: Readonly<Record<CardType, Readonly<CardDefinition>>> = Object.freeze({
  strike: { name: 'Knuckle Drive', kind: 'Attack', cost: 1, damage: 6, strain: 1, icon: 'strike', text: 'Deal 6 damage. Gain 1 strain.' },
  guard: { name: 'Ceramic Guard', kind: 'Skill', cost: 1, block: 5, icon: 'guard', text: 'Gain 5 block.' },
  piston: { name: 'Piston Strike', kind: 'Attack', cost: 1, damage: 10, strain: 3, icon: 'piston', text: 'Deal 10 damage. Gain 3 strain.' },
  vent: { name: 'Open the Vents', kind: 'Skill', cost: 0, strain: -4, icon: 'vent', text: 'Remove 4 strain.' },
  shield: { name: 'Heat Shield', kind: 'Skill', cost: 1, block: 9, strain: 2, icon: 'shield', text: 'Gain 9 block. Gain 2 strain.' },
  cycle: { name: 'Pressure Cycle', kind: 'Skill', cost: 0, draw: 2, strain: 1, icon: 'cycle', text: 'Draw 2 cards. Gain 1 strain.' },
});
