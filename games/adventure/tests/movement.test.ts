import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WalkArea } from '../src/engine/pathfinding';
import { directionalStep } from '../src/game/movement';
const rect = (x:number,y:number,w:number,h:number)=>[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
test('direct movement preserves speed on diagonals and stops for zero direction',()=>{
  const area=new WalkArea(rect(0,0,200,200)),from={x:50,y:50};
  for(const direction of [{x:1,y:0},{x:1,y:1},{x:-1,y:1}]){
    const at=directionalStep(area,from,direction,55);
    assert.ok(Math.abs(Math.hypot(at.x-from.x,at.y-from.y)-55)<1e-8);
  }
  assert.deepEqual(directionalStep(area,from,{x:0,y:0},55),from);
});
test('direct movement cannot tunnel through holes or leave a room, even with a long step',()=>{
  const area=new WalkArea(rect(0,0,200,200),[rect(70,40,3,30)]);
  const at=directionalStep(area,{x:50,y:50},{x:1,y:0},130);
  assert.ok(at.x<=70.75);assert.ok(area.contains(at));
  const edge=directionalStep(area,{x:180,y:120},{x:1,y:1},100);
  assert.ok(area.contains(edge));assert.ok(edge.x<=200.75);
});
