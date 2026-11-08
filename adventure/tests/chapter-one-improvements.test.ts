import assert from 'node:assert/strict';
import {test} from 'node:test';
import {newGame} from '../src/engine/state';
import {parseSave,serializeSave} from '../src/engine/saveFile';
import {operateRegulator,regulatorStage,ashwaysFinale,CONCERNS} from '../src/chapters/ch1/progression';
import {interact} from '../src/chapters/ch1/interactions';
import {CH1} from '../src/chapters/ch1';
import {DIALOGUES} from '../src/chapters/ch1/dialogue';
import {applyDialogueEffects,resolveNode} from '../src/engine/dialogue';
import {ENCOUNTERS} from '../src/chapters/ch1/combat';
import {cardAvailability,currentIntent,preview,playCard,endTurn} from '../src/combat/combat';
import {startBattle} from '../src/engine/kit';
import {interactStory,runStoryCommands,enterStoryRoom} from './support/story-driver';

test('dressing and bread collection can precede conversations; errands still control the alarm in every order',()=>{
  const permutations=<T,>(a:T[]):T[][]=>a.length?a.flatMap((x,i)=>permutations(a.filter((_,j)=>j!==i)).map(rest=>[x,...rest])):[[]];
  for(const order of permutations(['hoist','food','latch'])){
    const s=newGame();
    interactStory(s,'open','chest');assert.ok(s.flags.dressed);
    interactStory(s,'take','rack');
    s.room='firingHouse';interactStory(s,'take','breadBasket');assert.ok(s.inventory.includes('loaf'));
    assert.equal(s.flags.breadAsked,undefined);
    let alarmCount=0;
    order.forEach((task,i)=>{
      s.room=task==='hoist'?'maraRoom':'firingHouse';
      const trace=task==='hoist'?interactStory(s,'use','pulleys'):task==='food'?interactStory(s,'use','soup','loaf'):interactStory(s,'use','pantryDoor','gauntlet');
      alarmCount+=trace.commands.filter(c=>c.type==='setFlag'&&c.flag==='alarm').length;
      assert.equal(!!s.flags.alarm,i===2,order.join(','));
      if(i===2)assert.equal(trace.spoken.includes('line.orenCalls'),s.room==='firingHouse');
    });
    assert.equal(alarmCount,1);
    interactStory(s,'use','pulleys');assert.equal(alarmCount,1);
  }
});

test('regulator accepts both bolt orders, blocks unsafe actions and preserves all stages through saves',()=>{
  for(const order of [['left','right'],['right','left']] as const){
    let s=newGame();
    assert.equal(operateRegulator(s.flags,'ring'),'puzzle.needBolts');
    assert.equal(operateRegulator(s.flags,'vent'),'puzzle.needBolts');
    for(const action of [...order,'vent','ring'] as const){
      operateRegulator(s.flags,action);
      const loaded=parseSave(serializeSave(s));assert.ok(loaded.ok);s=loaded.state;
    }
    assert.equal(regulatorStage(s.flags),'done');
    assert.equal(operateRegulator(s.flags,'ring'),'puzzle.done');
  }
});

test('shutdown requires an explicit puzzle result and cancellation cannot remove the regulator',()=>{
  const s=newGame();s.room='gallery';s.inventory=['gauntlet','notebook'];
  Object.assign(s.flags,{hasGauntlet:true,hasNotebook:true,patchFailed:true,decided:true,procedureKnown:true,protectionPrepared:true});
  assert.throws(()=>interactStory(s,'use','regulator','gauntlet'),/Puzzle fixture required/);
  const canceled=interactStory(s,'use','regulator','gauntlet',{fixtures:{puzzle:()=> 'interrupted'}});
  assert.equal(canceled.stopped,'interrupted');assert.equal(s.flags.kilnCold,undefined);assert.ok(!s.inventory.includes('regulator'));
  const done=interactStory(s,'use','regulator','gauntlet',{fixtures:{puzzle:()=> 'completed',fight:()=> 'won'}});
  assert.ok(s.flags.kilnCold&&s.flags.fought&&s.flags.galleryQuiet);
  assert.ok(done.spoken.includes('line.quietKiln'));
  assert.ok(!enterStoryRoom(s).spoken.includes('line.quietKiln'));
});

test('the first concern alone controls later reassurance and notebook reflection',()=>{
  for(const first of CONCERNS){
    const s=newGame();s.flags.patchFailed=true;
    applyDialogueEffects(s,resolveNode(DIALOGUES.oren,first,s));
    applyDialogueEffects(s,resolveNode(DIALOGUES.oren,CONCERNS.find(c=>c!==first)!,s));
    assert.equal(CONCERNS.filter(c=>s.flags[`concern-${c}`]).length,1);
    s.flags.decided=true;
    assert.deepEqual(CH1.reflections!(s),[`note.concern.${first}`]);
  }
  const old=newGame();old.flags.decided=true;assert.deepEqual(CH1.reflections!(old),['note.concern.neutral']);
});

