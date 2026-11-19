import type { EnemyIntent, CardType, CharacterProfile, EncounterDefinition, BattleSetup } from '../game/types';

export const HERO_MAX_HP = 60;
export const HERO_MAX_MP = 10;
export const ENEMY_MAX_HP = 72;
export const ENERGY_PER_TURN = 3;
export const HAND_SIZE = 5;
export const STARTER_DECK: readonly CardType[] = ['strike', 'strike', 'strike', 'guard', 'guard', 'guard', 'piston', 'piston', 'vent', 'shield', 'cycle', 'pulse'];

export const INTENTS: readonly EnemyIntent[] = Object.freeze([
  { name: 'Hammerfall', damage: 8, block: 0 },
  { name: 'Iron Mantle', damage: 4, block: 6 },
  { name: 'Furnace Roar', damage: 14, block: 0 },
]);

export const PROTOTYPE_PROFILE: CharacterProfile = {
  id: 'mara-prototype', name: 'Mara', maxHp: HERO_MAX_HP, hp: HERO_MAX_HP,
  maxMp: HERO_MAX_MP, mp: HERO_MAX_MP,
  deck: STARTER_DECK.map((type, id) => ({ type, id: `card-${id}` })),
};

export const PROTOTYPE_ENCOUNTER: EncounterDefinition = {
  id: 'hollow-kiln-prototype', title: 'THE KILN HALL',
  enemy: { name: 'The Hollow Kiln', label: 'Guardian', maxHp: ENEMY_MAX_HP, intents: INTENTS },
  energyPerTurn: ENERGY_PER_TURN, handSize: HAND_SIZE,
  introduction: 'The kiln wakes. Deliver yourself from the furnace.',
  victoryText: 'The Hollow Kiln exhales one last ribbon of smoke. Beyond its cooling shell, the road is yours again.',
};

export const PROTOTYPE_SETUP: BattleSetup = { profile: PROTOTYPE_PROFILE, encounter: PROTOTYPE_ENCOUNTER };
