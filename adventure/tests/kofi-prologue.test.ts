import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { loadChapter, setChapter } from '../src/chapters';
import { newGame } from '../src/engine/state';
import { conditionsHold } from '../src/engine/geometry';
import { serializeSave, parseSave } from '../src/engine/saveFile';
import { TABLES } from '../src/engine/i18n';
import { WalkArea } from '../src/engine/pathfinding';
import { enterStoryRoom, runStoryCommands } from './support/story-driver';
import type { GameState, Verb } from '../src/engine/types';
import { I } from '../src/chapters/kofi1/data';
import { BOW_DRAW_FRAME, BOW_DRAW_HOLD_MS, BOW_DRAW_SHEET } from '../src/chapters/kofi1/bow';
import { MANIFEST } from '../art/manifest.mjs';
import { advance } from '../src/chapters/kofi1/interactions';
import { newArchery, archeryTurn, actionAvailable, intent } from '../src/combat/archery';
import { openChapters } from '../src/engine/unlock';
import { diary, dayLine } from '../src/ui/journalData';

const chapter=await loadChapter('kofi1');
type Route={survivor:'enali'|'deyu';wolf:'kill'|'release';bear:'kill'|'release';request?:boolean;rigFirst?:boolean};
function driver(route:Route){
 let state=newGame('kofi1');
 const spoken:string[]=[];const snapshots:GameState[]=[];
 const options={fixtures:{fight:()=> 'won' as const},choose:(next:(string|null)[],node:{id:string})=>{
  const chosen=node.id==='start'&&next.includes('enali')?route.survivor:next.includes('kill')?(state.room==='camp'?route.wolf:route.bear):next[0];
  return chosen;
 }};
 function save(){const parsed=parseSave(serializeSave(state));assert.equal(parsed.ok,true,JSON.stringify(parsed));if(parsed.ok){assert.deepEqual(parsed.state.flags,state.flags);state=parsed.state;}snapshots.push(structuredClone(state));}
 function click(target:string,verb:Verb='use',item?:string,choice?:string|null){
  const spot=chapter.rooms[state.room].hotspots.find(h=>h.id===target&&conditionsHold(state,h.visibleIf));
  assert.ok(target.startsWith('item:')||spot,`${state.room}/${target} must be visible`);
  assert.ok(item||target.startsWith('item:')||spot?.verbs.includes(verb),`${target} offers ${verb}`);
  const before=structuredClone(state);
  const commands=chapter.interact(state,verb,target,item?I(item):undefined);
  assert.deepEqual(state,before,'interaction must not mutate state');
  const trace=runStoryCommands(state,commands,{...options,...(choice!==undefined?{choose:(next:(string|null)[])=>{assert.ok(next.includes(choice),`choice ${choice} is offered: ${next}`);return choice;}}:{})});
  spoken.push(...trace.spoken);
  for(const key of trace.spoken)assert.ok(TABLES.en[key],`missing text ${key}`);
  save();return trace;
 }
 enterStoryRoom(state,options);
 return {get state(){return state;},click,save,spoken,snapshots};
}
type Driver=ReturnType<typeof driver>;
function opening(d:Driver,order=['gate','pot','hens']){
 for(const errand of order){
  if(errand==='gate'){d.click('deyu','talk');d.click('gate','use','pin');d.click('bell','take');}
  if(errand==='pot'){d.click('enali','talk');d.click('cloth','take');d.click('pot','use','cloth');d.click('trestle','use','hotPot');}
  if(errand==='hens'){d.click('ahyeli','talk');d.click('scoop','take');d.click('coop','use','grain');d.click('coop','close');d.click('hook','use','grain');}
 }
 assert.ok(d.state.flags.warning);
}
function water(d:Driver,survivor:string){
 if(survivor==='enali'){
  d.click('mud','look');d.click('seep','look');d.click('enali','talk');d.click('trough','look');d.click('trough','take');d.click('bundle','take');
  d.click(`item:${I('trough')}`,'use','strips');d.click('seep','use','trough');d.click('shore','take');d.click('seep','use','stone');d.click('screen','take');d.click('seep','use','screen');
 }else{
  d.click('deyu','talk');d.click('trough','take');d.click('tracks','look');d.click('twig','take');d.click('leaves','use','twig');d.click('seep','look');d.click('mud','look');d.click('saluna','talk');d.click('seep','use','trough');
 }
 d.click('pot','take');d.click('seep','use','pot');d.click('fire','use','pot');assert.ok(d.state.flags.waterDone);
}
function build(d:Driver,rigFirst=false){
 d.click('saluna','talk');d.click('sheath','take');d.click('huska','use','sheath');d.click('search');d.click('axe','take');
 const rig=()=>{d.click('cord','take');d.click(`item:${I('arrows')}`,'use','cord');d.click('toClearing','go');d.click('fork','use','lineArrow');d.click('bark','use','axe');d.click('board');d.click('rig','use','rope');d.click('cradle');d.click('toRiver','go');};
 if(rigFirst)rig();
 d.click('mature','use','axe');d.click('sledge','use','reeds');d.click('clay','take');d.click('sledge','use','clay');d.click('browse','take');d.click('bowl','use','browse');d.click('tohani','talk');d.click('lead');
 d.click('frame','use','reeds');d.click('washing','take');d.click('mix','use','washPot');d.click('frame','use','daub');
 if(!rigFirst)rig();
 d.click('saluna','talk');assert.ok(d.state.flags.built);assert.equal(d.state.room,'river');
}
function rite(d:Driver){
 d.click('oweli','talk','', 'request');
 const offerings={stone:()=>{d.click('riteStone','take');d.click('riverOffering','use','riteStone');},branch:()=>{d.click('toClearing','go');d.click('platform','take');d.click('toRiver','go');d.click('treeOffering','use','riteBranch');},feather:()=>{d.click('ahyeli','talk');d.click('animalOffering','use','feather');},bell:()=>{d.click('homeOffering','use','bell');}};
 for(const key of d.state.flags.enaliSaved?['bell','branch','stone','feather'] as const:['stone','feather','branch','bell'] as const)offerings[key]();
 d.click('circle','use','',null);assert.ok(!d.state.flags.riteSpoken,'Not yet leaves all four offerings in place');
 d.click('circle');assert.ok(d.state.flags.riteSpoken);
 const riteFlags={...d.state.flags};d.click('oweli','talk');assert.deepEqual(d.state.flags,riteFlags,'completed rite cannot replay or rewrite its choices');
 d.click('saluna','talk','',null);assert.ok(!d.state.flags.riteDone,'accepting leadership remains an explicit choice');
 d.click('saluna','talk');assert.ok(d.state.flags.riteDone);assert.ok(d.state.inventory.includes(I('bell')));
}
const disputeOrders=[['garden','watch','huts'],['garden','huts','watch'],['watch','garden','huts'],['watch','huts','garden'],['huts','garden','watch'],['huts','watch','garden']];
function settlement(d:Driver,order=disputeOrders[0]){
 d.click('gap','look');d.click('doors','look');d.click('toClearing','go');d.click('board','look');d.click('ladder','look');d.click('toRiver','go');
 for(const [who,topics] of Object.entries({tohani:['garden','watch'],saluna:['garden','watch','huts'],ahyeli:['watch','huts'],oweli:['watch','huts'],[d.state.flags.enaliSaved?'enali':'deyu']:['watch']}))for(const topic of topics)d.click(who,'talk','',topic);
 for(const who of ['lateVolunteer','waterVolunteer','breakfastVolunteer'])d.click(who,'talk');
 d.click('rack','take');
 const tasks:Record<string,()=>void>={
  garden:()=>{d.click('gardenPlan','use','', 'fence');d.click('gardenPlan','use','', 'gate');d.click('gap','use','panel');d.click('gap','use','hingeCord');d.click('gap','use','latch');},
  watch:()=>{d.click('watchPlan','use','', 'equal');d.click('watchPlan','use','', 'shared');d.click('toClearing','go');d.click('board');d.click('toRiver','go');},
  huts:()=>{d.click('hutPlan','use','', 'lots');d.click('hutPlan','use','', 'choice');d.click('doors','use','braces');d.click('ahyeli','talk','', 'practice');d.click('toClearing','go');d.click('ladder','use','handRope');d.click('practice');d.click('toRiver','go');},
 };
 for(const task of order)tasks[task]();
 d.click('rack');assert.ok(d.state.flags.hunting);
}
function forest(d:Driver){
 d.click('toForest','go');d.click('return','go');d.click('toRiver','go');d.click('rack');d.click('toForest','go');
 d.click('log','look');d.click('vine','use','knife');d.click('limb');d.click('huska','talk');assert.ok(d.state.flags.home);assert.equal(d.state.room,'hut');
}
function hut(d:Driver,request=false){
 d.click('beam','look');d.click('pole','take');d.click('wedge','take');d.click('beam','use','pole');
 d.click('hearth','look');assert.equal(d.state.flags.beamRaised,undefined,'another action lowers the lever safely');assert.ok(d.state.inventory.includes(I('wedge')));
 d.click('sill','use','pole');d.click('beam','use','wedge');d.click('drawcord');d.click('nets');
 if(request){d.click('gap');d.click('gap');assert.ok(!d.state.flags.arrowRetrieved,'a repeated request never forces retrieval');}
 d.click('bedroll');d.click('arrow','take');const end=d.click('shelf','use','arrow');assert.ok(end.ended);assert.ok(d.state.flags.complete&&d.state.flags.beamSupported);assert.ok(!d.state.inventory.includes(I('wedge')));
}

