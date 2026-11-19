import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {test} from 'node:test';
import sharp from 'sharp';
import {MANIFEST} from '../art/manifest.mjs';
import {ALL_GEAR,BASIC_WEAR,STARTING_OWNED} from '../src/content/kit';
import {OREN_SPARES} from '../src/chapters/ch1/combat';
import {DIALOGUES} from '../src/chapters/ch1/dialogue';

// Follow actual rewards instead of maintaining another list that can omit newly obtainable gear.
const chapterOneGear=[...new Set([
  ...STARTING_OWNED,...OREN_SPARES,
  ...Object.values(DIALOGUES).flatMap(tree=>Object.values(tree.nodes).flatMap(node=>node.gear?.give??[])),
  ...Object.values(BASIC_WEAR).map(piece=>piece.id),
])];

test('all equippable base gear, including debug and later-game pieces, has an image',()=>{
  for(const id of ALL_GEAR){
    assert.ok(MANIFEST.some(e=>e.id===`equipment-${id}`),id+' needs a manifest entry');
    assert.ok(existsSync(`art/src/kc/equipment/${id}.webp`),id+' needs a gear illustration');
  }
});

test('every Chapter 1 obtainable gear piece has a dedicated illustration manifest entry',()=>{
  for(const id of chapterOneGear){
    const entry=MANIFEST.find(e=>e.id===`equipment-${id}`);
    assert.ok(entry,`${id}: missing gear illustration manifest entry`);
    assert.equal(entry.kind,'equipment',id);
    assert.equal(entry.file,`kc/equipment/${id}.webp`,id);
  }
});

test('every Chapter 1 obtainable gear picture exists at its gear-screen resolution',async()=>{
  for(const id of chapterOneGear){
    const file=`art/src/kc/equipment/${id}.webp`;
    assert.ok(existsSync(file),`${id}: gear screen would fall back to a line icon`);
    const {width,height}=await sharp(file).metadata();
    assert.deepEqual([width,height],[320,320],`${id}: gear-screen illustration size`);
  }
});
