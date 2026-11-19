import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { campaignTransition, enableProgression, type CampaignState, newCampaign } from '../client/src/game/campaign';
import { LESSON_STEPS } from '../client/src/content/tutorial';
import { REWARD_POOL } from '../client/src/content/rewards';
import { CARDS } from '../client/src/content/cards';
import { rollCards, restProfile, trainingProfile } from '../client/src/game/rewards';
import { decodeSave, encodeSave } from '../client/src/persistence/campaign';
import { battleAction } from './fixtures/progression';
import { createBattle, playCard, preview } from '../client/src/game/combat';
import { PROTOTYPE_PROFILE, PROTOTYPE_ENCOUNTER } from '../client/src/content/encounter';
import { STARTING_EQUIPMENT } from '../client/src/content/equipment';
import { deriveStats } from '../client/src/game/equipment';

function prepared(seed=19){let state=newCampaign(seed);for(const step of LESSON_STEPS)state=campaignTransition(state,{type:'lesson',revision:state.revision,command:{step:state.tutorial!.step,revision:state.tutorial!.revision,action:step.action}});return state;}
function go(state:CampaignState,nodeId:string){return campaignTransition(state,{type:'choose-node',nodeId,revision:state.revision});}
function win(state:CampaignState){for(let i=0;i<200&&state.phase==='battle';i++){assert.notEqual(state.battle!.outcome,'defeat');state=battleAction(state);}assert.equal(state.phase,'reward');return state;}
function firstReward(seed=19){let state=go(prepared(seed),'route-ash-way');state=campaignTransition(state,{type:'start-encounter',nodeId:state.currentNode!,revision:state.revision});return win(state);}
function collect(state:CampaignState,card:null|typeof REWARD_POOL[number]=null){return campaignTransition(state,{type:'choose-reward',claimId:state.pendingReward!.id,card,revision:state.revision});}
function roundtrip(state:CampaignState){assert.deepEqual(decodeSave(encodeSave(state)).state,state);}