for(const survivor of ['enali','deyu'] as const)for(const wolf of ['kill','release'] as const)for(const bear of ['kill','release'] as const){
 test(`Kofi complete playable route: ${survivor}, wolf ${wolf}, bear ${bear}; save every action`,()=>{
  setChapter('kofi1');const d=driver({survivor,wolf,bear});opening(d);
  d.click('coop','open');d.click('inland','go');assert.equal(d.state.room,'camp');
  assert.ok(d.state.flags.bowExplained&&d.state.flags.bowUnfolded,'the camp explains and demonstrates the folding bow on both survivor routes');
  d.click('deadBough','use','bluntArrow');d.click('tohani','talk');d.click('branch','take');
  if(wolf==='kill'){d.click('fire','use','branch');d.click('huska','talk');}else{d.click('huska','talk');d.click('fire','use','branch');}
  d.click(survivor,'talk','', 'question');d.click('trail','go');assert.equal(d.state.room,'river');
  const routeIndex=(survivor==='deyu'?4:0)+(wolf==='release'?2:0)+(bear==='release'?1:0);
  water(d,survivor);build(d,bear==='kill');rite(d);settlement(d,disputeOrders[routeIndex%6]);forest(d);hut(d,wolf==='kill');
  assert.equal(!!d.state.flags.enaliSaved,survivor==='enali');assert.equal(!!d.state.flags.deyuSaved,survivor==='deyu');
  assert.equal(!!d.state.flags.wolfKilled,wolf==='kill');assert.equal(!!d.state.flags.bearKilled,bear==='kill');
  assert.equal(d.state.inventory.length,1,'only the belt bell remains');
  assert.match(dayLine(chapter),/^Four years ago/);assert.equal(diary(d.state)[0].label,'Four years ago');
  for(const saved of d.snapshots.filter(s=>s.flags.escaped))for(const room of Object.values(chapter.rooms))assert.ok(!room.hotspots.some(h=>h.id===(survivor==='enali'?'deyu':'enali')&&conditionsHold(saved,h.visibleIf)),'dead neighbour stays absent');
 });
}
test('opening errands work in all six orders; rescue inspections and Keep looking never select a survivor',()=>{
 for(const order of [['gate','pot','hens'],['gate','hens','pot'],['pot','gate','hens'],['pot','hens','gate'],['hens','gate','pot'],['hens','pot','gate']]){
  const d=driver({survivor:'enali',wolf:'release',bear:'release'});opening(d,order);d.click('enaliRescue','look');d.click('deyuRescue','talk');d.click('coop','open');d.click('inland','go','',null);
  // Separate direct driver uses null to choose Keep looking.
  const s=newGame('kofi1');s.flags={warning:true,hensFreed:true};
  runStoryCommands(s,chapter.interact(s,'go','inland'),{choose:()=>null});assert.ok(!s.flags.enaliSaved&&!s.flags.deyuSaved);assert.equal(s.room,'tsalohi');
 }
});
test('all prologue targets have reachable approaches, unique visible bounds and registered text',()=>{
 for(const room of Object.values(chapter.rooms)){
  const area=new WalkArea(room.walkable.outer,room.walkable.holes);
  for(const p of [...Object.values(room.entries),...room.hotspots.flatMap(h=>h.walkTo?[h.walkTo]:[])])assert.ok(area.contains(p));
  for(const h of room.hotspots)assert.ok(TABLES.en[h.name]);
 }
 const stage=newGame('kofi1');
 for(const milestone of ['', 'warning','escaped','campDone','waterDone','built','riteDone','hunting','home']){
  if(milestone)stage.flags[milestone]=true;
  for(const room of Object.values(chapter.rooms)){
   const visible=room.hotspots.filter(h=>conditionsHold(stage,h.visibleIf));
   assert.equal(new Set(visible.map(h=>JSON.stringify(h.polygon))).size,visible.length,`${room.id}/${milestone}: active targets must not overlap`);
  }
 }
 for(const key of chapter.objectiveKeys){assert.ok(TABLES.en[key]);for(const level of [1,2])assert.ok(TABLES.en[`hint.${key.slice(4)}.${level}`],`${key} hint ${level}`);}
 assert.ok(openChapters(['intro', 'ch1']).includes('kofi1'));
});
test('archery announces charge; aimed setup spends no arrow and can be cancelled; no-ammo defence and recovery stay available',()=>{
 let s=newArchery('bear');s=archeryTurn(s,'aim');assert.equal(s.arrows,6);assert.equal(s.threat,28);assert.ok(s.aiming);assert.match(intent(s).name,/Charge/);
 s=archeryTurn(s,'step');assert.equal(s.arrows,6);assert.ok(!s.aiming);assert.match(s.log,/cancelled/);
 s={...newArchery('wolves'),arrows:0,spent:6};assert.ok(!actionAvailable(s,'shot'));assert.ok(actionAvailable(s,'step'));assert.ok(actionAvailable(s,'gather'));assert.equal(archeryTurn(s,'gather').arrows,6);
 for(const animal of ['wolves','bear'] as const){let battle=newArchery(animal);for(let n=0;n<40&&battle.outcome==='active';n++)battle=archeryTurn(battle,battle.arrows?'shot':'gather');assert.equal(battle.outcome,'won');}
});
test('pending rescue, camp, bear and final checkpoints resume without reopening a committed choice',()=>{
 for(const [room,flags,expected] of [
  ['tsalohi',{warning:true,hensFreed:true,enaliSaved:true,escaped:true},'camp'],
  ['camp',{escaped:true,enaliSaved:true,wolvesWon:true,wolfReleased:true,campDone:true},'river'],
  ['forest',{escaped:true,enaliSaved:true,bearWon:true,bearReleased:true,home:true},'hut'],
 ] as const){
  const s=newGame('kofi1');s.room=room;Object.assign(s.flags,flags);runStoryCommands(s,advance(s));assert.equal(s.room,expected);assert.ok(!s.flags.deyuSaved&&!s.flags.wolfKilled&&!s.flags.bearKilled);
 }
 const s=newGame('kofi1');s.room='hut';s.flags={home:true,complete:true};assert.ok(runStoryCommands(s,advance(s)).ended,'reload on final checkpoint returns to selection');
});
test('premature social proposals, wrong tool uses and unprepared hunting preserve progress and materials',()=>{
 const s=newGame('kofi1');s.room='river';s.flags={warning:true,escaped:true,campDone:true,waterDone:true,built:true,riteDone:true,enaliSaved:true};s.inventory=[I('bell'),I('panel')];
 for(const target of ['gardenPlan','watchPlan','hutPlan','rack']){const before=structuredClone(s);runStoryCommands(s,chapter.interact(s,'use',target),{choose:()=>{throw new Error('proposal opened before listening');}});assert.deepEqual({...s,hero:before.hero},before,'walking to a concern cannot advance it');}
 const before=structuredClone(s);runStoryCommands(s,chapter.interact(s,'use','gap',I('panel')));assert.deepEqual({...s,hero:before.hero},before);
 s.flags.boardSeen=true;
 for(const flag of ['watchTohani','watchSaluna','watchAhyeli','watchOweli','watchSurvivor','watchLate','watchWater'])s.flags[flag]=true;
 runStoryCommands(s,chapter.interact(s,'use','watchPlan'),{choose:()=>{throw new Error('missing breakfast volunteer must block roster');}});assert.ok(!s.flags.watchAgreed);
});
test('historical Kofi diary survives choosing Mara next and map knowledge does not name Amaneti early',async()=>{
 setChapter('kofi1');const s=newGame('kofi1');assert.ok(!chapter.map.known({},s.room).includes('amaneti'));
 await loadChapter('ch1');setChapter('ch1');const mara=newGame('ch1');mara.reached=['intro','kofi1','ch1'];mara.earlier.kofi1={complete:true};
 assert.ok(diary(mara).some(day=>day.label==='Four years ago'&&day.chapters.some(c=>c.entries.some(e=>e.includes('Six legs')))));
});

