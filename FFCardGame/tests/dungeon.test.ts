import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ROUTE_PREVIEW } from '../client/src/content/dungeon';
import { destinationEvent, dungeonPath, nodeById, nodeStatus, validateDungeon, validDungeonPath, type DungeonDefinition } from '../client/src/game/dungeon';
import { campaignTransition, newCampaign, type CampaignState } from '../client/src/game/campaign';
import { decodeSave, encodeSave } from '../client/src/persistence/campaign';
import { CHECKPOINT_NODE } from '../client/src/content/campaign';
import { cardAvailability, preview } from '../client/src/game/combat';
import { LESSON_STEPS } from '../client/src/content/tutorial';

function allRoutes(map: DungeonDefinition, path = [map.start]): string[][] {
  return path.at(-1) === map.exit ? [path] : nodeById(map,path.at(-1)!)!.next.flatMap(id => allRoutes(map,[...path,id]));
}
export function enterMap(seed=19) {
  const initial = newCampaign(seed,false);
  return campaignTransition(initial,{type:'open-map',revision:initial.revision});
}
function roundtrip(state: CampaignState) { assert.deepEqual(decodeSave(encodeSave(state)).state,state); }

test('all eight forward-only routes meet both mandatory gates and reach the exit', () => {
  const original = structuredClone(ROUTE_PREVIEW);
  validateDungeon(ROUTE_PREVIEW);
  const routes = allRoutes(ROUTE_PREVIEW);
  assert.equal(routes.length,8);
  for (const route of routes) {
    assert.equal(validDungeonPath(ROUTE_PREVIEW,route),true);
    for (const gate of ROUTE_PREVIEW.gates) assert.ok(route.includes(gate));
    assert.ok(route.indexOf(ROUTE_PREVIEW.gates[0]) < route.indexOf(ROUTE_PREVIEW.gates[1]));
  }
  assert.deepEqual(ROUTE_PREVIEW,original);
});
test('authoring validation rejects cycles, missing references, dead ends and bypassable gates', () => {
  const cases = [
    (m:any)=>m.nodes[0].next.push('missing'),
    (m:any)=>m.nodes[1].next.push(m.start),
    (m:any)=>m.nodes[2].next.splice(0),
    (m:any)=>m.nodes[1].next.push('route-story'),
    (m:any)=>m.nodes[0].next.splice(0,2,'route-teacher'),
    (m:any)=>m.nodes[1].id=m.nodes[0].id,
    (m:any)=>m.nodes[1].event='rest-preview',
    (m:any)=>m.gates.push('missing'),
    (m:any)=>m.gates.reverse(),
    (m:any)=>m.nodes[1].row=0,
  ];
  for(const mutate of cases){const map=structuredClone(ROUTE_PREVIEW);mutate(map);assert.throws(()=>validateDungeon(map));}
});
test('all routes complete through guarded campaign commands and save every map/destination boundary', () => {
  for (const route of allRoutes(ROUTE_PREVIEW)) {
    let state=enterMap();
    const profile=structuredClone(state.profile), claims=structuredClone(state.claimedRewards), rng=state.rng;
    roundtrip(state);
    for(const id of route.slice(1)) {
      const before=structuredClone(state);
      const command={type:'choose-node' as const,nodeId:id,revision:state.revision};
      state=campaignTransition(state,command);
      assert.equal(state.phase,'destination');
      assert.deepEqual(destinationEvent(ROUTE_PREVIEW,id),{type:nodeById(ROUTE_PREVIEW,id)!.event,nodeId:id,kind:nodeById(ROUTE_PREVIEW,id)!.kind});
      assert.equal(campaignTransition(state,command),state);
      assert.equal(campaignTransition(state,{...command,revision:state.revision}),state);
      assert.equal(campaignTransition(state,{type:'continue-route',nodeId:'wrong',revision:state.revision}),state);
      roundtrip(state);
      const resume={type:'continue-route' as const,nodeId:id,revision:state.revision};
      state=campaignTransition(state,resume);
      assert.equal(campaignTransition(state,resume),state);
      roundtrip(state);
      assert.deepEqual(before.profile,profile);
    }
    assert.equal(state.phase,'route-complete');
    assert.deepEqual(dungeonPath(ROUTE_PREVIEW,state.routeDecisions),route);
    assert.deepEqual(state.profile,profile); assert.deepEqual(state.claimedRewards,claims); assert.equal(state.salvage,0); assert.equal(state.rng,rng);
    const left=campaignTransition(state,{type:'leave-map',revision:state.revision});
    assert.equal(left.phase,'ready'); roundtrip(left);
    const reviewed=campaignTransition(left,{type:'open-map',revision:left.revision});
    assert.equal(reviewed.phase,'route-complete');
    assert.deepEqual(reviewed.routeDecisions,state.routeDecisions); roundtrip(reviewed);
  }
});
test('branch commitment rejects revisits, jumps, stale selections and repeat completion without rewards', () => {
  let state=enterMap();
  assert.equal(campaignTransition(state,{type:'choose-node',nodeId:'route-teacher',revision:state.revision}),state);
  assert.equal(campaignTransition(state,{type:'choose-node',nodeId:'route-ash-way',revision:0}),state);
  assert.equal(campaignTransition(state,{type:'leave-map',revision:state.revision}),state);
  state=campaignTransition(state,{type:'choose-node',nodeId:'route-ash-way',revision:state.revision});
  state=campaignTransition(state,{type:'continue-route',nodeId:'route-ash-way',revision:state.revision});
  const path=dungeonPath(ROUTE_PREVIEW,state.routeDecisions);
  assert.equal(nodeStatus(ROUTE_PREVIEW,path,'route-pressure-way'),'missed');
  assert.equal(nodeStatus(ROUTE_PREVIEW,path,'route-rest'),'reachable');
  assert.equal(nodeStatus(ROUTE_PREVIEW,path,'route-teacher'),'locked');
  assert.equal(nodeStatus(ROUTE_PREVIEW,path,'route-entry'),'visited');
  assert.equal(nodeStatus(ROUTE_PREVIEW,path,'route-ash-way'),'current');
  for(const id of ['route-entry','route-pressure-way','route-exit','missing']) assert.equal(campaignTransition(state,{type:'choose-node',nodeId:id,revision:state.revision}),state);
  assert.equal(campaignTransition(state,{type:'continue-route',nodeId:'route-ash-way',revision:state.revision}),state);
  assert.equal(campaignTransition(state,{type:'enter',nodeId:'kiln-checkpoint',revision:state.revision}),state);
});
test('route saves reject disconnected, bypassed, duplicated and half-completed history', () => {
  const raw=JSON.parse(encodeSave(enterMap()));
  for(const mutate of [
    (v:any)=>v.state.routeDecisions.push('route-story'),
    (v:any)=>v.state.routeDecisions.push('route-entry'),
    (v:any)=>v.state.dungeon.id='missing',
    (v:any)=>v.state.currentNode='route-exit',
    (v:any)=>v.state.completedNodes.push('route-ash-way'),
    (v:any)=>v.state.phase='route-complete',
    (v:any)=>v.state.dungeon.origin='complete',
  ]){const value=structuredClone(raw);mutate(value);assert.throws(()=>decodeSave(JSON.stringify(value)));}
});
test('v2 tutorial fixture migrates to v3 without altering lesson or requiring a map reset', () => {
  const raw=readFileSync(new URL('./fixtures/save-v2-tutorial.json',import.meta.url),'utf8');
  const old=JSON.parse(raw), migrated=decodeSave(raw);
  assert.equal(migrated.version,5);
  assert.deepEqual(migrated.state,{...old.state,dungeon:null,progression:null,systems:null});
  roundtrip(migrated.state);
});

