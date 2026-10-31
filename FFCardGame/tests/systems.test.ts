import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { activateSystems, campaignTransition, newCampaign } from '../client/src/game/campaign';
import { LESSON_STEPS } from '../client/src/content/tutorial';
import { CARDS, cardDefinition } from '../client/src/content/cards';
import { SCENES } from '../client/src/content/scenes';
import { PROTOTYPE_PROFILE, PROTOTYPE_ENCOUNTER } from '../client/src/content/encounter';
import { createBattle, endTurn, playCard } from '../client/src/game/combat';
import { attachSupport, useSupport } from '../client/src/game/support';
import { deriveStats } from '../client/src/game/equipment';
import { decodeSave, encodeSave } from '../client/src/persistence/campaign';

import { act, roundtrip, skip, win, workshopState, bridgeState } from './fixtures/systems';

test('workshop purchases persist stock and ownership, reject stale/duplicate/insufficient funds, and never auto-equip',()=>{
  const initial=workshopState(),copy=structuredClone(initial);assert.equal(initial.salvage,34);roundtrip(initial);
  let state=act(initial,{type:'buy',itemId:'quick-harness'});assert.equal(state.salvage,10);assert.equal(state.profile.equipment!.utility.id,'plain-carrier');assert.ok(state.systems!.owned.some(i=>i.id==='quick-harness'));assert.ok(!state.systems!.stock.includes('quick-harness'));roundtrip(state);
  const reloaded=decodeSave(encodeSave(state)).state;
  assert.equal(act(reloaded,{type:'buy',itemId:'quick-harness'}),reloaded);assert.equal(act(reloaded,{type:'buy',itemId:'heavy-gauntlet'}),reloaded);
  assert.equal(campaignTransition(state,{type:'buy',itemId:'balanced-gauntlet',revision:initial.revision}),state);
  state=act(state,{type:'equip',itemId:'quick-harness'});assert.equal(deriveStats(state.profile).speed,2);roundtrip(state);assert.deepEqual(initial,copy);
  const left=act(state,{type:'continue-route',nodeId:state.currentNode!});assert.equal(act(left,{type:'upgrade-item',itemId:'quick-harness'}),left);
});

test('isolated workshop service fixture enforces one upgrade, resource-preserving swaps, ownership and minimum deck',()=>{
  // Extra budget is confined to this pure subsystem fixture, never a valid save or runtime grant.
  let state={...workshopState(),salvage:200,profile:{...workshopState().profile,hp:30,mp:3}};
  state=act(state,{type:'buy',itemId:'insulated-kit'});state=act(state,{type:'equip',itemId:'insulated-kit'});assert.equal(state.profile.mp,3);assert.equal(deriveStats(state.profile).maxMp,13);assert.equal(state.profile.hp,30);
  state=act(state,{type:'upgrade-item',itemId:'insulated-kit'});assert.equal(deriveStats(state.profile).defense,2);assert.equal(state.profile.mp,3);
  assert.equal(act(state,{type:'upgrade-item',itemId:'insulated-kit'}),state);assert.equal(act(state,{type:'equip',itemId:'heavy-gauntlet'}),state);
  const pulse=state.profile.deck.find(c=>c.type==='pulse')!;assert.equal(act(state,{type:'remove-card',cardId:pulse.id}),state);assert.equal(act(state,{type:'refine-card',cardId:pulse.id}),state);
  const strike=state.profile.deck.find(c=>c.type==='strike')!;state=act(state,{type:'refine-card',cardId:strike.id});assert.equal(cardDefinition(state.profile.deck.find(c=>c.id===strike.id)!).damage,8);assert.equal(act(state,{type:'refine-card',cardId:strike.id}),state);
  while(state.profile.deck.length>8)state=act(state,{type:'remove-card',cardId:state.profile.deck.find(c=>c.type!=='pulse')!.id});assert.equal(act(state,{type:'remove-card',cardId:state.profile.deck.find(c=>c.type!=='pulse')!.id}),state);
  const battle=act(state,{type:'continue-route',nodeId:'route-workshop'});const arriving=skip(act(battle,{type:'choose-node',nodeId:'route-story'}));const fighting=act(arriving,{type:'start-bridge'});assert.equal(act(fighting,{type:'equip',itemId:'plain-carrier'}),fighting);assert.equal(act(fighting,{type:'buy',itemId:'heavy-gauntlet'}),fighting);
});

