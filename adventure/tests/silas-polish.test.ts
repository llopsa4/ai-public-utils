import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { loadChapter } from '../src/chapters';
import { conditionsHold, pointInPolygon } from '../src/engine/geometry';
import { newGame } from '../src/engine/state';
import { parseSave, serializeSave } from '../src/engine/saveFile';
import { playerInputLocked } from '../src/engine/story';
import { debugFlags, debugItems } from '../src/engine/debugContent';
import { WalkArea } from '../src/engine/pathfinding';
import { enterStoryRoom } from './support/story-driver';

const intro=await loadChapter('intro');

test('the entire floor-wax hotspot takes priority over the table behind it',()=>{
 const s=newGame('intro');s.flags.cellLit=true;
 const pick=(x:number,y:number)=>intro.rooms.cell.hotspots.find(h=>conditionsHold(s,h.visibleIf)&&pointInPolygon({x,y},h.polygon))?.id;
 for(const x of [391,399,402,413])assert.equal(pick(x,318),'floorWax',`wax at ${x},318 must not select the table`);
 assert.equal(pick(445,277),'tableStub','the small candle stub takes priority too');
 s.flags.tookWax=true;assert.notEqual(pick(402,318),'floorWax','collected wax cannot be selected again');
});

test('the installed wax overlaps the approved reaching hand rather than its discarded placeholder position',()=>{
 const wax=intro.rooms.cell.objects.find(o=>o.id==='floorWax')!;
 assert.deepEqual({x:wax.x,y:wax.y},{x:402,y:320},'use the approved delivery’s contact point');
 const pose=PNG.sync.read(readFileSync(new URL('../art/src/intro/objects/silas-kneel-reach.png',import.meta.url)));
 const drop=PNG.sync.read(readFileSync(new URL('../art/src/intro/objects/floor-wax.png',import.meta.url)));
 const poseLeft=370*2-128,poseTop=325*2-254,dropLeft=wax.x*2-drop.width/2,dropTop=wax.y*2-drop.height;
 let contacts=0;
 for(let y=0;y<drop.height;y++)for(let x=0;x<drop.width;x++){
  const armX=dropLeft+x-poseLeft,armY=dropTop+y-poseTop;
  if(drop.data[(y*drop.width+x)*4+3]>0&&armX>=0&&armX<256&&armY>=0&&armY<256&&pose.data[(armY*pose.width+256+armX)*4+3]>0)contacts++;
 }
 assert.ok(contacts>0,'the split forearm actually touches the wax without stretching approved art');
 for(const cellOpen of [false,true]){
  const state=newGame('intro');state.flags={cellLit:true,...(cellOpen?{cellOpen:true}:{})};
  const step=intro.interact(state,'take','floorWax').find(c=>c.type==='walk');assert.equal(step?.type,'walk');
  if(step?.type==='walk'){
   const room=intro.rooms.cell,floor=room.walkableWhen?.find(w=>conditionsHold(state,w.if))?.walkable??room.walkable;
   assert.ok(new WalkArea(floor.outer,floor.holes).contains(step.to),'pickup approach remains on the correct walkable floor');
   assert.equal(step.face,cellOpen?'left':'right','outside the cage he faces back towards the restored wax');
  }
 }
});

test('current face-making hints describe wax and bread instead of discarded clay and bucket steps',()=>{
 for(const key of ['hint.i.face.1','hint.i.face.2']){
  assert.doesNotMatch(intro.strings[key],/clay|plaster|bucket/i);
  assert.match(intro.strings[key],/wax|tallow|candle/i);
 }
 assert.match(intro.strings['hint.i.face.2'],/crust|bread/i);
});

test('debug exposes active intro materials while old plaster values remain accepted in saves',()=>{
 const items=debugItems(intro),flags=debugFlags(intro);
 assert.ok(items.includes('wax')&&items.includes('putty'));
 for(const old of ['plaster','wetPlaster','hood','maskClerk'])assert.ok(!items.includes(old),`${old} is compatibility data, not a debug item`);
 assert.ok(!flags.includes('tookPlaster')&&!flags.includes('tookHood'));
 const old=newGame('intro');old.inventory=['plaster','wetPlaster','hood','maskClerk'];old.flags={tookPlaster:true,tookHood:true};
 const parsed=parseSave(serializeSave(old));assert.ok(parsed.ok);
 if(parsed.ok){assert.deepEqual(parsed.state.inventory,old.inventory);assert.deepEqual(parsed.state.flags,old.flags);}
});

test('meeting Sigrid reserves player input both before and after the remembered conversation',()=>{
 const s=newGame('intro');s.room='outerDoor';
 const locked=()=>playerInputLocked(intro.story,{state:s,room:intro.rooms[s.room],cold:false});
 assert.ok(locked(),'the encounter is reserved from arrival, before its first line');
 s.flags.metSigrid=true;assert.ok(locked(),'scripted departure remains reserved after the last line');
 s.room='cell';assert.ok(!locked(),'ordinary prison exploration stays available');
});

test('reloading after Sigrid has spoken resumes her departure and the reveal instead of free wandering',()=>{
 const s=newGame('intro');s.room='outerDoor';s.flags.metSigrid=true;
 const trace=enterStoryRoom(s);
 assert.equal(trace.stopped,'chooseChapter');assert.ok(trace.ended);
 assert.ok(trace.commands.some(c=>c.type==='step'&&c.actor==='sigrid'));
 assert.ok(!trace.commands.some(c=>c.type==='dialogue'),'the remembered conversation is not replayed');
});
