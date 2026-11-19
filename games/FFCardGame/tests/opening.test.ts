import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { newCampaign } from '../client/src/game/campaign';
import { OPENING_MAP } from '../client/src/content/opening';
import { act, roundtrip } from './fixtures/systems';
import { openingAction, openingUntil } from './fixtures/opening';
import { cardDefinition } from '../client/src/content/cards';
import { decodeSave, encodeSave } from '../client/src/persistence/campaign';

test('authored opening has sixteen paths with both sections, five route battles and all mandatory gates',()=>{
  const paths:string[][]=[];function visit(id:string,path:string[]){const node=OPENING_MAP.nodes.find(n=>n.id===id)!;if(id===OPENING_MAP.exit)paths.push([...path,id]);else for(const next of node.next)visit(next,[...path,id]);}visit(OPENING_MAP.start,[]);
  assert.equal(paths.length,16);for(const path of paths){for(const gate of OPENING_MAP.gates)assert.ok(path.includes(gate));assert.equal(path.filter(id=>['battle','teacher','story'].includes(OPENING_MAP.nodes.find(n=>n.id===id)!.kind)).length,5);assert.ok(path.includes('route-junction'));}
});

test('three complete route/build flows preserve saves, make purchases/card choices, and end after partnership',()=>{
  for(const [index,itemId] of (['heavy-gauntlet','layered-armor','quick-harness'] as const).entries()){
    const policy={seed:19,itemId,branches:index*5};let state=newCampaign(19,true,true,true),battles=0;
    for(let i=0;i<900&&state.phase!=='complete';i++){
      if(state.phase==='battle'&&!state.battle!.revision)battles++;
      state=openingAction(state,policy);assert.notEqual(state.battle?.outcome,'defeat');
      if(state.phase!=='battle'||state.battle?.practice?.requiredCardId)roundtrip(state);
    }
    assert.equal(state.phase,'complete');assert.equal(battles,5);assert.equal(state.profile.maxHp,66);assert.equal(state.profile.maxMp,12);assert.equal(state.systems!.opening!.complete,true);assert.ok(state.systems!.effects.includes('partnership'));assert.deepEqual(state.systems!.allies,['iven']);assert.ok(state.systems!.owned.some(item=>item.id===itemId));assert.equal(state.profile.deck.length,14);
    assert.equal(state.profile.deck.find(c=>c.type==='pulse')!.upgrade,'tempered-flow');assert.equal(state.claimedRewards.length,8);roundtrip(state);
    assert.equal(act(state,{type:'start-bridge'}),state);const review=act(state,{type:'open-map'});assert.equal(review.phase,'route-complete');roundtrip(review);const returned=act(review,{type:'leave-map'});assert.equal(returned.phase,'complete');assert.equal(returned.salvage,state.salvage);roundtrip(returned);
  }
});

test('workshop receives the agreed guaranteed 36 salvage, or 46 with first discovery',()=>{
  for(const branches of [0,2]){const state=openingUntil(s=>s.phase==='destination'&&s.currentNode==='route-workshop',{seed:19,itemId:'heavy-gauntlet',branches});assert.equal(state.salvage,branches?46:36);roundtrip(state);}
});

test('discovery-funded workshop can buy and upgrade speed gear before training, with no resource refill',()=>{
  let state=openingUntil(s=>s.phase==='destination'&&s.currentNode==='route-workshop',{seed:19,itemId:'quick-harness',branches:2});const hp=state.profile.hp,mp=state.profile.mp;
  state=act(state,{type:'buy',itemId:'quick-harness'});state=act(state,{type:'upgrade-item',itemId:'quick-harness'});state=act(state,{type:'equip',itemId:'quick-harness'});
  assert.equal(state.salvage,2);assert.equal(state.profile.hp,hp);assert.equal(state.profile.mp,mp);assert.equal(state.profile.equipment!.utility.upgraded,true);roundtrip(state);
});