test('finishing a checkpoint after route exploration cannot reopen it or refill resources through map review', () => {
  let state=enterMap();
  for(const nodeId of allRoutes(ROUTE_PREVIEW)[0].slice(1)){
    state=campaignTransition(state,{type:'choose-node',nodeId,revision:state.revision});
    state=campaignTransition(state,{type:'continue-route',nodeId,revision:state.revision});
  }
  state=campaignTransition(state,{type:'leave-map',revision:state.revision});
  state=campaignTransition(state,{type:'enter',nodeId:CHECKPOINT_NODE,revision:state.revision});
  for(let i=0;i<200&&!state.battle!.outcome;i++){
    const battle=state.battle!;
    const card=battle.hand.filter(c=>cardAvailability(battle,c).affordable).sort((a,b)=>(preview(battle,b).damage+preview(battle,b).block)-(preview(battle,a).damage+preview(battle,a).block))[0];
    state=campaignTransition(state,card?{type:'play',cardId:card.id,battleRevision:battle.revision,revision:state.revision}:{type:'end-turn',battleRevision:battle.revision,revision:state.revision});
    roundtrip(state);
  }
  assert.equal(state.battle!.outcome,'victory');
  state=campaignTransition(state,{type:'resolve',revision:state.revision});roundtrip(state);
  state=campaignTransition(state,{type:'claim',claimId:state.pendingReward!.id,revision:state.revision});roundtrip(state);
  const original=structuredClone(state);
  state=campaignTransition(state,{type:'open-map',revision:state.revision});roundtrip(state);
  state=campaignTransition(state,{type:'leave-map',revision:state.revision});roundtrip(state);
  assert.equal(state.phase,'complete');
  assert.deepEqual(state.profile,original.profile);
  assert.deepEqual(state.claimedRewards,original.claimedRewards);
  assert.equal(campaignTransition(state,{type:'enter',nodeId:CHECKPOINT_NODE,revision:state.revision}),state);
});
test('tutorial replay pauses a selected destination and cannot change its route choice', () => {
  let state=newCampaign(1);
  for(const step of LESSON_STEPS)state=campaignTransition(state,{type:'lesson',revision:state.revision,command:{step:state.tutorial!.step,revision:state.tutorial!.revision,action:step.action}});
  state=campaignTransition(state,{type:'choose-node',nodeId:'route-pressure-way',revision:state.revision});
  const before=structuredClone(state);
  state=campaignTransition(state,{type:'start-replay',revision:state.revision});
  for(const step of LESSON_STEPS){
    roundtrip(state);
    assert.equal(campaignTransition(state,{type:'choose-node',nodeId:'route-rest',revision:state.revision}),state);
    state=campaignTransition(state,{type:'lesson',revision:state.revision,command:{step:state.replay!.step,revision:state.replay!.revision,action:step.action}});
  }
  assert.equal(state.progression!.commands.length,before.progression!.commands.length+20);
  assert.deepEqual({...state,revision:before.revision,progression:{...state.progression!,commands:before.progression!.commands}},before);roundtrip(state);
});
test('v3 pending-destination fixture resumes the same branch and next fixed gate', () => {
  const saved=decodeSave(readFileSync(new URL('./fixtures/save-v3-route.json',import.meta.url),'utf8'));
  assert.equal(saved.state.phase,'destination');
  assert.equal(saved.state.currentNode,'route-discovery');
  const next=campaignTransition(saved.state,{type:'continue-route',nodeId:'route-discovery',revision:saved.state.revision});
  assert.equal(next.phase,'map');
  assert.equal(nodeStatus(ROUTE_PREVIEW,dungeonPath(ROUTE_PREVIEW,next.routeDecisions),'route-rest'),'missed');
  assert.equal(nodeStatus(ROUTE_PREVIEW,dungeonPath(ROUTE_PREVIEW,next.routeDecisions),'route-teacher'),'reachable');
  roundtrip(next);
});
