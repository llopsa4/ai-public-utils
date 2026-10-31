import type { AllyId, BattleState } from './types';

export function attachSupport(battle: BattleState, present: readonly AllyId[], required: AllyId | null = null): BattleState {
  if (!present.length) return battle;
  return { ...battle, support: { present: [...present], spent: [], required } };
}
export function useSupport(previous: BattleState, ally: AllyId, revision = previous.revision): BattleState {
  const support = previous.support;
  if (previous.outcome || revision !== previous.revision || !support?.present.includes(ally) || support.spent.includes(ally)) return previous;
  return { ...previous, revision: previous.revision + 1, hero: { ...previous.hero, block: previous.hero.block + 8 },
    support: { ...support, spent: [...support.spent, ally], required: null }, log: [...previous.log, 'Iven braces: 8 block. Support spent for this battle.'].slice(-30) };
}
