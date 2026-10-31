import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LESSON_CLAIM, LESSON_STEPS, type LessonAction } from '../client/src/content/tutorial';
import { newTutorial, resetTutorial, tutorialAtStep, tutorialMatches, tutorialTransition } from '../client/src/game/tutorial';
import { campaignTransition, newCampaign } from '../client/src/game/campaign';
import { decodeSave, encodeSave } from '../client/src/persistence/campaign';
import { CHECKPOINT_NODE } from '../client/src/content/campaign';
import { cardAvailability, preview } from '../client/src/game/combat';
import { readFileSync } from 'node:fs';
import { finishRoute } from './fixtures/progression';

test('the real teaching battle follows its safe resource trace without granting invulnerability', () => {
  const expected: Record<number, number[]> = { 3: [60,24,2,10,1,0], 4: [60,24,1,10,1,5], 5: [60,24,3,10,1,0], 16: [60,8,1,6,5,6], 17: [60,8,3,6,5,0], 18: [60,0,2,6,8,0] };
  let state = newTutorial();
  assert.deepEqual(state.battle.hand.map(c=>c.id), ['strike-a','guard-a','shield-a','cycle-a','vent-a']);
  const initial = structuredClone(state);
  for (const step of LESSON_STEPS) {
    state = tutorialTransition(state, { action: step.action, step: state.step, revision: state.revision });
    assert.equal(tutorialMatches(state), true);
    const battle = state.battle;
    if (expected[state.step]) assert.deepEqual([battle.hero.hp,battle.enemy.hp,battle.energy,battle.mp,battle.strain,battle.hero.block], expected[state.step]);
    assert.equal([...battle.hand,...battle.draw,...battle.discard].length, 12);
    if (state.step < 18) assert.equal(battle.outcome, null);
    if (state.step === 5) assert.deepEqual(battle.hand.map(c=>c.id), ['pulse-a','piston-a','guard-b','strike-b','guard-c']);
    if (state.step === 17) assert.ok(battle.hand.some(c=>c.id === 'piston-b'));
  }
  assert.equal(state.battle.outcome, 'victory');
  assert.equal(state.battle.turn, 3);
  assert.equal(state.battle.revision, 6);
  assert.deepEqual(state.battleStart, initial.battleStart);
});
test('each step rejects unrelated, stale, repeated and premature combat actions', () => {
  const actions: LessonAction[] = [...LESSON_STEPS.map(s=>s.action), {type:'play',id:'shield-a'}, {type:'play',id:'cycle-a'}];
  for (let index=0; index<LESSON_STEPS.length; index++) {
    const state = tutorialAtStep(index), snapshot = structuredClone(state);
    for (const action of actions) {
      if (JSON.stringify(action) === JSON.stringify(LESSON_STEPS[index].action)) continue;
      assert.equal(tutorialTransition(state, {action,step:index,revision:state.revision}),state);
    }
    const command = { action: LESSON_STEPS[index].action, step:index, revision:state.revision };
    assert.equal(tutorialTransition(state,{...command,revision:state.revision+1}),state);
    assert.equal(tutorialTransition(state,{...command,step:index+1}),state);
    const next = tutorialTransition(state, command);
    assert.equal(tutorialTransition(next,command),next);
    assert.deepEqual(state,snapshot);
  }
  const broken = tutorialAtStep(2);
  broken.battle.enemy.hp = 1;
  assert.equal(tutorialMatches(broken),false);
  assert.equal(tutorialTransition(broken,{step:2,revision:2,action:{type:'play',id:'strike-a'}}),broken);
  const recovered = resetTutorial(broken);
  assert.equal(tutorialMatches(recovered),true);
  assert.deepEqual(recovered.battle,newTutorial().battle);
});
test('every step and modal round-trips atomically; first completion restores resources and rewards only once', () => {
  let campaign = newCampaign(19);
  assert.equal(campaign.phase,'tutorial');
  for (const step of LESSON_STEPS) {
    const restored = decodeSave(encodeSave(campaign)).state;
    assert.deepEqual(restored,campaign);
    const lesson = restored.tutorial!;
    const command = {type:'lesson' as const,revision:restored.revision,command:{step:lesson.step,revision:lesson.revision,action:step.action}};
    campaign = campaignTransition(restored,command);
    assert.notEqual(campaign,restored);
    assert.equal(campaignTransition(campaign,command),campaign);
  }
  assert.equal(campaign.phase,'map');
  assert.equal(campaign.guidedComplete,true);
  assert.equal(campaign.salvage,12);
  assert.equal(campaign.profile.hp,60); assert.equal(campaign.profile.mp,10);
  assert.deepEqual(campaign.claimedRewards,[LESSON_CLAIM]);
  assert.deepEqual(decodeSave(encodeSave(campaign)).state,campaign);
  assert.equal(campaignTransition(campaign,{type:'lesson',revision:campaign.revision,command:{step:18,revision:18,action:{type:'finish'}}}),campaign);
});
test('replay pauses the actual campaign without spending its resources, advancing it or granting rewards', () => {
  let state = newCampaign(3);
  for (const step of LESSON_STEPS) state=campaignTransition(state,{type:'lesson',revision:state.revision,command:{step:state.tutorial!.step,revision:state.tutorial!.revision,action:step.action}});
  state=finishRoute(state);
  state=campaignTransition(state,{type:'leave-map',revision:state.revision});
  state=campaignTransition(state,{type:'enter',nodeId:CHECKPOINT_NODE,revision:state.revision});
  const before=structuredClone(state);
  state=campaignTransition(state,{type:'start-replay',revision:state.revision});
  assert.deepEqual(state.replay,newTutorial());
  assert.equal(campaignTransition(state,{type:'end-turn',revision:state.revision,battleRevision:0}),state);
  for (const step of LESSON_STEPS) {
    state=decodeSave(encodeSave(state)).state;
    state=campaignTransition(state,{type:'lesson',revision:state.revision,command:{step:state.replay!.step,revision:state.replay!.revision,action:step.action}});
  }
  assert.equal(state.progression!.commands.length,before.progression!.commands.length+20);
  assert.deepEqual({...state,revision:before.revision,progression:{...state.progression!,commands:before.progression!.commands}},before);
  const restarting=campaignTransition(newCampaign(4),{type:'reset-lesson',revision:0});
  assert.equal(restarting.tutorial!.step,0);
  assert.equal(restarting.salvage,0);
  assert.equal(restarting.guidedComplete,false);
  assert.equal(campaignTransition(newCampaign(4),{type:'resolve',revision:0}).phase,'tutorial');
});
test('save validation rejects tutorial state mismatches, skipped completion and duplicate grants', () => {
  const original=JSON.parse(encodeSave(newCampaign(3)));
  for(const mutate of [
    (v:typeof original)=>{v.state.tutorial.step=18;},
    (v:typeof original)=>{v.state.tutorial.battle.energy=0;},
    (v:typeof original)=>{v.state.tutorial.battleStart.rng=1;},
    (v:typeof original)=>{v.state.guidedComplete=true;},
    (v:typeof original)=>{v.state.salvage=12;},
    (v:typeof original)=>{v.state.claimedRewards.push(LESSON_CLAIM);},
    (v:typeof original)=>{v.state.replay=v.state.tutorial;},
  ]){const value=structuredClone(original);mutate(value);assert.throws(()=>decodeSave(JSON.stringify(value)));}
});

