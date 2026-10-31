// Pure seeded combat rules; independent of React, the DOM, and storage.
import { CARDS, cardDefinition, cardLabel } from '../content/cards';
import { PROTOTYPE_PROFILE, PROTOTYPE_ENCOUNTER } from '../content/encounter';
import { deriveStats, openingHandSize } from './equipment';
import type { BattleState, CardInstance, CardPreview, FighterState, CharacterProfile, EncounterDefinition } from './types';
export { CARDS } from '../content/cards';
export { INTENTS } from '../content/encounter';
import { random } from './random';

export function randomSeed(): number {
  return globalThis.crypto?.getRandomValues(new Uint32Array(1))[0] ?? Date.now() >>> 0;
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
  return createBattle(PROTOTYPE_PROFILE, PROTOTYPE_ENCOUNTER, seed);
}

export function createBattle(profile: CharacterProfile, encounter: EncounterDefinition, seed: number = randomSeed()): BattleState {
  validateSetup(profile, encounter);
  const stats = deriveStats(profile);
  const state: BattleState = { config: structuredClone({
    stats, hero: { id: profile.id, name: profile.name, maxHp: profile.maxHp, maxMp: stats.maxMp }, encounter,
  }), hero: { hp: profile.hp, block: 0 }, enemy: { hp: encounter.enemy.maxHp, block: 0 }, energy: encounter.energyPerTurn, mp: profile.mp, strain: 0,
    turn: 1, intent: 0, revision: 0, outcome: null, rng: seed >>> 0,
    draw: profile.deck.map(card => ({ ...card })), hand: [], discard: [],
    log: [encounter.introduction] };
  shuffle(state, state.draw);
  draw(state, openingHandSize(encounter.handSize, stats.speed));
  return state;
}

function validateSetup(profile: CharacterProfile, encounter: EncounterDefinition): void {
  function integer(name: string, value: number, minimum = 0) {
    if (!Number.isSafeInteger(value) || value < minimum) throw new Error(`Invalid battle setup: ${name}`);
  }
  integer('maximum HP', profile.maxHp, 1);
  integer('HP', profile.hp, 1);
  integer('maximum MP', profile.maxMp);
  integer('MP', profile.mp);
  if (profile.hp > profile.maxHp || profile.mp > deriveStats(profile).maxMp) throw new Error('Invalid battle setup: resources exceed maxima');
  integer('enemy maximum HP', encounter.enemy.maxHp, 1);
  integer('energy per turn', encounter.energyPerTurn);
  integer('hand size', encounter.handSize);
  if (!encounter.enemy.intents.length) throw new Error('Invalid battle setup: empty intentions');
  for (const intent of encounter.enemy.intents) {
    integer('intent damage', intent.damage);
    integer('intent block', intent.block);
  }
  const ids = new Set<string>();
  for (const card of profile.deck) {
    if (!card.id || ids.has(card.id) || !Object.hasOwn(CARDS, card.type)) throw new Error('Invalid battle setup: card identity');
    cardDefinition(card);
    ids.add(card.id);
  }
}

export function currentIntent(state: BattleState) {
  return state.config.encounter.enemy.intents[state.intent];
}
export function preview(state: BattleState, card: CardInstance): CardPreview {
  const data = cardDefinition(card);
  const hot = state.strain >= 6 && state.strain <= 9;
  const stats = state.config.stats;
  const damage = data.damage ? data.damage + stats.power + (hot ? 2 + (data.hotDamage ?? 0) : 0) : 0;
  const strainDelta = (data.strain ?? 0) + (data.kind === 'Attack' ? stats.attackStrain : 0);
  const overload = state.strain + strainDelta >= 10;
  return { damage, block: data.block ? data.block + stats.defense : 0, overload, strainDelta,
    strain: overload ? 4 : Math.max(0, state.strain + strainDelta),
    hpDamage: Math.max(0, damage - state.enemy.block), hot: !!data.damage && hot };
}

export function cardAvailability(state: BattleState, card: CardInstance) {
  const data = cardDefinition(card);
  const energyReason = state.energy < data.cost ? ` Not enough energy: needs ${data.cost}, you have ${state.energy}.` : '';
  const mpReason = state.mp < (data.mpCost ?? 0) ? ` Not enough MP: needs ${data.mpCost}, you have ${state.mp}.` : '';
  const affordable = !energyReason && !mpReason;
  return { energyReason, mpReason, affordable,
    energyAfter: state.energy - (affordable ? data.cost : 0),
    mpAfter: state.mp - (affordable ? data.mpCost ?? 0 : 0) };
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
  if (previous.outcome || previous.support?.required || revision !== previous.revision) return previous;
  const index = previous.hand.findIndex(card => card.id === id);
  if (index < 0 || (previous.practice?.requiredCardId && previous.practice.requiredCardId !== id)) return previous;
  const card = previous.hand[index];
  const data = cardDefinition(card);
  if (!cardAvailability(previous, card).affordable) return previous;
  const next = structuredClone(previous);
  const effect = preview(previous, card);
  next.energy -= data.cost;
  next.mp -= data.mpCost ?? 0;
  // Keep the resolving card out of both piles until its draw effect completes.
  next.hand.splice(index, 1);
  if(next.practice)next.practice.requiredCardId=null;
  if (effect.damage) hit(next.enemy, effect.damage);
  next.hero.block += effect.block;
  const handBeforeDraw = next.hand.length;
  if (data.draw) draw(next, data.draw);
  const drawn = next.hand.length - handBeforeDraw;
  next.strain = effect.strain;
  if (effect.overload) next.hero.hp = Math.max(0, next.hero.hp - 6);
  next.discard.push(card);
  next.revision++;
  log(next, `${cardLabel(card)}:${effect.damage ? ` ${effect.damage} damage${effect.hot ? ' (hot)' : ''}.` : ''}${effect.block ? ` ${effect.block} block.` : ''}${data.draw ? ` Drew ${drawn}.` : ''}${(data.strain ?? 0) < 0 ? ` Vented ${-(data.strain ?? 0)} strain.` : ''}${effect.overload ? ' OVERLOAD: lost 6 HP; strain reset to 4.' : ''}`);
  outcome(next);
  return next;
}
export function endTurn(previous: BattleState, revision = previous.revision): BattleState {
  if (previous.outcome || previous.support?.required || previous.practice?.requiredCardId || revision !== previous.revision) return previous;
  const next = structuredClone(previous);
  next.discard.push(...next.hand.splice(0));
  const intent = currentIntent(next);
  next.enemy.block = intent.block;
  const before = next.hero.hp;
  hit(next.hero, intent.damage);
  log(next, `${intent.name}: ${intent.damage} attack; ${before - next.hero.hp} HP lost.${intent.block ? ` ${next.config.encounter.enemy.label} gains ${intent.block} block.` : ''}`);
  next.revision++;
  outcome(next);
  if (!next.outcome) {
    next.hero.block = 0;
    next.energy = next.config.encounter.energyPerTurn;
    next.turn++;
    next.intent = (next.intent + 1) % next.config.encounter.enemy.intents.length;
    draw(next, next.config.encounter.handSize);
  }
  return next;
}
