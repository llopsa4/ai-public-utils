import type { EnemyIntent, CardType } from '../game/types';

export const HERO_MAX_HP = 60;
export const ENEMY_MAX_HP = 72;
export const ENERGY_PER_TURN = 3;
export const HAND_SIZE = 5;
export const STARTER_DECK: readonly CardType[] = ['strike', 'strike', 'strike', 'strike', 'guard', 'guard', 'guard', 'piston', 'piston', 'vent', 'shield', 'cycle'];

export const INTENTS: readonly EnemyIntent[] = Object.freeze([
  { name: 'Hammerfall', damage: 8, block: 0 },
  { name: 'Iron Mantle', damage: 4, block: 6 },
  { name: 'Furnace Roar', damage: 14, block: 0 },
]);
