import test from 'node:test';
import assert from 'node:assert/strict';
import { mapPinSelection, mapTooltipPosition } from '../src/ui/chapterMapInteraction';

test('touch previews a chapter before selecting it; hover or keyboard focus cannot count as its first tap',()=>{
 const first=mapPinSelection(null,'kofi1',false,'touch');
 assert.deepEqual(first,{preview:'kofi1',activate:false});
 assert.deepEqual(mapPinSelection(first.preview,'kofi1',false,'touch'),{preview:'kofi1',activate:true});
 assert.deepEqual(mapPinSelection(first.preview,'ch1',false,'touch'),{preview:'ch1',activate:false});
 assert.equal(mapPinSelection(null,'ch1',false,'keyboard').activate,true);
 assert.equal(mapPinSelection(null,'ch1',false,'pointer').activate,true);
 assert.equal(mapPinSelection('intro','intro',true,'touch').activate,false);
 assert.equal(mapPinSelection(null,'intro',true,'keyboard').activate,false);
});

test('map tooltip stays completely inside its frame and flips below high pins',()=>{
 const bounds={width:320,height:224},tip={width:220,height:100};
 for(const anchor of [{x:0,y:0,width:20,height:30},{x:300,y:0,width:20,height:30},{x:0,y:194,width:20,height:30},{x:300,y:194,width:20,height:30}]){
  const box=mapTooltipPosition(bounds,anchor,tip);
  assert.ok(box.x>=8&&box.y>=8);
  assert.ok(box.x+tip.width<=bounds.width-8);
  assert.ok(box.y+tip.height<=bounds.height-8);
 }
 assert.ok(mapTooltipPosition(bounds,{x:140,y:0,width:20,height:30},tip).y>=38);
 assert.ok(mapTooltipPosition(bounds,{x:140,y:194,width:20,height:30},tip).y<194);
});
