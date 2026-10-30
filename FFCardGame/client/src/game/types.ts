export type CardType = 'strike' | 'guard' | 'piston' | 'vent' | 'shield' | 'cycle';

export interface CardDefinition {
  readonly name: string;
  readonly kind: 'Attack' | 'Skill';
  readonly cost: number;
  readonly damage?: number;
  readonly strain?: number;
  readonly block?: number;
  readonly draw?: number;
  readonly icon: CardType;
  readonly text: string;
}

export interface CardInstance { type: CardType; id: string }
export interface FighterState { hp: number; block: number }
export interface EnemyIntent { readonly name: string; readonly damage: number; readonly block: number }
export type BattleOutcome = 'victory' | 'defeat' | null;

export interface BattleState {
  hero: FighterState;
  enemy: FighterState;
  energy: number;
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
  damage: number;
  block: number;
  overload: boolean;
  strain: number;
  hpDamage: number;
  hot: boolean;
}
