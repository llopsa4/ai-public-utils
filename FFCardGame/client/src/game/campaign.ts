import { campaignMap } from '../content/opening';
import { openingTransition } from './opening';
import { systemsTransition, systemsEvents, type SystemsState } from './systems';
import type { SceneId } from '../content/scenes';
import type { AllyId } from './types';
import { CAMPAIGN_ENCOUNTER, CAMPAIGN_PROFILE, CHECKPOINT_CLAIM, CHECKPOINT_NODE } from '../content/campaign';
import { createBattle, endTurn, playCard } from './combat';
import type { BattleState, CharacterProfile, RewardCardType } from './types';
import { ROUTE_ENCOUNTERS, rewardId } from '../content/rewards';
import { restProfile, rollCards, trainingProfile, victoryProfile } from './rewards';
import { LESSON_CLAIM, LESSON_NODE, LESSON_STEPS } from '../content/tutorial';
import { newTutorial, resetTutorial, tutorialTransition, type TutorialCommand, type TutorialState } from './tutorial';
import { ROUTE_PREVIEW } from '../content/dungeon';
import { nodeById, type DungeonProgress } from './dungeon';

export type PendingReward = { id: string; nodeId: string; kind: 'checkpoint' } | { id:string;nodeId:string;kind:'victory'|'training'|'discovery';cards:RewardCardType[];rollSeed:number|null };
export interface Progression { baseline:Omit<CampaignState,'progression'|'systems'>;commands:CampaignCommand[];battleNode:string|null }
export interface CampaignState {
  systems: SystemsState | null;
  mode: 'story';
  chapter: 'systems-preview';
  phase: 'tutorial' | 'ready' | 'battle' | 'reward' | 'complete' | 'map' | 'destination' | 'route-complete';
  dungeon: DungeonProgress | null;
  tutorial: TutorialState | null;
  replay: TutorialState | null;
  guidedComplete: boolean;
  salvage: number;
  revision: number;
  rng: number;
  profile: CharacterProfile;
  currentNode: string | null;
  completedNodes: string[];
  routeDecisions: string[];
  claimedRewards: string[];
  pendingReward: PendingReward | null;
  progression: Progression | null;
  battle: BattleState | null;
  battleStart: BattleState | null;
}
export type CampaignCommand = { revision: number } & (
  { type: 'start-opening' } | { type: 'enable-systems' } | { type: 'buy' | 'upgrade-item' | 'equip'; itemId: string } |
  { type: 'refine-card' | 'remove-card'; cardId: string } | { type: 'scene-next' | 'scene-skip' } |
  { type: 'replay-scene'; sceneId: SceneId } | { type: 'start-bridge' } | { type: 'support'; ally: AllyId; battleRevision: number } |
  { type: 'enter'; nodeId: string } |
  { type: 'play'; cardId: string; battleRevision: number } |
  { type: 'end-turn'; battleRevision: number } |
  { type: 'retry' } | { type: 'resolve' } | { type: 'claim'; claimId: string } |
  { type: 'lesson'; command: TutorialCommand } | { type: 'start-replay' } | { type: 'reset-lesson' } | { type: 'skip-lesson' } |
  { type: 'open-map' } | { type: 'choose-node'; nodeId: string } | { type: 'continue-route'; nodeId: string } | { type: 'leave-map' } |
  { type:'enable-progression' } | { type:'start-encounter';nodeId:string } | { type:'rest';nodeId:string } |
  { type:'discover';nodeId:string;option:'salvage'|'cards'|'mp'|'kit' } | { type:'choose-reward';claimId:string;card:RewardCardType|null }
);
export function newCampaign(seed: number, guided = true, expanded = false, opening = false): CampaignState {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Invalid campaign seed');
  const state:CampaignState = { systems:null, mode: 'story', chapter: 'systems-preview', phase: guided ? 'tutorial' : 'ready', tutorial: guided ? newTutorial() : null,
    replay: null, guidedComplete: false, salvage: 0, dungeon: null, revision: 0, rng: seed,
    profile: structuredClone(CAMPAIGN_PROFILE), currentNode: null, completedNodes: [], routeDecisions: [],
    claimedRewards: [], pendingReward: null, progression:null, battle: null, battleStart: null };
  const enabled=guided?enableProgression(state):state;
  const active=expanded?activateSystems(enabled):enabled;
  return opening?campaignTransition(active,{type:'start-opening',revision:active.revision}):active;
}
export function campaignTransition(previous: CampaignState, command: CampaignCommand): CampaignState {
  const next=systemsEvents(previous,transition(previous,command),command);
  return next!==previous&&previous.progression?{...next,progression:{...next.progression!,commands:[...previous.progression.commands,structuredClone(command)]}}:next;
}
export function enableProgression(previous:CampaignState):CampaignState {
  if(previous.progression)return previous;
  const {progression:_progression,systems:_systems,...baseline}=structuredClone(previous);
  const enabled:CampaignState={...previous,progression:{baseline,commands:[],battleNode:previous.phase==='battle'?CHECKPOINT_NODE:null}};
  if(previous.phase==='destination'&&previous.currentNode&&!previous.pendingReward&&nodeById(ROUTE_PREVIEW,previous.currentNode)?.kind==='discovery'){
    const nodeId=previous.currentNode,roll=nodeId==='route-discovery'?rollCards(previous.rng):{cards:[],rng:previous.rng};
    return {...enabled,rng:roll.rng,pendingReward:{id:rewardId(nodeId),nodeId,kind:'discovery',cards:roll.cards,rollSeed:nodeId==='route-discovery'?previous.rng:null}};
  }
  return enabled;
}
export function replayProgression(baseline:Omit<CampaignState,'progression'|'systems'>,commands:readonly CampaignCommand[]):CampaignState {
  let state=enableProgression({...structuredClone(baseline),systems:null,progression:null});
  for(const command of commands){const next=systemsEvents(state,transition(state,command),command);if(next===state)throw new Error('Invalid progression command');state=next;}
  return {...state,progression:{...state.progression!,commands:structuredClone([...commands])}};
}
export function activateSystems(state:CampaignState):CampaignState {
  if(state.systems)return state;
  const enabled=enableProgression(state);
  return campaignTransition(enabled,{type:'enable-systems',revision:enabled.revision});
}
function transition(previous:CampaignState,command:CampaignCommand):CampaignState {
  if (command.revision !== previous.revision) return previous;
  const openingResult=openingTransition(previous,command);
  if(openingResult!==null)return openingResult;
  const map=campaignMap(previous);
  const systemResult=systemsTransition(previous,command);
  if(systemResult!==null)return systemResult;
  if(command.type==='enable-progression')return enableProgression(previous);
  if (command.type === 'start-replay') {
    if (!previous.guidedComplete || previous.replay || previous.tutorial) return previous;
    return { ...previous, replay: newTutorial(), revision: previous.revision + 1 };
  }
  if (command.type === 'skip-lesson') {
    if (previous.replay) return { ...previous, replay: null, revision: previous.revision + 1 };
    if (!previous.tutorial || previous.phase !== 'tutorial' || previous.guidedComplete || previous.claimedRewards.includes(LESSON_CLAIM)) return previous;
    return finishLesson(previous);
  }
  const lesson = previous.replay ?? previous.tutorial;
  if (command.type === 'lesson' || command.type === 'reset-lesson') {
    if (!lesson) return previous;
    const next = command.type === 'reset-lesson' ? resetTutorial(lesson) : tutorialTransition(lesson, command.command);
    if (next === lesson) return previous;
    if (next.step === LESSON_STEPS.length) {
      if (previous.replay) return { ...previous, replay: null, revision: previous.revision + 1 };
      if (previous.guidedComplete || previous.claimedRewards.includes(LESSON_CLAIM) || next.battle.outcome !== 'victory') return previous;
      return finishLesson(previous);
    }
    return { ...previous, [previous.replay ? 'replay' : 'tutorial']: next, revision: previous.revision + 1 };
  }
  if (lesson) return previous;
  if(previous.progression){
    if(command.type==='start-encounter'){
      const encounter=ROUTE_ENCOUNTERS[command.nodeId];
      if(previous.phase!=='destination'||previous.currentNode!==command.nodeId||!encounter||previous.completedNodes.includes(command.nodeId))return previous;
      const battle=createBattle(previous.profile,encounter,previous.rng);
      return {...previous,phase:'battle',battle,battleStart:structuredClone(battle),progression:{...previous.progression,battleNode:command.nodeId},revision:previous.revision+1};
    }
    if(command.type==='rest'){
      if(previous.phase!=='destination'||previous.currentNode!==command.nodeId||nodeById(map,command.nodeId)?.kind!=='rest'||previous.completedNodes.includes(command.nodeId))return previous;
      return finishDestination({...previous,profile:restProfile(previous.profile)},command.nodeId,`${command.nodeId}:rest`);
    }
    if(command.type==='discover'){
      const pending=previous.pendingReward;
      if(previous.phase!=='destination'||previous.currentNode!==command.nodeId||pending?.kind!=='discovery'||pending.nodeId!==command.nodeId)return previous;
      if(command.option==='cards'&&command.nodeId==='route-discovery')return {...previous,phase:'reward',revision:previous.revision+1};
      if(command.option!=='salvage'&&!(command.option==='mp'&&command.nodeId==='route-overlook'))return previous;
      const changed={...previous,salvage:previous.salvage+(command.option==='salvage'?10:0),profile:command.option==='mp'?victoryProfile(previous.profile):previous.profile};
      return finishDestination(changed,command.nodeId,pending.id);
    }
    if(command.type==='choose-reward'){
      const pending=previous.pendingReward;
      if(previous.phase!=='reward'||!pending||pending.kind==='checkpoint'||pending.id!==command.claimId||previous.claimedRewards.includes(pending.id)||(command.card!==null&&!pending.cards.includes(command.card)))return previous;
      if(pending.kind==='training'&&command.card!==null)return previous;
      let profile=previous.profile,salvage=previous.salvage;
      if(pending.kind==='victory'){profile=victoryProfile(profile);salvage+=(pending.nodeId===CHECKPOINT_NODE||(previous.systems&&pending.nodeId==='route-story'))?20:12;}
      if(pending.kind==='training')profile=trainingProfile(profile,previous.battleStart!.hero.hp,previous.battleStart!.mp);
      if(command.card)profile={...profile,deck:[...profile.deck,{type:command.card,id:`reward:${pending.id}`} ]};
      const changed={...previous,profile,salvage};
      return pending.nodeId===CHECKPOINT_NODE?{...changed,phase:'complete',pendingReward:null,claimedRewards:[...previous.claimedRewards,pending.id],revision:previous.revision+1}:finishDestination(changed,pending.nodeId,pending.id);
    }
  }
  if (command.type === 'open-map') {
    if (previous.phase !== 'ready' && previous.phase !== 'complete') return previous;
    if (previous.dungeon) {
      if (!previous.completedNodes.includes(map.exit)) return previous;
      return { ...previous, dungeon: { ...previous.dungeon, origin: previous.phase }, phase: 'route-complete', currentNode: map.exit, revision: previous.revision + 1 };
    }
    return { ...previous, phase: 'map', dungeon: { id: map.id, origin: previous.phase }, currentNode: map.start,
      completedNodes: [...previous.completedNodes, map.start], routeDecisions: [...previous.routeDecisions, map.start], revision: previous.revision + 1 };
  }
  if (command.type === 'choose-node') {
    if (previous.phase !== 'map' || !previous.dungeon || !previous.currentNode) return previous;
    const current = nodeById(map,previous.currentNode);
    if (!current?.next.includes(command.nodeId) || previous.routeDecisions.includes(command.nodeId)) return previous;
    const next:CampaignState={ ...previous, phase: 'destination', currentNode: command.nodeId, routeDecisions: [...previous.routeDecisions,command.nodeId], revision: previous.revision + 1 };
    if(previous.progression&&nodeById(map,command.nodeId)?.kind==='discovery'){
      const roll=command.nodeId==='route-discovery'?rollCards(previous.rng):{rng:previous.rng,cards:[]};
      return {...next,rng:roll.rng,pendingReward:{id:rewardId(command.nodeId),nodeId:command.nodeId,kind:'discovery',rollSeed:command.nodeId==='route-discovery'?previous.rng:null,cards:roll.cards}};
    }
    return next;
  }
  if (command.type === 'continue-route') {
    if (previous.phase !== 'destination' || !previous.dungeon || command.nodeId !== previous.currentNode || previous.completedNodes.includes(command.nodeId)) return previous;
    if(previous.progression&&['battle','rest','discovery','teacher'].includes(nodeById(map,command.nodeId)!.kind))return previous;
    return { ...previous, phase: command.nodeId === map.exit ? 'route-complete' : 'map', completedNodes: [...previous.completedNodes,command.nodeId], revision: previous.revision + 1 };
  }
  if (command.type === 'leave-map') {
    if (previous.phase !== 'route-complete' || !previous.dungeon) return previous;
    return { ...previous, phase: previous.dungeon.origin, currentNode: previous.dungeon.origin === 'complete' ? CHECKPOINT_NODE : null, revision: previous.revision + 1 };
  }
  // Remaining map destinations cannot dispatch checkpoint commands.
  if (previous.dungeon && ['map','destination','route-complete'].includes(previous.phase)) return previous;
  if (command.type === 'enter') {
    if (previous.phase !== 'ready' || command.nodeId !== CHECKPOINT_NODE) return previous;
    const start = createBattle(previous.profile, CAMPAIGN_ENCOUNTER, previous.rng);
    return { ...previous, phase: 'battle', revision: previous.revision + 1, currentNode: CHECKPOINT_NODE, progression:previous.progression?{...previous.progression,battleNode:CHECKPOINT_NODE}:null,
      routeDecisions: [...previous.routeDecisions, CHECKPOINT_NODE], battle: start, battleStart: structuredClone(start) };
  }
  if (command.type === 'claim') {
    const reward = previous.pendingReward;
    if (previous.phase !== 'reward' || !reward || reward.kind!=='checkpoint' || reward.id !== command.claimId || previous.claimedRewards.includes(command.claimId)) return previous;
    return { ...previous, phase: 'complete', revision: previous.revision + 1, pendingReward: null,
      claimedRewards: [...previous.claimedRewards, reward.id] };
  }
  if (previous.phase !== 'battle' || !previous.battle || !previous.battleStart) return previous;
  if (command.type === 'retry') {
    return { ...previous, revision: previous.revision + 1, battle: structuredClone(previous.battleStart) };
  }
  if (command.type === 'resolve') {
    if (previous.battle.outcome !== 'victory') return previous;
    if(previous.progression){
      const nodeId=previous.progression.battleNode??CHECKPOINT_NODE,training=nodeId==='route-teacher',roll=(training||(previous.systems&&nodeId==='route-story'))?{cards:[],rng:previous.rng}:rollCards(previous.rng);
      if(previous.completedNodes.includes(nodeId)||previous.claimedRewards.includes(rewardId(nodeId)))return previous;
      return {...previous,phase:'reward',rng:roll.rng,profile:{...previous.profile,hp:previous.battle.hero.hp,mp:previous.battle.mp},
        pendingReward:{id:rewardId(nodeId),nodeId,kind:training?'training':'victory',rollSeed:training?null:previous.rng,cards:roll.cards},
        completedNodes:nodeId===CHECKPOINT_NODE?[...previous.completedNodes,CHECKPOINT_NODE]:previous.completedNodes,revision:previous.revision+1};
    }
    if(previous.completedNodes.includes(CHECKPOINT_NODE))return previous;
    return { ...previous, phase: 'reward', revision: previous.revision + 1,
      profile: { ...previous.profile, hp: previous.battle.hero.hp, mp: previous.battle.mp },
      completedNodes: [...previous.completedNodes, CHECKPOINT_NODE],
      pendingReward: { id: CHECKPOINT_CLAIM, nodeId: CHECKPOINT_NODE, kind: 'checkpoint' } };
  }
  if(command.type!=='play'&&command.type!=='end-turn')return previous;
  const battle = command.type === 'play' ? playCard(previous.battle, command.cardId, command.battleRevision) : endTurn(previous.battle, command.battleRevision);
  return battle === previous.battle ? previous : { ...previous, revision: previous.revision + 1, battle };
}
function finishDestination(state:CampaignState,nodeId:string,claimId:string):CampaignState {
  if(state.completedNodes.includes(nodeId)||state.claimedRewards.includes(claimId))return state;
  return {...state,phase:'map',pendingReward:null,completedNodes:[...state.completedNodes,nodeId],claimedRewards:[...state.claimedRewards,claimId],battle:null,battleStart:null,
    progression:state.progression?{...state.progression,battleNode:null}:null,revision:state.revision+1};
}

function finishLesson(previous: CampaignState): CampaignState {
  const map = campaignMap(previous);
  return { ...previous, phase: 'map', dungeon: { id: map.id, origin: 'ready' }, currentNode: map.start, tutorial: null, guidedComplete: true, revision: previous.revision + 1,
        profile: structuredClone(CAMPAIGN_PROFILE), salvage: previous.salvage + 12,
        completedNodes: [...previous.completedNodes, LESSON_NODE, map.start], routeDecisions: [...previous.routeDecisions, LESSON_NODE, map.start],
        claimedRewards: [...previous.claimedRewards, LESSON_CLAIM] };
}
