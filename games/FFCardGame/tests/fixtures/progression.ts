import { campaignTransition, type CampaignState } from '../../client/src/game/campaign';
import { cardAvailability, preview } from '../../client/src/game/combat';
import { nodeById } from '../../client/src/game/dungeon';
import { ROUTE_PREVIEW } from '../../client/src/content/dungeon';

export function battleAction(state:CampaignState):CampaignState {
  const battle=state.battle!;
  if(battle.outcome)return campaignTransition(state,{type:'resolve',revision:state.revision});
  const card=battle.hand.filter(c=>cardAvailability(battle,c).affordable).sort((a,b)=>(preview(battle,b).damage+preview(battle,b).block)-(preview(battle,a).damage+preview(battle,a).block))[0];
  return campaignTransition(state,card?{type:'play',cardId:card.id,battleRevision:battle.revision,revision:state.revision}:{type:'end-turn',battleRevision:battle.revision,revision:state.revision});
}
export function finishRoute(initial:CampaignState):CampaignState {
  let state=initial;
  for(let i=0;i<500&&state.phase!=='route-complete';i++){
    const revision=state.revision;
    if(state.phase==='map')state=campaignTransition(state,{type:'choose-node',nodeId:nodeById(ROUTE_PREVIEW,state.currentNode!)!.next[0],revision});
    else if(state.phase==='battle')state=battleAction(state);
    else if(state.phase==='reward'&&state.pendingReward?.kind!=='checkpoint')state=campaignTransition(state,{type:'choose-reward',claimId:state.pendingReward!.id,card:null,revision});
    else if(state.phase==='destination'){
      const nodeId=state.currentNode!,kind=nodeById(ROUTE_PREVIEW,nodeId)!.kind;
      state=campaignTransition(state,kind==='battle'||kind==='teacher'?{type:'start-encounter',nodeId,revision}:kind==='rest'?{type:'rest',nodeId,revision}:kind==='discovery'?{type:'discover',nodeId,option:'salvage',revision}:{type:'continue-route',nodeId,revision});
    }else throw new Error(`Unexpected route state ${state.phase}`);
  }
  if(state.phase!=='route-complete')throw new Error('Route did not finish');
  return state;
}