test('version 1 checkpoints migrate without resetting active combat, pending claims or completion', () => {
  let state=newCampaign(19,false);
  const states=[structuredClone(state)];
  state=campaignTransition(state,{type:'enter',nodeId:CHECKPOINT_NODE,revision:state.revision});
  states.push(structuredClone(state));
  state=structuredClone(states[1]);
  while(!state.battle!.outcome){
    const battle=state.battle!;
    const card=battle.hand.filter(c=>cardAvailability(battle,c).affordable).sort((a,b)=>(preview(battle,b).damage+preview(battle,b).block)-(preview(battle,a).damage+preview(battle,a).block))[0];
    state=campaignTransition(state,card?{type:'play',cardId:card.id,battleRevision:battle.revision,revision:state.revision}:{type:'end-turn',battleRevision:battle.revision,revision:state.revision});
  }
  assert.equal(state.battle!.outcome,'victory');
  states.push(structuredClone(state));
  state=campaignTransition(state,{type:'resolve',revision:state.revision});
  states.push(structuredClone(state));
  state=campaignTransition(state,{type:'claim',claimId:state.pendingReward!.id,revision:state.revision});
  states.push(structuredClone(state));
  // Legacy loss/retry is preserved too; migration never infers training from hints.
  state=structuredClone(states[1]);
  while(!state.battle!.outcome) state=campaignTransition(state,{type:'end-turn',revision:state.revision,battleRevision:state.battle!.revision});
  assert.equal(state.battle!.outcome,'defeat');
  states.push(structuredClone(state));
  for(const current of states){
    const {tutorial:_t,replay:_r,guidedComplete:_g,salvage:_s,dungeon:_d,progression:_p,systems:_x,...legacy}=current;
    const migrated=decodeSave(JSON.stringify({version:1,contentVersion:'systems-preview-1',savedAt:'2026-10-31T12:00:00.000Z',state:legacy}));
    assert.equal(migrated.version,6);
    assert.deepEqual(migrated.state,current);
    assert.equal(migrated.state.guidedComplete,false);
  }
});

test('lesson saves accept reordered JSON keys and retain recovery after a deliberate restart', () => {
  let state=newCampaign(19);
  for(const step of LESSON_STEPS.slice(0,5))state=campaignTransition(state,{type:'lesson',revision:state.revision,command:{step:state.tutorial!.step,revision:state.tutorial!.revision,action:step.action}});
  const envelope=JSON.parse(encodeSave(state));
  envelope.state.tutorial.battle=Object.fromEntries(Object.entries(envelope.state.tutorial.battle).reverse());
  assert.deepEqual(decodeSave(JSON.stringify(envelope)).state,state);
  state=campaignTransition(state,{type:'reset-lesson',revision:state.revision});
  assert.deepEqual(decodeSave(encodeSave(state)).state,state);
  assert.equal(state.tutorial!.step,0);
  assert.deepEqual(state.tutorial!.battle,newTutorial().battle);
});

test('version 2 modal fixture resumes its required Cancel without changing combat', () => {
  const fixture=decodeSave(readFileSync(new URL('./fixtures/save-v2-tutorial.json',import.meta.url),'utf8'));
  assert.deepEqual(fixture.state.tutorial,tutorialAtStep(14));
  const before=fixture.state.tutorial!.battle;
  const next=campaignTransition(fixture.state,{type:'lesson',revision:fixture.state.revision,command:{step:14,revision:14,action:{type:'close',dialog:'restart'}}});
  assert.deepEqual(next.tutorial!.battle,before);
  assert.equal(next.tutorial!.step,15);
});
