import type { BattleState, CharacterProfile } from '../client/src/game/types';
// Reproducible balance smoke test, not a substitute for human pacing playtests.
import { createBattle, currentIntent, preview, playCard, endTurn } from '../client/src/game/combat.ts';
import { cardDefinition } from '../client/src/content/cards';
import { PROTOTYPE_PROFILE, PROTOTYPE_ENCOUNTER } from '../client/src/content/encounter';
import { learnTemperedFlow } from '../client/src/game/profile';
import { withEquipment } from '../client/src/game/equipment';
import { EQUIPMENT, STARTING_EQUIPMENT } from '../client/src/content/equipment';
import { LESSON_STEPS } from '../client/src/content/tutorial';
import { newTutorial, tutorialTransition } from '../client/src/game/tutorial';
import { campaignTransition, newCampaign, type CampaignState } from '../client/src/game/campaign';
import { ROUTE_PREVIEW } from '../client/src/content/dungeon';
import { nodeById } from '../client/src/game/dungeon';
import { encodeSave, decodeSave } from '../client/src/persistence/campaign';
import { BRIDGE_ENCOUNTER } from '../client/src/content/bridge';
import { attachSupport, useSupport } from '../client/src/game/support';

// Run the authored opening matrix after the retained subsystem baselines below.