test('all eleven workshop upgrades preserve costs and reflect the approved effects; Pulse stays teacher-owned',()=>{
  for(const type of Object.keys(CARDS) as (keyof typeof CARDS)[]){if(type==='pulse')continue;const base=CARDS[type],data=cardDefinition({id:'x',type,upgrade:'refined'});assert.equal(data.cost,base.cost);assert.equal(data.mpCost,base.mpCost);if(base.damage)assert.equal(data.damage,base.damage+2);if(base.block)assert.equal(data.block,base.block+2);}
  assert.equal(cardDefinition({id:'x',type:'vent',upgrade:'refined'}).strain,-6);assert.equal(cardDefinition({id:'x',type:'cycle',upgrade:'refined'}).strain,0);assert.equal(cardDefinition({id:'x',type:'return-stroke',upgrade:'refined'}).strain,-2);assert.throws(()=>cardDefinition({id:'x',type:'pulse',upgrade:'refined'}));
});

test('brief scenes resume each beat, Skip applies the same once-only consequences and cannot skip combat gates',()=>{
  let read=newCampaign(19,true,true),skipped=structuredClone(read);
  while(read.systems!.scene){roundtrip(read);read=act(read,{type:'scene-next'});}skipped=skip(skipped);
  assert.deepEqual(read.systems,skipped.systems);assert.deepEqual(read.profile,skipped.profile);assert.equal(read.phase,'tutorial');assert.equal(read.tutorial!.step,0);assert.deepEqual(read.systems!.effects,['home','regulator','ashways']);
  assert.equal(act(read,{type:'scene-skip'}),read);assert.equal(act(newCampaign(19,true,true),{type:'lesson',command:{step:0,revision:0,action:LESSON_STEPS[0].action}}).tutorial!.step,0);
  for(const scene of Object.values(SCENES)){assert.ok(scene.lines.length<=6);assert.ok(scene.lines.every(([,line])=>line.split(/\s+/).length<=12));}
});

test('only reached scenes replay, and replay cannot change the underlying campaign or one-time effects',()=>{
  const initial=workshopState();assert.equal(act(initial,{type:'replay-scene',sceneId:'partnership'}),initial);
  let state=act(initial,{type:'replay-scene',sceneId:'regulator'});roundtrip(state);state=act(state,{type:'scene-next'});state=skip(state);
  assert.deepEqual({...state,revision:initial.revision,progression:initial.progression},initial);roundtrip(state);
});

test('Iven is absent until the bridge, arrives before the first command, and support is required once',()=>{
  const workshop=workshopState();assert.deepEqual(workshop.systems!.allies,[]);assert.equal(act(workshop,{type:'support',ally:'iven',battleRevision:0}),workshop);
  const state=bridgeState(),battle=state.battle!;assert.equal(battle.config.encounter.enemy.maxHp,68);assert.deepEqual(battle.support,{present:['iven'],spent:[],required:'iven'});roundtrip(state);
  assert.equal(act(state,{type:'play',cardId:battle.hand[0].id,battleRevision:battle.revision}),state);assert.equal(act(state,{type:'end-turn',battleRevision:battle.revision}),state);
  let supported=act(state,{type:'support',ally:'iven',battleRevision:battle.revision});roundtrip(supported);assert.equal(supported.battle!.hero.block,8);assert.equal(supported.battle!.energy,battle.energy);assert.equal(supported.battle!.mp,battle.mp);assert.equal(supported.battle!.turn,1);assert.equal(supported.battle!.strain,0);
  supported=decodeSave(encodeSave(supported)).state;assert.equal(act(supported,{type:'support',ally:'iven',battleRevision:supported.battle!.revision}),supported);
  const cooled=act(supported,{type:'end-turn',battleRevision:supported.battle!.revision});assert.equal(cooled.battle!.hero.hp,battle.hero.hp);assert.equal(cooled.battle!.hero.block,0);
  const retry=act(cooled,{type:'retry'});assert.deepEqual(retry.battle,state.battleStart);roundtrip(retry);
});

