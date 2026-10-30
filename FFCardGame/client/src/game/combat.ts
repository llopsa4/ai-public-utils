// Pure seeded combat rules; independent of React, the DOM, and storage.
import { CARDS } from '../content/cards';
import { INTENTS, HERO_MAX_HP, ENEMY_MAX_HP, ENERGY_PER_TURN, HAND_SIZE, STARTER_DECK } from '../content/encounter';
import type { BattleState, CardInstance, CardPreview, FighterState } from './types';
export { CARDS } from '../content/cards';
export { INTENTS } from '../content/encounter';

export function randomSeed(): number {
  return globalThis.crypto?.getRandomValues(new Uint32Array(1))[0] ?? Date.now() >>> 0;
}
function random(state: BattleState): number {
  state.rng = (state.rng + 0x6d2b79f5) >>> 0;
  let t = state.rng;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
function shuffle(state: BattleState, cards: CardInstance[]): void {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random(state) * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
}
export function draw(state: BattleState, amount: number): void {
  for (let i = 0; i < amount; i++) {
    if (!state.draw.length) {
      if (!state.discard.length) break;
      state.draw = state.discard.splice(0);
      shuffle(state, state.draw);
    }
    state.hand.push(state.draw.pop()!);
  }
}
export function newBattle(seed: number = randomSeed()): BattleState {
  const types = STARTER_DECK;
  const state: BattleState = { hero: { hp: HERO_MAX_HP, block: 0 }, enemy: { hp: ENEMY_MAX_HP, block: 0 }, energy: ENERGY_PER_TURN, strain: 0,
    turn: 1, intent: 0, revision: 0, outcome: null, rng: seed >>> 0,
    draw: types.map((type, id) => ({ type, id: `card-${id}` })), hand: [], discard: [],
    log: ['The kiln wakes. Deliver yourself from the furnace.'] };
  shuffle(state, state.draw);
  draw(state, HAND_SIZE);
  return state;
}
export function preview(state: BattleState, card: CardInstance): CardPreview {
  const data = CARDS[card.type];
  const hot = state.strain >= 6 && state.strain <= 9;
  const damage = data.damage ? data.damage + (hot ? 2 : 0) : 0;
  const overload = state.strain + (data.strain ?? 0) >= 10;
  return { damage, block: data.block ?? 0, overload,
    strain: overload ? 4 : Math.max(0, state.strain + (data.strain ?? 0)),
    hpDamage: Math.max(0, damage - state.enemy.block), hot: !!data.damage && hot };
}
function hit(target: FighterState, damage: number): void {
  const absorbed = Math.min(target.block, damage);
  target.block -= absorbed;
  target.hp = Math.max(0, target.hp - damage + absorbed);
}
function outcome(state: BattleState): void {
  state.outcome = state.hero.hp <= 0 ? 'defeat' : state.enemy.hp <= 0 ? 'victory' : null;
}
function log(state: BattleState, message: string): void {
  state.log.push(message);
  state.log = state.log.slice(-30);
}
export function playCard(previous: BattleState, id: string, revision = previous.revision): BattleState {
  if (previous.outcome || revision !== previous.revision) return previous;
  const index = previous.hand.findIndex(card => card.id === id);
  if (index < 0) return previous;
  const card = previous.hand[index];
  const data = CARDS[card.type];
  if (previous.energy < data.cost) return previous;
  const next = structuredClone(previous);
  const effect = preview(previous, card);
  next.energy -= data.cost;
  // Keep the resolving card out of both piles until its draw effect completes.
  next.hand.splice(index, 1);
  if (effect.damage) hit(next.enemy, effect.damage);
  next.hero.block += effect.block;
  const handBeforeDraw = next.hand.length;
  if (data.draw) draw(next, data.draw);
  const drawn = next.hand.length - handBeforeDraw;
  next.strain = effect.strain;
  if (effect.overload) next.hero.hp = Math.max(0, next.hero.hp - 6);
  next.discard.push(card);
  next.revision++;
  log(next, `${data.name}:${effect.damage ? ` ${effect.damage} damage${effect.hot ? ' (hot)' : ''}.` : ''}${effect.block ? ` ${effect.block} block.` : ''}${data.draw ? ` Drew ${drawn}.` : ''}${(data.strain ?? 0) < 0 ? ' Vented 4 strain.' : ''}${effect.overload ? ' OVERLOAD: lost 6 HP; strain reset to 4.' : ''}`);
  outcome(next);
  return next;
}
export function endTurn(previous: BattleState, revision = previous.revision): BattleState {
  if (previous.outcome || revision !== previous.revision) return previous;
  const next = structuredClone(previous);
  next.discard.push(...next.hand.splice(0));
  next.strain = Math.max(0, next.strain - 3);
  const intent = INTENTS[next.intent];
  next.enemy.block = intent.block;
  const before = next.hero.hp;
  hit(next.hero, intent.damage);
  log(next, `${intent.name}: ${intent.damage} attack; ${before - next.hero.hp} HP lost.${intent.block ? ` Guardian gains ${intent.block} block.` : ''}`);
  next.revision++;
  outcome(next);
  if (!next.outcome) {
    next.hero.block = 0;
    next.energy = ENERGY_PER_TURN;
    next.turn++;
    next.intent = (next.intent + 1) % INTENTS.length;
    draw(next, HAND_SIZE);
  }
  return next;
}
