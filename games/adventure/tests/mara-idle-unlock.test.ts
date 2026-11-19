import assert from 'node:assert/strict';
import {test} from 'node:test';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadPack,renderPackFrame} from '../art/layered-rig.mjs';

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
