import { newCampaign, type CampaignState } from '../../client/src/game/campaign';
import { act } from './systems';
import { LESSON_STEPS } from '../../client/src/content/tutorial';
import { OPENING_MAP } from '../../client/src/content/opening';
import { nodeById } from '../../client/src/game/dungeon';
import { cardAvailability, currentIntent, preview } from '../../client/src/game/combat';
export interface OpeningPolicy { seed:number; itemId:'heavy-gauntlet'|'layered-armor'|'quick-harness'; branches?:number; style?:'aggressive'|'defensive'|'heat-aware' }
export function openingAction(state:CampaignState,policy:OpeningPolicy):CampaignState {
  if(state.systems?.scene)return act(state,{type:'scene-skip'});
  if(state.tutorial){const lesson=state.tutorial;return act(state,{type:'lesson',command:{step:lesson.step,revision:lesson.revision,action:LESSON_STEPS[lesson.step].action}});}
  if(state.phase==='map'){
    const node=nodeById(OPENING_MAP,state.currentNode!)!,choices=node.next;
    const index=choices.length>1?((policy.branches??0) >> (node.row===0?0:node.row===1?1:node.row===5?2:3))&1:0;
    return act(state,{type:'choose-node',nodeId:choices[index]});
  }
  if(state.phase==='destination'){
    const nodeId=state.currentNode!,kind=nodeById(OPENING_MAP,nodeId)!.kind;
    if(kind==='workshop'){
      const owned=state.systems!.owned.some(item=>item.id===policy.itemId),equipped=Object.values(state.profile.equipment!).some(item=>item.id===policy.itemId);
      if(!owned)return act(state,{type:'buy',itemId:policy.itemId});
      if(!equipped)return act(state,{type:'equip',itemId:policy.itemId});
      return act(state,{type:'continue-route',nodeId});
    }
    if(kind==='story')return act(state,{type:'start-bridge'});
    if(kind==='battle'||kind==='teacher')return act(state,{type:'start-encounter',nodeId});
    if(kind==='rest')return act(state,{type:'rest',nodeId});
    if(kind==='discovery')return act(state,{type:'discover',nodeId,option:nodeId==='route-second-discovery'&&!state.systems!.owned.some(item=>item.id==='insulated-kit')?'kit':'salvage'});
  }
  if(state.phase==='reward'){
    const reward=state.pendingReward!;if(reward.kind==='checkpoint')throw Error('Unexpected legacy reward');
    return act(state,{type:'choose-reward',claimId:reward.id,card:reward.cards[policy.seed%reward.cards.length]??null});
  }
  if(state.phase==='battle'){
    const battle=state.battle!;
    if(battle.outcome==='victory')return act(state,{type:'resolve'});
    if(battle.outcome==='defeat')return state;
    if(battle.support?.present.includes('iven')&&!battle.support.spent.includes('iven'))return act(state,{type:'support',ally:'iven',battleRevision:battle.revision});
    if(battle.practice?.requiredCardId)return act(state,{type:'play',cardId:battle.practice.requiredCardId,battleRevision:battle.revision});
    const incoming=Math.max(0,currentIntent(battle).damage-battle.hero.block),style=policy.style??'heat-aware';
    const choice=battle.hand.filter(card=>cardAvailability(battle,card).affordable).map(card=>{
      const data=preview(battle,card),score=data.hpDamage*(style==='aggressive'?1.5:.95)+Math.min(data.block,incoming)*(style==='defensive'?1.9:1.1)+(data.hpDamage>=battle.enemy.hp?1000:0)+(card.type==='cycle'||card.type==='return-stroke'?7:0)-(data.overload?(style==='aggressive'?4:10):0)+(data.hot&&style==='heat-aware'?3:0);
      return {card,score};
    }).sort((a,b)=>b.score-a.score)[0];
    return choice&&choice.score>0?act(state,{type:'play',cardId:choice.card.id,battleRevision:battle.revision}):act(state,{type:'end-turn',battleRevision:battle.revision});
  }
  throw Error(`No opening action for ${state.phase}/${state.currentNode}`);
}
export function openingUntil(predicate:(state:CampaignState)=>boolean,policy:OpeningPolicy,initial=newCampaign(policy.seed,true,true,true)){
  let state=initial;
  for(let i=0;i<900&&!predicate(state);i++){const next=openingAction(state,policy);if(next===state)throw Error(`Opening stopped: ${state.phase}/${state.currentNode}/${state.battle?.outcome}`);state=next;}
  if(!predicate(state))throw Error('Opening action bound exceeded');return state;
}