function choose(state: BattleState, style: string) {
  const incoming = currentIntent(state).damage;
  return state.hand.map(card => {
    const data = cardDefinition(card), effect = preview(state, card);
    if (data.cost > state.energy || (data.mpCost ?? 0) > state.mp) return { card, score: -Infinity };
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
function simulate(profile: CharacterProfile, style: string) {
    const results: { won: boolean; turns: number; hp: number; hotAttacks: number; overloads: number; blocked: number }[] = [];
    for (let seed = 1; seed <= 100; seed++) {
      let state = createBattle(profile, PROTOTYPE_ENCOUNTER, seed), hotAttacks = 0, overloads = 0, blocked = 0;
      for (let action = 0; action < 200 && !state.outcome; action++) {
        const choice = choose(state, style);
        if (choice && choice.score > 0) {
          const effect = preview(state, choice.card);
          hotAttacks += Number(effect.hot);
          overloads += Number(effect.overload);
          state = playCard(state, choice.card.id);
        } else {
          blocked += Math.min(currentIntent(state).damage, state.hero.block);
          state = endTurn(state);
        }
      }
      results.push({ won: state.outcome === 'victory', turns: state.turn, hp: state.hero.hp, hotAttacks, overloads, blocked });
    }
    const avg = (key: 'turns' | 'hp' | 'hotAttacks' | 'overloads' | 'blocked') => +(results.reduce((sum, r) => sum + r[key], 0) / results.length).toFixed(2);
    return { battles: results.length, wins: results.filter(r => r.won).length, meanTurns: avg('turns'), meanHP: avg('hp'), meanHotAttacks: avg('hotAttacks'), meanOverloads: avg('overloads'), meanBlockedDamage: avg('blocked') };
}
for (const technique of ['base', 'tempered-flow']) {
  const profile = technique === 'base' ? PROTOTYPE_PROFILE : learnTemperedFlow(PROTOTYPE_PROFILE, PROTOTYPE_PROFILE.deck.find(c => c.type === 'pulse')!.id);
  for (const style of ['aggressive', 'defensive', 'heat-aware']) {
    console.log(JSON.stringify({ technique, style, ...simulate(profile, style) }));
  }
}
for (const [id, item] of Object.entries(EQUIPMENT)) {
  if (!item.upgradedBonuses) continue;
  const profile = withEquipment(PROTOTYPE_PROFILE, { ...STARTING_EQUIPMENT, [item.slot]: { id } });
  console.log(JSON.stringify({ equipment: id, style: 'heat-aware', ...simulate(profile, 'heat-aware') }));
}
let teaching = newTutorial();
for (const step of LESSON_STEPS) teaching = tutorialTransition(teaching, { step: teaching.step, revision: teaching.revision, action: step.action });
if (teaching.battle.outcome !== 'victory' || teaching.battle.hero.hp !== 60 || teaching.battle.turn !== 3) throw new Error('Teaching battle no longer follows its safe trace');
console.log(JSON.stringify({ encounter: 'guided-sweeper', outcome: teaching.battle.outcome, turns: teaching.battle.turn, hp: teaching.battle.hero.hp, mp: teaching.battle.mp, strain: teaching.battle.strain, steps: teaching.step }));

// Exercise both route battles, recovery alternatives, all reward additions, the
// training milestone and the final checkpoint with the growing story deck.
for (const style of ['aggressive', 'defensive', 'heat-aware']) {
  let wins = 0, hp = 0, turns = 0;
  for (let seed = 1; seed <= 100; seed++) {
    let state: CampaignState = newCampaign(seed);
    for (const step of LESSON_STEPS) state = campaignTransition(state, { type: 'lesson', revision: state.revision, command: { step: state.tutorial!.step, revision: state.tutorial!.revision, action: step.action } });
    for (let action = 0; action < 500 && state.phase !== 'complete'; action++) {
      const revision = state.revision;
      if (state.phase === 'map') {
        const options = nodeById(ROUTE_PREVIEW, state.currentNode!)!.next;
        state = campaignTransition(state, { type: 'choose-node', nodeId: options[seed % options.length], revision });
      } else if (state.phase === 'destination') {
        const nodeId = state.currentNode!, kind = nodeById(ROUTE_PREVIEW, nodeId)!.kind;
        state = campaignTransition(state, kind === 'battle' || kind === 'teacher' ? { type: 'start-encounter', nodeId, revision } : kind === 'rest' ? { type: 'rest', nodeId, revision } : kind === 'discovery' ? { type: 'discover', nodeId, option: nodeId === 'route-discovery' ? 'cards' : 'mp', revision } : { type: 'continue-route', nodeId, revision });
      } else if (state.phase === 'route-complete') state = campaignTransition(state, { type: 'leave-map', revision });
      else if (state.phase === 'ready') state = campaignTransition(state, { type: 'enter', nodeId: 'kiln-checkpoint', revision });
      else if (state.phase === 'reward') {
        const reward = state.pendingReward!;
        if (reward.kind === 'checkpoint') throw Error('Unexpected legacy reward');
        state = campaignTransition(state, { type: 'choose-reward', claimId: reward.id, card: reward.cards[seed % reward.cards.length] ?? null, revision });
        state = decodeSave(encodeSave(state)).state;
      } else if (state.phase === 'battle') {
        const battle = state.battle!;
        if (battle.outcome === 'defeat') break;
        if (battle.outcome === 'victory') { turns += battle.turn; state = campaignTransition(state, { type: 'resolve', revision }); }
        else {
          const choice = choose(battle, style);
          state = campaignTransition(state, choice && choice.score > 0 ? { type: 'play', cardId: choice.card.id, battleRevision: battle.revision, revision } : { type: 'end-turn', battleRevision: battle.revision, revision });
        }
      } else throw Error(`Unexpected progression phase: ${state.phase}`);
    }
    if (state.phase === 'complete') { wins++; hp += state.profile.hp; }
    if (state.profile.maxHp !== 66 || state.profile.maxMp !== 12) throw Error('Training growth missing');
  }
  console.log(JSON.stringify({ scenario: 'growing-story-route', style, routes: 100, wins, meanTotalBattleTurns: turns / 100, meanWinningHP: wins ? +(hp / wins).toFixed(2) : 0 }));
  if (wins < 90) throw Error('Story route regression: fewer than 90/100 wins');
}

for (const equipment of ['heavy-gauntlet','layered-armor','quick-harness']) {
  const item=EQUIPMENT[equipment];
  const base=withEquipment(PROTOTYPE_PROFILE,{...STARTING_EQUIPMENT,[item.slot]:{id:equipment,upgraded:true}});
  const profile={...base,deck:base.deck.map(card=>card.type==='pulse'?{...card,upgrade:'tempered-flow' as const}:{...card,upgrade:'refined' as const})};
  console.log(JSON.stringify({scenario:'refined-deck-and-upgraded-gear',equipment,...simulate(profile,'heat-aware')}));
}
for (const style of ['aggressive','defensive','heat-aware']) {
  for(const supported of [false,true]) {
    let wins=0,totalHP=0,totalTurns=0;
    const profile=learnTemperedFlow({...PROTOTYPE_PROFILE,maxHp:66,hp:66,maxMp:12,mp:12},PROTOTYPE_PROFILE.deck.find(card=>card.type==='pulse')!.id);
    for(let seed=1;seed<=100;seed++) {
      let state=createBattle(profile,BRIDGE_ENCOUNTER,seed);
      if(supported)state=useSupport(attachSupport(state,['iven'],'iven'),'iven');
      for(let action=0;action<200&&!state.outcome;action++){
        const choice=choose(state,style);state=choice&&choice.score>0?playCard(state,choice.card.id):endTurn(state);
      }
      wins+=Number(state.outcome==='victory');totalHP+=state.hero.hp;totalTurns+=state.turn;
    }
    console.log(JSON.stringify({scenario:'bridge-support-comparison',style,supported,battles:100,wins,meanHP:totalHP/100,meanTurns:totalTurns/100}));
    if(wins<90)throw Error('Bridge survivability regression');
  }
}

for (const itemId of ['heavy-gauntlet','layered-armor','quick-harness']) {
  let wins=0,totalHP=0;
  for(let seed=1;seed<=100;seed++) {
    let state=newCampaign(seed,true,true);
    for(let action=0;action<650&&state.phase!=='complete';action++) {
      const revision=state.revision;
      if(state.systems!.scene)state=campaignTransition(state,{type:'scene-skip',revision});
      else if(state.tutorial){const lesson=state.tutorial;state=campaignTransition(state,{type:'lesson',revision,command:{step:lesson.step,revision:lesson.revision,action:LESSON_STEPS[lesson.step].action}});}
      else if(state.phase==='map') {
        const options=nodeById(ROUTE_PREVIEW,state.currentNode!)!.next;
        const nodeId=options.includes('route-discovery')?'route-discovery':options.includes('route-workshop')?'route-workshop':options[seed%options.length];
        state=campaignTransition(state,{type:'choose-node',nodeId,revision});
      } else if(state.phase==='destination') {
        const nodeId=state.currentNode!,kind=nodeById(ROUTE_PREVIEW,nodeId)!.kind;
        if(kind==='workshop') {
          const owned=state.systems!.owned.find(item=>item.id===itemId),equipped=Object.values(state.profile.equipment!).some(item=>item.id===itemId);
          state=campaignTransition(state,!owned?{type:'buy',itemId,revision}:!equipped?{type:'equip',itemId,revision}:{type:'continue-route',nodeId,revision});
        } else state=campaignTransition(state,kind==='battle'||kind==='teacher'?{type:'start-encounter',nodeId,revision}:kind==='story'?{type:'start-bridge',revision}:kind==='discovery'?{type:'discover',nodeId,option:'salvage',revision}:kind==='rest'?{type:'rest',nodeId,revision}:{type:'continue-route',nodeId,revision});
      } else if(state.phase==='battle') {
        const battle=state.battle!;
        if(battle.outcome==='defeat')break;
        if(battle.outcome==='victory')state=campaignTransition(state,{type:'resolve',revision});
        else if(battle.support?.present.includes('iven')&&!battle.support.spent.includes('iven'))state=campaignTransition(state,{type:'support',ally:'iven',battleRevision:battle.revision,revision});
        else {const card=choose(battle,'heat-aware');state=campaignTransition(state,card&&card.score>0?{type:'play',cardId:card.card.id,battleRevision:battle.revision,revision}:{type:'end-turn',battleRevision:battle.revision,revision});}
      } else if(state.phase==='reward') {
        const reward=state.pendingReward!;if(reward.kind==='checkpoint')throw Error('Legacy expanded reward');
        state=campaignTransition(state,{type:'choose-reward',claimId:reward.id,card:reward.cards[seed%reward.cards.length]??null,revision});
        state=decodeSave(encodeSave(state)).state;
      } else if(state.phase==='route-complete')state=campaignTransition(state,{type:'leave-map',revision});
      else if(state.phase==='ready')state=campaignTransition(state,{type:'enter',nodeId:'kiln-checkpoint',revision});
      else throw Error('Unexpected expanded route state');
    }
    if(state.phase==='complete'){wins++;totalHP+=state.profile.hp;}
    if(!state.systems!.owned.some(item=>item.id===itemId)||!state.systems!.effects.includes('partnership'))throw Error('Expanded route missed its investments or partnership');
  }
  console.log(JSON.stringify({scenario:'workshop-scenes-and-support-route',itemId,routes:100,wins,meanWinningHP:wins?+(totalHP/wins).toFixed(2):0}));
  if(wins<90)throw Error('Expanded route survivability regression');
}

await import('./opening-playtest');