test('v6 practice fixture resumes its required action and rejects a forged completed opening',()=>{
  const state=decodeSave(readFileSync(new URL('./fixtures/save-v6-practice.json',import.meta.url),'utf8')).state;assert.equal(state.battle!.practice!.requiredCardId,state.profile.deck.find(card=>card.type==='pulse')!.id);roundtrip(state);
  const altered=JSON.parse(encodeSave(state));altered.state.systems.opening.complete=true;assert.throws(()=>decodeSave(JSON.stringify(altered)));
});

test('training isolates travel resources/gear, requires upgraded Pulse, restores exact retry and grants growth once',()=>{
  const policy={seed:19,itemId:'heavy-gauntlet' as const};let state=openingUntil(s=>s.phase==='battle'&&s.currentNode==='route-teacher',policy);
  const before=structuredClone(state.systems!.opening!.practiceProfile!),battle=state.battle!,pulse=battle.hand.find(c=>c.type==='pulse')!;
  assert.equal(battle.hero.hp,60);assert.equal(battle.mp,10);assert.equal(battle.config.stats.power,0);assert.equal(cardDefinition(pulse).mpCost,3);assert.equal(battle.practice!.requiredCardId,pulse.id);assert.equal(pulse.id,before.deck.find(c=>c.type==='pulse')!.id);roundtrip(state);
  assert.equal(act(state,{type:'end-turn',battleRevision:battle.revision}),state);const other=battle.hand.find(c=>c.id!==pulse.id)!;assert.equal(act(state,{type:'play',cardId:other.id,battleRevision:battle.revision}),state);
  state=act(state,{type:'play',cardId:pulse.id,battleRevision:battle.revision});assert.equal(state.battle!.practice!.requiredCardId,null);assert.equal(state.battle!.mp,7);
  for(let i=0;i<30&&!state.battle!.outcome;i++)state=act(state,{type:'end-turn',battleRevision:state.battle!.revision});assert.equal(state.battle!.outcome,'defeat');state=act(state,{type:'retry'});assert.deepEqual(state.battle,battle);assert.deepEqual(state.profile,before);roundtrip(state);
  state=openingUntil(s=>s.phase==='reward',policy,state);assert.deepEqual(state.profile,before);state=openingAction(state,policy);assert.equal(state.profile.hp,before.hp+6);assert.equal(state.profile.mp,Math.min(before.mp+2,12));assert.equal(state.profile.equipment!.gauntlet.id,'heavy-gauntlet');assert.equal(state.systems!.opening!.practiceProfile,null);roundtrip(state);
});

test('second discovery grants only one owned kit, consumes its stock, and never refills MP',()=>{
  let state=openingUntil(s=>s.phase==='destination'&&s.currentNode==='route-second-discovery',{seed:19,itemId:'quick-harness',branches:8});const mp=state.profile.mp,claim=state.pendingReward!.id;
  state=act(state,{type:'discover',nodeId:'route-second-discovery',option:'kit'});assert.equal(state.systems!.owned.filter(i=>i.id==='insulated-kit').length,1);assert.ok(!state.systems!.stock.includes('insulated-kit'));assert.ok(state.claimedRewards.includes(claim));assert.equal(state.profile.mp,mp);assert.equal(state.profile.equipment!.utility.id,'quick-harness');assert.equal(act(state,{type:'discover',nodeId:'route-second-discovery',option:'kit'}),state);roundtrip(state);
});

test('v5 support fixture migrates without converting its route, resetting a battle or granting chapter completion',()=>{
  const raw=readFileSync(new URL('./fixtures/save-v5-support.json',import.meta.url),'utf8'),old=JSON.parse(raw),save=decodeSave(raw);assert.equal(save.version,6);assert.deepEqual(save.state,old.state);assert.equal(save.state.systems!.opening,undefined);roundtrip(save.state);
  const edited=JSON.parse(encodeSave(save.state));edited.state.systems.opening={complete:true,practiceProfile:null};assert.throws(()=>decodeSave(JSON.stringify(edited)));
});