test('seeded offers contain three distinct eligible cards, never Pulse, with deterministic saved RNG',()=>{
  const offers=new Set<string>();
  for(let seed=0;seed<100;seed++){const roll=rollCards(seed);assert.deepEqual(roll,rollCards(seed));assert.equal(roll.cards.length,3);assert.equal(new Set(roll.cards).size,3);for(const card of roll.cards)assert.ok(REWARD_POOL.includes(card));assert.ok(!roll.cards.some(card=>(card as string)==='pulse'));offers.add(roll.cards.join(','));}
  assert.ok(offers.size>10);
  const state=firstReward();assert.notEqual(state.pendingReward!.kind,'checkpoint');
  if(state.pendingReward!.kind!=='checkpoint')assert.deepEqual(state.pendingReward!.cards,rollCards(19).cards);
  roundtrip(state);const restored=decodeSave(encodeSave(state)).state;assert.deepEqual(restored.pendingReward,state.pendingReward);assert.equal(restored.rng,state.rng);
});
test('victory selection or Skip grants capped recovery/salvage once and preserves card identities',()=>{
  const before=firstReward(),snapshot=structuredClone(before),pending=before.pendingReward!;assert.notEqual(pending.kind,'checkpoint');
  if(pending.kind==='checkpoint')throw Error('wrong reward');
  const command={type:'choose-reward' as const,claimId:pending.id,card:pending.cards[0],revision:before.revision};
  const chosen=campaignTransition(before,command);
  assert.equal(chosen.profile.deck.length,13);assert.equal(chosen.profile.deck.at(-1)!.type,pending.cards[0]);
  assert.equal(chosen.profile.deck.filter(c=>c.type==='pulse').length,1);assert.equal(new Set(chosen.profile.deck.map(c=>c.id)).size,13);
  assert.equal(chosen.salvage,24);assert.equal(chosen.profile.mp,Math.min(10,before.profile.mp+2));
  assert.equal(campaignTransition(chosen,command),chosen);assert.equal(campaignTransition(chosen,{...command,revision:chosen.revision}),chosen);
  const skipped=collect(before);assert.equal(skipped.profile.deck.length,12);assert.equal(skipped.salvage,24);assert.equal(skipped.profile.mp,chosen.profile.mp);
  assert.equal(campaignTransition(before,{type:'claim',claimId:pending.id,revision:before.revision}),before);
  assert.equal(campaignTransition(before,{...command,card:'pulse' as never}),before);
  assert.deepEqual(before,snapshot);roundtrip(chosen);roundtrip(skipped);
});
test('rest previews and transition use rounded HP recovery and effective MP caps, once only',()=>{
  const profile={...PROTOTYPE_PROFILE,hp:30,mp:3,equipment:{...STARTING_EQUIPMENT,utility:{id:'insulated-kit'}}};
  const copy=structuredClone(profile),rested=restProfile(profile);
  assert.equal(rested.hp,48);assert.equal(rested.mp,11);assert.deepEqual(profile,copy);
  assert.equal(restProfile({...profile,hp:59}).hp,60);
  let state=go(collect(firstReward()),'route-rest');const before=state.profile;
  const cmd={type:'rest' as const,nodeId:'route-rest',revision:state.revision};state=campaignTransition(state,cmd);
  assert.deepEqual(state.profile,restProfile(before));assert.equal(campaignTransition(state,{...cmd,revision:state.revision}),state);roundtrip(state);
});
test('discovery commits salvage or a saved card offer, and cannot switch or reroll after selection',()=>{
  const state=go(collect(firstReward()),'route-discovery'),pending=state.pendingReward!;assert.notEqual(pending.kind,'checkpoint');
  const restored=decodeSave(encodeSave(state)).state;assert.deepEqual(restored.pendingReward,pending);
  const salvage=campaignTransition(state,{type:'discover',nodeId:'route-discovery',option:'salvage',revision:state.revision});assert.equal(salvage.salvage,state.salvage+10);
  assert.equal(campaignTransition(salvage,{type:'discover',nodeId:'route-discovery',option:'cards',revision:salvage.revision}),salvage);
  let cards=campaignTransition(restored,{type:'discover',nodeId:'route-discovery',option:'cards',revision:restored.revision});roundtrip(cards);
  assert.deepEqual(cards.pendingReward,pending);cards=collect(cards);assert.equal(cards.salvage,state.salvage);assert.equal(cards.profile.deck.length,12);
  assert.equal(cards.rng,salvage.rng);roundtrip(cards);roundtrip(salvage);
});
test('training restores pre-fight resources before one-time +6/+2 growth and the exact Pulse upgrade',()=>{
  const profile={...PROTOTYPE_PROFILE,hp:30,mp:3,equipment:{...STARTING_EQUIPMENT,utility:{id:'insulated-kit'}}};
  const grown=trainingProfile(profile,30,3);assert.equal(grown.maxHp,66);assert.equal(grown.hp,36);assert.equal(grown.maxMp,12);assert.equal(grown.mp,5);assert.equal(deriveStats(grown).maxMp,13);
  assert.equal(grown.deck.find(c=>c.type==='pulse')!.id,profile.deck.find(c=>c.type==='pulse')!.id);
  let state=go(collect(firstReward()),'route-rest');state=campaignTransition(state,{type:'rest',nodeId:state.currentNode!,revision:state.revision});state=go(state,'route-teacher');
  assert.equal(campaignTransition(state,{type:'continue-route',nodeId:state.currentNode!,revision:state.revision}),state);
  const start=structuredClone(state.profile);state=campaignTransition(state,{type:'start-encounter',nodeId:state.currentNode!,revision:state.revision});state=win(state);roundtrip(state);
  const pending=state.pendingReward!,cmd={type:'choose-reward' as const,claimId:pending.id,card:null,revision:state.revision};
  const trained=campaignTransition(state,cmd);assert.equal(trained.profile.hp,start.hp+6);assert.equal(trained.profile.mp,start.mp+2);assert.equal(trained.profile.maxHp,66);assert.equal(trained.profile.maxMp,12);
  assert.equal(trained.profile.deck.find(c=>c.type==='pulse')!.upgrade,'tempered-flow');assert.equal(trained.salvage,state.salvage);
  assert.equal(campaignTransition(trained,{...cmd,revision:trained.revision}),trained);roundtrip(trained);
});
test('new techniques preserve pre-card heat timing, mixed effects, MP spending and finite draw conservation',()=>{
  assert.deepEqual(REWARD_POOL.map(type=>CARDS[type].cost),[1,1,1,0,1]);
  for(const [strain,damage] of [[5,6],[6,12],[9,12]]){const b=createBattle({...PROTOTYPE_PROFILE,deck:[{type:'ember-hook',id:'hook'}]},PROTOTYPE_ENCOUNTER,1);b.strain=strain;assert.equal(preview(b,b.hand[0]).damage,damage);const after=playCard(b,'hook');assert.equal(after.enemy.hp,72-damage);if(strain===9){assert.equal(after.hero.hp,54);assert.equal(after.strain,4);}}
  const mixed=createBattle({...PROTOTYPE_PROFILE,deck:[{type:'pressure-return',id:'return'}]},PROTOTYPE_ENCOUNTER,1);mixed.strain=6;const after=playCard(mixed,'return');assert.equal(after.mp,9);assert.equal(after.enemy.hp,65);assert.equal(after.hero.block,5);assert.equal(after.strain,4);
  const only=createBattle({...PROTOTYPE_PROFILE,deck:[{type:'return-stroke',id:'draw'}]},PROTOTYPE_ENCOUNTER,1);only.strain=1;const drawn=playCard(only,'draw');assert.equal(drawn.hand.length,0);assert.equal(drawn.discard.length,1);assert.equal(drawn.strain,0);
});
test('v4 history validates every accepted state and rejects edited resources, offers, grants and commands',()=>{
  const state=firstReward(),raw=JSON.parse(encodeSave(state));
  for(const mutate of [
    (v:any)=>v.state.salvage++, (v:any)=>v.state.profile.maxHp++, (v:any)=>v.state.pendingReward.cards.reverse(),
    (v:any)=>v.state.profile.deck.push({type:'pulse',id:'extra'}), (v:any)=>v.state.progression.commands.pop(),
    (v:any)=>v.state.progression.commands[0].revision++, (v:any)=>v.state.progression.commands.push({type:'unknown',revision:v.state.revision}),
  ]){const changed=structuredClone(raw);mutate(changed);assert.throws(()=>decodeSave(JSON.stringify(changed)));}
  let active=go(prepared(),'route-pressure-way');active=campaignTransition(active,{type:'start-encounter',nodeId:active.currentNode!,revision:active.revision});
  for(let i=0;i<200&&active.phase==='battle';i++){roundtrip(active);active=battleAction(active);}roundtrip(active);
});
test('legacy v3 progress activates rewards without replaying old stops or granting retroactive effects',()=>{
  const loaded=decodeSave(readFileSync(new URL('./fixtures/save-v3-route.json',import.meta.url),'utf8')).state;
  const enabled=enableProgression(loaded);assert.deepEqual(enabled.profile,loaded.profile);assert.equal(enabled.salvage,loaded.salvage);assert.deepEqual(enabled.completedNodes,loaded.completedNodes);roundtrip(enabled);
  const claimed=campaignTransition(enabled,{type:'discover',nodeId:enabled.currentNode!,option:'salvage',revision:enabled.revision});
  assert.equal(claimed.salvage,enabled.salvage+10);assert.equal(claimed.phase,'map');roundtrip(claimed);
});