test('camp bow lesson names its craftsman and everyday arrow jobs without resurrecting the dead neighbour',()=>{
 for(const survivor of ['enali','deyu'] as const){
  const state=newGame('kofi1');state.room='camp';state.flags={warning:true,escaped:true,[`${survivor}Saved`]:true};state.inventory=[I('bow'),I('arrows'),I('bluntArrow')];
  const trace=enterStoryRoom(state);const words=trace.spoken.map(k=>TABLES.en[k]).join(' ');
  assert.match(words,/Deyu/);assert.match(words,/leather hinges/);assert.match(words,/seedpods/);assert.match(words,/light cord/);assert.match(words,/fetch the arrows back/);
  const dead=survivor==='enali'?'deyu':'enali';assert.ok(!trace.commands.some(c=>c.type==='say'&&c.actor===`extra-kofi-${dead}`));
  assert.ok(state.flags.bowExplained&&state.flags.bowUnfolded);assert.deepEqual(enterStoryRoom(state).spoken,[],'reload never repeats a completed explanation');
 }
});

test('folding and arrow selection matter in both utility puzzles; arrows stay recoverable',()=>{
 const state=newGame('kofi1');state.room='camp';state.flags={warning:true,escaped:true,enaliSaved:true,bowExplained:true};state.inventory=[I('bow'),I('arrows'),I('bluntArrow')];
 const act=(verb:Verb,target:string,item?:string)=>runStoryCommands(state,chapter.interact(state,verb,target,item?I(item):undefined));
 assert.ok(!chapter.rooms.camp.hotspots.some(h=>h.id==='branch'&&conditionsHold(state,h.visibleIf)));
 act('use','deadBough','bluntArrow');assert.ok(!state.flags.branchLoose,'a folded bow cannot shoot');
 act('use',`item:${I('bow')}`);assert.ok(state.flags.bowUnfolded);
 act('use','deadBough','arrows');assert.ok(!state.flags.branchLoose,'a hunting point cannot replace the blunt arrow');
 act('use','deadBough','bluntArrow');assert.ok(state.flags.branchLoose);assert.ok(state.inventory.includes(I('bluntArrow')),'the blunt arrow is recovered');
 act('take','branch');assert.ok(state.inventory.includes(I('branch')));
 state.room='clearing';Object.assign(state.flags,{campDone:true,waterDone:true});state.inventory.push(I('lineArrow'));
 act('use',`item:${I('bow')}`);assert.ok(!state.flags.bowUnfolded);
 act('use','fork','lineArrow');assert.ok(!state.flags.lineHung);assert.ok(state.inventory.includes(I('lineArrow')));
 act('use',`item:${I('bow')}`);act('use','fork','lineArrow');assert.ok(state.flags.lineHung);assert.ok(!state.inventory.includes(I('lineArrow')));assert.ok(state.inventory.includes(I('arrows')));
 const saved=parseSave(serializeSave(state));assert.ok(saved.ok);if(saved.ok)assert.ok(saved.state.flags.bowUnfolded&&saved.state.flags.branchLoose&&saved.state.flags.lineHung);
});

