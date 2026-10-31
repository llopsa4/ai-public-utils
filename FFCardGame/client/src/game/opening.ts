import type { CampaignState, CampaignCommand } from './campaign';
import type { CharacterProfile } from './types';
import { createBattle } from './combat';
import { PROTOTYPE_PROFILE } from '../content/encounter';
import { OPENING_MAP, openingEncounter } from '../content/opening';
import { attachSupport } from './support';
import { restProfile, rollCards, trainingProfile, victoryProfile } from './rewards';
import { learnTemperedFlow } from './profile';
import { rewardId } from '../content/rewards';
export interface OpeningProgress { complete:boolean; practiceProfile:CharacterProfile|null }

function finish(state:CampaignState,nodeId:string,claimId:string):CampaignState {
  return {...state,phase:'map',pendingReward:null,battle:null,battleStart:null,completedNodes:[...state.completedNodes,nodeId],claimedRewards:[...state.claimedRewards,claimId],revision:state.revision+1,progression:{...state.progression!,battleNode:null}};
}
export function openingTransition(state:CampaignState,command:CampaignCommand):CampaignState|null {
  if(command.type==='start-opening') {
    if(!state.systems||state.systems.opening||state.tutorial?.step!==0||state.systems.scene?.id!=='home'||state.systems.scene.beat!==0||state.systems.effects.length)return state;
    return {...state,systems:{...state.systems,opening:{complete:false,practiceProfile:null}},revision:state.revision+1};
  }
  const opening=state.systems?.opening;
  if(!opening||state.systems!.scene||state.tutorial||state.replay)return null;
  if(command.type==='start-encounter') {
    const entry=openingEncounter(command.nodeId);
    if(state.phase!=='destination'||state.currentNode!==command.nodeId||!entry||command.nodeId==='route-story'||state.completedNodes.includes(command.nodeId))return state;
    const training=command.nodeId==='route-teacher';
    let profile=state.profile;
    if(training){const pulse=profile.deck.find(card=>card.type==='pulse')!;profile=learnTemperedFlow({...PROTOTYPE_PROFILE,deck:profile.deck},pulse.id);}
    let battle=attachSupport(createBattle(profile,entry.encounter,state.rng),state.systems!.allies);
    if(training){
      const pulse=state.profile.deck.find(card=>card.type==='pulse')!;
      if(!battle.hand.some(card=>card.id===pulse.id)){const index=battle.draw.findIndex(card=>card.id===pulse.id);const [drawn]=battle.draw.splice(index,1);const swapped=battle.hand.pop();if(swapped)battle.draw.push(swapped);battle.hand.unshift(drawn);}
      battle={...battle,practice:{requiredCardId:pulse.id}};
    }
    return {...state,phase:'battle',battle,battleStart:structuredClone(battle),revision:state.revision+1,progression:{...state.progression!,battleNode:command.nodeId},systems:{...state.systems!,opening:{...opening,practiceProfile:training?structuredClone(state.profile):null}}};
  }
  if(command.type==='resolve'&&state.phase==='battle'&&state.battle?.outcome==='victory') {
    const nodeId=state.progression!.battleNode!,entry=openingEncounter(nodeId);
    if(!entry||state.completedNodes.includes(nodeId)||state.claimedRewards.includes(rewardId(nodeId)))return state;
    const training=nodeId==='route-teacher',roll=entry.cards?rollCards(state.rng):{cards:[],rng:state.rng};
    return {...state,phase:'reward',profile:training?state.profile:{...state.profile,hp:state.battle.hero.hp,mp:state.battle.mp},rng:roll.rng,revision:state.revision+1,pendingReward:{id:rewardId(nodeId),nodeId,kind:training?'training':'victory',cards:roll.cards,rollSeed:entry.cards?state.rng:null}};
  }
  if(command.type==='choose-reward'&&state.phase==='reward'&&state.pendingReward?.kind!=='checkpoint') {
    const pending=state.pendingReward;if(!pending||pending.id!==command.claimId||state.claimedRewards.includes(pending.id))return state;
    if(pending.kind==='discovery')return null;
    const entry=openingEncounter(pending.nodeId);if(!entry||(command.card!==null&&!pending.cards.includes(command.card)))return state;
    const training=pending.kind==='training',base=opening.practiceProfile;
    if(training&&!base)return state;
    let profile=training?trainingProfile(base!,base!.hp,base!.mp):victoryProfile(state.profile);
    if(command.card)profile={...profile,deck:[...profile.deck,{id:`reward:${pending.id}`,type:command.card}]};
    return finish({...state,profile,salvage:state.salvage+entry.salvage,systems:{...state.systems!,opening:{...opening,practiceProfile:null}}},pending.nodeId,pending.id);
  }
  if(command.type==='rest'&&state.phase==='destination'&&state.currentNode===command.nodeId&&OPENING_MAP.nodes.some(node=>node.id===command.nodeId&&node.kind==='rest')&&!state.completedNodes.includes(command.nodeId))return finish({...state,profile:restProfile(state.profile)},command.nodeId,`${command.nodeId}:rest`);
  if(command.type==='discover'&&command.nodeId==='route-second-discovery'&&command.option==='kit') {
    if(state.phase!=='destination'||state.currentNode!==command.nodeId||state.pendingReward?.kind!=='discovery'||state.systems!.owned.some(item=>item.id==='insulated-kit'))return state;
    return finish({...state,systems:{...state.systems!,owned:[...state.systems!.owned,{id:'insulated-kit'}],stock:state.systems!.stock.filter(id=>id!=='insulated-kit')}},command.nodeId,state.pendingReward.id);
  }
  if(command.type==='continue-route'&&state.currentNode==='route-exit')return state;
  if(command.type==='leave-map'&&opening.complete&&state.phase==='route-complete')return {...state,phase:'complete',currentNode:OPENING_MAP.exit,revision:state.revision+1};
  return null;
}