test('the later discovery offers capped MP recovery instead of salvage, and is consumed once',()=>{
  let state=go(collect(firstReward()),'route-discovery');state=campaignTransition(state,{type:'discover',nodeId:state.currentNode!,option:'salvage',revision:state.revision});
  state=go(state,'route-teacher');state=campaignTransition(state,{type:'start-encounter',nodeId:state.currentNode!,revision:state.revision});state=collect(win(state));state=go(state,'route-overlook');
  const before=structuredClone(state),command={type:'discover' as const,nodeId:'route-overlook',option:'mp' as const,revision:state.revision};
  state=campaignTransition(state,command);assert.equal(state.profile.mp,Math.min(12,before.profile.mp+2));assert.equal(state.salvage,before.salvage);assert.equal(campaignTransition(state,{...command,revision:state.revision}),state);roundtrip(state);
});
test('v4 pending victory fixture preserves offer and rejects duplicate completion after reload',()=>{
  let state=decodeSave(readFileSync(new URL('./fixtures/save-v4-reward.json',import.meta.url),'utf8')).state;
  assert.equal(state.phase,'reward');assert.equal(state.pendingReward!.kind,'victory');
  const pending=state.pendingReward!;
  assert.deepEqual(pending.cards,rollCards(19).cards);
  const command={type:'choose-reward' as const,claimId:pending.id,card:pending.cards[0],revision:state.revision};
  state=campaignTransition(state,command);roundtrip(state);
  state=decodeSave(encodeSave(state)).state;
  assert.equal(campaignTransition(state,{...command,revision:state.revision}),state);
  assert.equal(state.profile.deck.length,13);
});