test('version 11 Kofi saves retain their fire preparation and receive the existing quiver’s blunt arrow once',()=>{
 const state=newGame('kofi1');state.room='camp';state.flags={warning:true,escaped:true,enaliSaved:true,brandLit:true};state.inventory=[I('bow'),I('arrows'),I('brand')];
 const old=JSON.parse(serializeSave(state));old.version=11;
 const malformed=structuredClone(old);malformed.state.flags.kofi1=true;assert.equal(parseSave(JSON.stringify(malformed)).ok,false,'malformed old flags are rejected without a migration crash');
 const result=parseSave(JSON.stringify(old));assert.ok(result.ok);
 if(result.ok){assert.ok(result.state.flags.branchLoose&&result.state.flags.brandLit);assert.equal(result.state.inventory.filter(i=>i===I('bluntArrow')).length,1);assert.ok(!result.state.flags.campDone);assert.ok(!result.state.flags.bowExplained,'the new camp conversation remains available before the fight');}
 const later=newGame('kofi1');later.room='hut';later.flags={warning:true,escaped:true,campDone:true,home:true,beamSupported:true};later.inventory=[I('bell')];
 const legacy=JSON.parse(serializeSave(later));legacy.version=11;const parsed=parseSave(JSON.stringify(legacy));assert.ok(parsed.ok);if(parsed.ok){assert.equal(parsed.state.room,'hut');assert.ok(parsed.state.flags.beamSupported);assert.deepEqual(parsed.state.inventory,[I('bell')]);}
});