test('Tobi can initiate the shared farewell and the reminder stays optional and single-use',()=>{
  const s=newGame();s.room='firingHouse';s.flags.kilnCold=true;s.inventory=['regulator'];
  const back=interactStory(s,'go','kilnGate',undefined,{fixtures:{farewell:()=> 'return'}});
  assert.equal(back.stopped,'interrupted');assert.equal(s.room,'firingHouse');assert.ok(s.flags.farewellReminded);
  interactStory(s,'talk','tobi');
  interactStory(s,'talk','nell');
  assert.deepEqual(s.inventory.filter(i=>i==='bread'||i==='scarf'),['bread','scarf']);
  assert.ok(s.flags.gotScarf&&s.flags.gotBread);
  interactStory(s,'go','kilnGate');assert.equal(s.room,'ashways');
  const leave=newGame();leave.room='firingHouse';leave.inventory=['regulator'];
  interactStory(leave,'go','kilnGate',undefined,{fixtures:{farewell:()=> 'leave'}});
  assert.equal(leave.room,'ashways');assert.equal(leave.flags.gotScarf,undefined);
});

test('Ashways preserves the valve solution, resumes after the explosion and cannot end before boss victory',()=>{
  const s=newGame();s.room='ashways';
  assert.equal(interact(s,'go','passage').some(c=>c.type==='end'),false);
  s.flags.valveVented=true;
  const interrupted=interactStory(s,'go','passage',undefined,{fixtures:{fight:()=> 'interrupted'}});
  assert.equal(interrupted.ended,false);assert.ok(s.flags.ashwaysExploded);assert.equal(s.flags.ashwaysWon,undefined);
  const loaded=parseSave(serializeSave(s));assert.ok(loaded.ok);
  const resumed=ashwaysFinale(loaded.state.flags);
  assert.equal(resumed.some(c=>c.type==='ashwaysBeat'&&c.phase==='rupture'),false);
  const won=enterStoryRoom(loaded.state,{fixtures:{fight:()=> 'won'}});
  assert.ok(won.ended);assert.ok(loaded.state.flags.ashwaysWon&&loaded.state.flags.ashwaysAftermath);
  assert.equal(ashwaysFinale(loaded.state.flags).some(c=>c.type==='fight'),false);
});

test('version 9 progress migrates without inventing a concern or rewinding a completed shutdown',()=>{
  const s=newGame();Object.assign(s.flags,{hasGauntlet:true,kilnCold:true,gearChecked:true});
  const save=JSON.parse(serializeSave(s));save.version=9;
  const loaded=parseSave(JSON.stringify(save));assert.ok(loaded.ok);
  assert.ok(loaded.state.flags.hoistHelped&&loaded.state.flags.nellFed&&loaded.state.flags.galleryQuiet);
  assert.equal(regulatorStage(loaded.state.flags),'done');
  assert.equal(CONCERNS.some(c=>loaded.state.flags[`concern-${c}`]),false);
  assert.equal(loaded.state.flags.ashwaysWon,undefined);
});

test('the boss has the agreed telegraphed pressure cycle and no repeat tutorial commands',()=>{
  assert.equal(ENCOUNTERS.ashwaysBoss.enemy.maxHp,52);
  assert.deepEqual(ENCOUNTERS.ashwaysBoss.enemy.intents.map(i=>[i.name,i.damage,i.block]),[
    ['Pressure winding',0,4],['Brush surge',12,0],['Motor stall',0,0],
  ]);
  const s=newGame();
  assert.throws(()=>runStoryCommands(s,[{type:'regulatorPuzzle'}]),/Puzzle fixture required/);
  assert.throws(()=>runStoryCommands(s,[{type:'farewellReminder'}]),/Farewell fixture required/);
});

test('a player reading the boss intent can win with starter cards and either Chapter 1 armour',()=>{
  for(const armor of ['patched-coat','layered-armor'] as const)for(const seed of [1,17,42,109]){
    const s=newGame();s.kit.equipment={...s.kit.equipment,armor:{id:armor}};
    let b=startBattle(s,ENCOUNTERS.ashwaysBoss,seed);
    for(let turn=0;turn<25&&!b.outcome;turn++){
      for(let action=0;action<30&&!b.outcome;action++){
        const need=Math.max(0,currentIntent(b).damage-b.hero.block);
        const choices=b.hand.filter(c=>cardAvailability(b,c).affordable).map(c=>{
          const p=preview(b,c);
          return {c,score:p.hpDamage*1.5+Math.min(need,p.block)*2+(b.strain>=6?Math.max(0,-p.strainDelta):0)-(p.overload?6:0)};
        }).sort((a,z)=>z.score-a.score);
        if(!choices.length||choices[0].score<=0)break;
        const next=playCard(b,choices[0].c.id);if(next===b)break;b=next;
      }
      if(!b.outcome)b=endTurn(b);
    }
    assert.equal(b.outcome,'victory',`${armor}, seed ${seed}`);
  }
});