test('bridge victory has no card offer; partnership skip/replay preserves one-time rewards and ally presence',()=>{
  let state=win(bridgeState());assert.equal(state.pendingReward!.kind,'victory');assert.equal(state.pendingReward!.cards.length,0);roundtrip(state);
  const salvage=state.salvage,claimId=state.pendingReward!.id;state=act(state,{type:'choose-reward',claimId,card:null});assert.equal(state.salvage,salvage+20);assert.equal(state.systems!.scene!.id,'partnership');roundtrip(state);
  state=skip(state);assert.ok(state.systems!.effects.includes('partnership'));assert.deepEqual(state.systems!.allies,['iven']);assert.equal(act(state,{type:'choose-reward',claimId,card:null}),state);
  state=act(state,{type:'choose-node',nodeId:'route-exit'});state=act(state,{type:'continue-route',nodeId:'route-exit'});state=act(state,{type:'leave-map'});state=act(state,{type:'enter',nodeId:'kiln-checkpoint'});assert.deepEqual(state.battle!.support,{present:['iven'],spent:[],required:null});roundtrip(state);
});

test('support rejects stale/terminal input and resets only with a new battle setup',()=>{
  const start=attachSupport(createBattle(PROTOTYPE_PROFILE,PROTOTYPE_ENCOUNTER,1),['iven']);const copy=structuredClone(start),after=useSupport(start,'iven');assert.deepEqual(start,copy);assert.equal(useSupport(after,'iven'),after);assert.equal(useSupport(start,'iven',999),start);
  assert.equal(useSupport({...start,outcome:'defeat'},'iven').hero.block,0);assert.equal(useSupport(createBattle(PROTOTYPE_PROFILE,PROTOTYPE_ENCOUNTER,1),'iven').hero.block,0);
  assert.equal(endTurn(after).support!.spent.length,1);assert.equal(attachSupport(createBattle(PROTOTYPE_PROFILE,PROTOTYPE_ENCOUNTER,2),['iven']).support!.spent.length,0);
  assert.equal(playCard(attachSupport(start,['iven'],'iven'),start.hand[0].id).revision,0);
});

test('v4 migration preserves offers and supports remaining new stops, with no retroactive purchases or scenes',()=>{
  const raw=readFileSync(new URL('./fixtures/save-v4-reward.json',import.meta.url),'utf8'),old=JSON.parse(raw),loaded=decodeSave(raw);assert.equal(loaded.version,5);assert.deepEqual(loaded.state,{...old.state,systems:null});
  const enabled=activateSystems(loaded.state);assert.deepEqual(enabled.pendingReward,old.state.pendingReward);assert.equal(enabled.salvage,old.state.salvage);assert.deepEqual(enabled.systems!.reached,[]);roundtrip(enabled);
});

test('v5 validation rejects forged ownership, shop stock, upgrades, scene effects and support charges',()=>{
  const original=JSON.parse(encodeSave(act(bridgeState(),{type:'support',ally:'iven',battleRevision:0})));
  for(const change of [(v:any)=>v.state.systems.stock.push('quick-harness'),(v:any)=>v.state.systems.owned.push({id:'heavy-gauntlet'}),(v:any)=>v.state.systems.effects.push('partnership'),(v:any)=>v.state.battle.support.spent=[],(v:any)=>v.state.profile.deck[0].upgrade='refined']){const altered=structuredClone(original);change(altered);assert.throws(()=>decodeSave(JSON.stringify(altered)));}
});

test('v5 support fixture retains the spent charge and subsequent turns after import',()=>{
  const state=decodeSave(readFileSync(new URL('./fixtures/save-v5-support.json',import.meta.url),'utf8')).state;
  assert.equal(state.battle!.hero.block,8);assert.deepEqual(state.battle!.support!.spent,['iven']);roundtrip(state);
  assert.equal(act(state,{type:'support',ally:'iven',battleRevision:state.battle!.revision}),state);
  const next=act(state,{type:'end-turn',battleRevision:state.battle!.revision});assert.equal(next.battle!.turn,2);assert.equal(next.battle!.hero.block,0);assert.deepEqual(next.battle!.support!.spent,['iven']);roundtrip(next);
});