test('successful utility shots display the tensed-bow sprite before changing the target; rejected shots do not',()=>{
 for(const [room,target,item,flag] of [['camp','deadBough','bluntArrow','branchLoose'],['clearing','fork','lineArrow','lineHung']]){
  const state=newGame('kofi1');state.room=room;state.flags={warning:true,escaped:true,bowExplained:true,bowUnfolded:true,...(room==='clearing'?{campDone:true,waterDone:true}:{})};state.inventory=[I('bow'),I(item)];
  for(const fromX of [20,620]){
   state.hero.x=fromX;const before=structuredClone(state);const commands=chapter.interact(state,'use',target,I(item));assert.deepEqual(state,before,'the visual does not mutate saved state');
   const poseIndex=commands.findIndex(c=>c.type==='heroLayers');const changed=commands.findIndex(c=>c.type==='setFlag'&&c.flag===flag);
   assert.ok(poseIndex>=0&&changed>poseIndex,'draw is visible before the arrow hits');
   const pose=commands[poseIndex];assert.equal(pose.type,'heroLayers');if(pose.type==='heroLayers'){
    assert.equal(pose.sheet,BOW_DRAW_SHEET);assert.deepEqual(pose.origin,{x:112,y:224});assert.equal(pose.ms,BOW_DRAW_HOLD_MS);
    assert.equal(pose.layers[0].frame,fromX===20?'frame0':'frame1');
   }
  }
  state.flags.bowUnfolded=false;assert.ok(!chapter.interact(state,'use',target,I(item)).some(c=>c.type==='heroLayers'),'folded bow has no shooting pose');
  assert.ok(chapter.rooms[room].sheets?.includes(BOW_DRAW_SHEET),'pose sheet is preloaded before use');
 }
});

