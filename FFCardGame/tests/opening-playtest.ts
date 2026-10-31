import { newCampaign } from '../client/src/game/campaign';
import { openingAction } from './fixtures/opening';
import { decodeSave, encodeSave } from '../client/src/persistence/campaign';

for(const style of ['aggressive','defensive','heat-aware'] as const)for(const itemId of ['heavy-gauntlet','layered-armor','quick-harness'] as const){
  let wins=0,totalHP=0,totalTurns=0,mpSpent=0,overloads=0,totalActions=0;
  for(let seed=1;seed<=32;seed++){
    const policy={seed,itemId,style,branches:seed%16};let state=newCampaign(seed,true,true,true);
    for(let action=0;action<900&&state.phase!=='complete';action++){
      const previous=state,next=openingAction(state,policy);totalActions++;
      if(next===state)break;
      if(previous.phase==='battle'&&next.battle&&next.battle.revision>previous.battle!.revision){
        if(!next.battle.practice)mpSpent+=Math.max(0,previous.battle!.mp-next.battle.mp);
        overloads+=Number(next.battle.log.at(-1)?.includes('OVERLOAD:'));
      }
      if(previous.phase==='battle'&&previous.battle!.outcome==='victory'&&next.phase==='reward')totalTurns+=previous.battle!.turn;
      state=next;
      if(state.phase==='reward')state=decodeSave(encodeSave(state)).state;
    }
    wins+=Number(state.phase==='complete');totalHP+=state.profile.hp;
  }
  console.log(JSON.stringify({scenario:'authored-opening',style,itemId,routes:32,wins,meanFinalHP:+(totalHP/32).toFixed(2),meanRouteBattleTurns:+(totalTurns/32).toFixed(2),meanTravelMPSpent:+(mpSpent/32).toFixed(2),meanOverloads:+(overloads/32).toFixed(2),meanActions:+(totalActions/32).toFixed(2)}));
  if(wins<28)throw Error(`Opening policy regression: ${style}/${itemId} ${wins}/32`);
}
