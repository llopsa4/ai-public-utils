export type CardArtType = 'strike' | 'guard' | 'piston' | 'vent' | 'shield' | 'cycle' | 'pulse';
export type RewardCardType = 'measured-drive' | 'fitted-brace' | 'ember-hook' | 'return-stroke' | 'pressure-return';
export type CardType = CardArtType | RewardCardType;

export interface CardDefinition {
  readonly name: string;
  readonly kind: 'Attack' | 'Skill';
  readonly cost: number;
  readonly mpCost?: number;
  readonly damage?: number;
  readonly hotDamage?: number;
  readonly strain?: number;
  readonly block?: number;
  readonly draw?: number;
  readonly icon: CardArtType;
  readonly text: string;
  readonly technique?: string;
}

export type CardUpgrade = 'tempered-flow' | 'refined';
export type AllyId = 'iven';
export interface CardInstance { type: CardType; id: string; upgrade?: CardUpgrade }
export interface FighterState { hp: number; block: number }
export interface EnemyIntent { readonly name: string; readonly damage: number; readonly block: number }
export type BattleOutcome = 'victory' | 'defeat' | null;
export type EquipmentSlot = 'gauntlet' | 'armor' | 'utility';
export interface EquippedItem { readonly id: string; readonly upgraded?: boolean }
export type Loadout = Readonly<Record<EquipmentSlot, EquippedItem>>;
export interface BattleStats { power: number; defense: number; speed: number; maxMp: number; attackStrain: number }

// Battle inputs only; campaign progression and save envelopes remain separate.
export interface CharacterProfile {
  readonly id: string;
  readonly name: string;
  readonly maxHp: number;
  readonly hp: number;
  readonly maxMp: number;
  readonly mp: number;
  readonly deck: readonly Readonly<CardInstance>[];
  readonly equipment?: Loadout;
}

export interface EncounterDefinition {
  readonly id: string;
  readonly title: string;
  readonly enemy: {
    readonly name: string;
    readonly label: string;
    readonly maxHp: number;
    readonly intents: readonly Readonly<EnemyIntent>[];
  };
  readonly energyPerTurn: number;
  readonly handSize: number;
  readonly introduction: string;
  readonly victoryText: string;
}

export interface BattleSetup {
  readonly profile: CharacterProfile;
  readonly encounter: EncounterDefinition;
  readonly seed?: number;
}

export interface BattleConfig {
  readonly stats: BattleStats;
  readonly hero: Pick<CharacterProfile, 'id' | 'name' | 'maxHp' | 'maxMp'>;
  readonly encounter: EncounterDefinition;
}

export interface BattleState {
  support?: { present: AllyId[]; spent: AllyId[]; required: AllyId | null };
  readonly config: BattleConfig;
  hero: FighterState;
  enemy: FighterState;
  energy: number;
  mp: number;
  strain: number;
  turn: number;
  intent: number;
  revision: number;
  outcome: BattleOutcome;
  rng: number;
  draw: CardInstance[];
  hand: CardInstance[];
  discard: CardInstance[];
  log: string[];
}

export interface CardPreview {
  strainDelta: number;
  damage: number;
  block: number;
  overload: boolean;
  strain: number;
  hpDamage: number;
  hot: boolean;
}
