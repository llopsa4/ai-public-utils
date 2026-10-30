import type { BattleState } from '../client/src/game/types';
// Reproducible balance smoke test, not a substitute for human pacing playtests.
import { newBattle, CARDS, INTENTS, preview, playCard, endTurn } from '../client/src/game/combat.ts';

function choose(state: BattleState, style: string) {
  const incoming = INTENTS[state.intent].damage;
  return state.hand.map(card => {
    const data = CARDS[card.type], effect = preview(state, card);
    if (data.cost > state.energy) return { card, score: -Infinity };
    const prevented = Math.min(effect.block, Math.max(0, incoming - state.hero.block));
    let score = effect.hpDamage * (style === 'aggressive' ? 1.5 : .95) + prevented * (style === 'defensive' ? 1.9 : 1.1);
    if (effect.hpDamage >= state.enemy.hp) score += 1000;
    if (data.draw) score += 7;
    if (effect.overload) score -= style === 'aggressive' ? 4 : 10;
    if ((data.strain ?? 0) < 0) score += state.strain >= 7 ? 3 : -4;
    if (effect.strain >= 6 && !effect.overload) score += style === 'heat-aware' ? 3 : 0;
    return { card, score };
  }).sort((a, b) => b.score - a.score)[0];
}
for (const style of ['aggressive', 'defensive', 'heat-aware']) {
  const results: { won: boolean; turns: number; hp: number; hotAttacks: number; overloads: number; blocked: number }[] = [];
  for (let seed = 1; seed <= 100; seed++) {
    let state = newBattle(seed), hotAttacks = 0, overloads = 0, blocked = 0;
    for (let action = 0; action < 200 && !state.outcome; action++) {
      const choice = choose(state, style);
      if (choice && choice.score > 0) {
        const effect = preview(state, choice.card);
        hotAttacks += Number(effect.hot);
        overloads += Number(effect.overload);
        state = playCard(state, choice.card.id);
      } else {
        blocked += Math.min(INTENTS[state.intent].damage, state.hero.block);
        state = endTurn(state);
      }
    }
    results.push({ won: state.outcome === 'victory', turns: state.turn, hp: state.hero.hp, hotAttacks, overloads, blocked });
  }
  const avg = (key: 'turns' | 'hp' | 'hotAttacks' | 'overloads' | 'blocked') => +(results.reduce((sum, r) => sum + r[key], 0) / results.length).toFixed(2);
  console.log(JSON.stringify({ style, battles: results.length, wins: results.filter(r => r.won).length, meanTurns: avg('turns'), meanHP: avg('hp'), meanHotAttacks: avg('hotAttacks'), meanOverloads: avg('overloads'), meanBlockedDamage: avg('blocked') }));
}
