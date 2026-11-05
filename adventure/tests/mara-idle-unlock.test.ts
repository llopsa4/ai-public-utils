import assert from 'node:assert/strict';
import {test} from 'node:test';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadPack,renderPackFrame} from '../art/layered-rig.mjs';
import {DIALOGUES} from '../src/chapters/ch1/dialogue';
import {resolveNode} from '../src/engine/dialogue';
import {newGame} from '../src/engine/state';

test('idle uses the approved original standing bitmap independently of the walking master',()=>{
  for(const outfit of ['casual','light','medium']){
    const dir=`art/sources/characters/mara-${outfit}-layered`,file=dir+'/idle.png';
    assert.ok(existsSync(file),outfit+' original idle bitmap');
    const pack=loadPack(dir),idle=renderPackFrame(pack);
    const rigNeutral=renderPackFrame({...pack,idle:undefined});
    assert.notDeepEqual(idle.data,rigNeutral.data,'Idle must not use the articulated side-view neutral');
    const cfg=JSON.parse(readFileSync(dir+'/rig.json','utf8'));
    assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),cfg.idle.sha256);
  }
});

test('Oren unlocks medium armour with his initial gallery repair advice',()=>{
  const state=newGame();assert.ok(!state.kit.owned.includes('layered-armor'));
  const node=resolveNode(DIALOGUES.oren,DIALOGUES.oren.start,state);
  assert.equal(node.id,'before');
  assert.deepEqual((node as typeof node & {gear?:unknown}).gear,{give:['layered-armor'],equip:'layered-armor'});
});
