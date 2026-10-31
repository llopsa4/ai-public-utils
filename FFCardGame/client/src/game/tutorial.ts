import { LESSON_DECK, LESSON_ENCOUNTER, LESSON_PROFILE, LESSON_STEPS, type LessonAction } from '../content/tutorial';
import { createBattle, draw, endTurn, playCard } from './combat';
import type { BattleState } from './types';

export interface TutorialState { step: number; revision: number; battle: BattleState; battleStart: BattleState }
export interface TutorialCommand { step: number; revision: number; action: LessonAction }
export function newTutorial(): TutorialState {
  const battle = createBattle(LESSON_PROFILE, LESSON_ENCOUNTER, 101);
  // Teaching-only explicit first-drawn order. The same twelve cards and real
  // draw/reshuffle rules are retained; ordinary battle creation is unchanged.
  battle.rng = 101;
  battle.draw = LESSON_DECK.map(card => ({ ...card })).reverse();
  battle.hand = [];
  draw(battle, 5);
  return { step: 0, revision: 0, battle, battleStart: structuredClone(battle) };
}
function sameAction(a: LessonAction, b: LessonAction): boolean {
  return a.type === b.type && (a.type === 'play' ? b.type === 'play' && a.id === b.id
    : a.type === 'open' || a.type === 'close' ? (b.type === 'open' || b.type === 'close') && a.dialog === b.dialog : true);
}
function advance(state: TutorialState): TutorialState {
  const action = LESSON_STEPS[state.step].action;
  const battle = action.type === 'play' ? playCard(state.battle, action.id)
    : action.type === 'end-turn' ? endTurn(state.battle) : state.battle;
  return { ...state, step: state.step + 1, revision: state.revision + 1, battle };
}
// A finite, reproducible trace also validates saves: a step can never claim to
// be ahead of its actual resources, modal or deck state.
export function tutorialAtStep(step: number): TutorialState {
  if (!Number.isInteger(step) || step < 0 || step > LESSON_STEPS.length) throw new Error('Invalid lesson step');
  let state = newTutorial();
  while (state.step < step) state = advance(state);
  return state;
}
export function tutorialMatches(state: TutorialState): boolean {
  try {
    const expected = tutorialAtStep(state.step);
    return Number.isSafeInteger(state.revision) && state.revision >= state.step
      && stable(state.battle) === stable(expected.battle)
      && stable(state.battleStart) === stable(expected.battleStart);
  } catch { return false; }
}
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function tutorialTransition(previous: TutorialState, command: TutorialCommand): TutorialState {
  const expected = LESSON_STEPS[previous.step];
  if (!expected || command.step !== previous.step || command.revision !== previous.revision
      || !sameAction(expected.action, command.action) || !tutorialMatches(previous)) return previous;
  const next = advance(previous);
  if ((expected.action.type === 'play' || expected.action.type === 'end-turn') && next.battle === previous.battle) return previous;
  return next;
}
export function resetTutorial(previous: TutorialState): TutorialState {
  return { ...newTutorial(), revision: previous.revision + 1 };
}
