import test from 'node:test';
import assert from 'node:assert/strict';
import { mapPinSelection, mapTooltipPosition } from '../src/ui/chapterMapInteraction';

test('desktop chapter activation selects an unplayed chapter immediately and keeps played chapters disabled',()=>{
 assert.deepEqual(mapPinSelection(false),{activate:true});
 assert.deepEqual(mapPinSelection(true),{activate:false});
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