test('tensed bow is only a geometric placeholder, with aligned left/right frames and a visible drawn string',()=>{
 const asset=MANIFEST.find(a=>a.id===BOW_DRAW_SHEET)!;assert.ok(asset);assert.equal(asset.status,'placeholder');
 const json=JSON.parse(readFileSync(new URL('../art/src/kofi1-test/kofi-test-bow-drawn.json',import.meta.url),'utf8'));
 assert.deepEqual(json.frames.map((f:{frame:unknown})=>f.frame),[{x:0,y:0,w:224,h:224},{x:224,y:0,w:224,h:224}]);
 assert.deepEqual(json.meta.frameTags.map((t:{name:string})=>t.name),['draw_right','draw_left']);
 const png=PNG.sync.read(readFileSync(new URL('../art/src/kofi1-test/kofi-test-bow-drawn.png',import.meta.url)));
 assert.equal(png.width,BOW_DRAW_FRAME*2);assert.equal(png.height,BOW_DRAW_FRAME);
 const alpha=(x:number,y:number)=>png.data[(y*png.width+x)*4+3];
 assert.ok(alpha(180,30)>0&&alpha(110,90)>0,'bow limb and pulled-back nocking point are drawn');
 assert.equal(alpha(0,0),0,'pose has a transparent background');
});
