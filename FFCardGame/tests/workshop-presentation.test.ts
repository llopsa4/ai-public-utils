import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalogueItem, equipmentComparison } from '../client/src/game/workshop';
import { PROTOTYPE_PROFILE } from '../client/src/content/encounter';

test('catalogue comparisons use the owned upgraded item and preserve its source',()=>{
  const owned=[{id:'quick-harness',upgraded:true}];
  const item=catalogueItem(owned,'quick-harness');
  assert.deepEqual(item,owned[0]);assert.notEqual(item,owned[0]);
  const comparison=equipmentComparison(PROTOTYPE_PROFILE,item);
  assert.deepEqual(comparison.changed.find(value=>value.key==='opening'),{key:'opening',label:'Opening cards',before:5,after:7,lowerBetter:false});
  assert.equal(comparison.values.find(value=>value.key==='speed')!.after,4);
  assert.deepEqual(owned,[{id:'quick-harness',upgraded:true}]);
  assert.deepEqual(catalogueItem(owned,'heavy-gauntlet'),{id:'heavy-gauntlet'});
});

test('equipment comparison exposes attack-strain drawbacks and capped speed thresholds without resource changes',()=>{
  const before=structuredClone(PROTOTYPE_PROFILE);
  const heavy=equipmentComparison(PROTOTYPE_PROFILE,{id:'heavy-gauntlet'});
  assert.equal(heavy.changed.find(value=>value.key==='attackStrain')!.lowerBetter,true);
  assert.equal(heavy.changed.find(value=>value.key==='attackStrain')!.after,1);
  const kit=equipmentComparison(PROTOTYPE_PROFILE,{id:'insulated-kit'});
  assert.equal(kit.changed.find(value=>value.key==='maxMp')!.after,PROTOTYPE_PROFILE.maxMp+1);
  assert.deepEqual(PROTOTYPE_PROFILE,before);
});
