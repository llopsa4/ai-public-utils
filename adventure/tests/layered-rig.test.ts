import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { loadPack, compositeNeutral, renderPackFrame, walkPose, walkMetadata, point, PARTS } from '../art/layered-rig.mjs';
import { paletteConformity } from '../art/normalize.mjs';
import { walkFrameAt, walkTiming, LEGACY_WALK } from '../src/game/walk';
import { CHAPTERS, loadAllChapters } from '../src/chapters';
import { newGame } from '../src/engine/state';
import { equip } from '../src/engine/kit';
import { heroSheetFor } from '../src/engine/story';
await loadAllChapters();
const packs=['casual','light','medium'].map(id=>loadPack(`art/sources/characters/mara-${id}-layered`));
const distance=(a:number[],b:number[])=>Math.hypot(a[0]-b[0],a[1]-b[1]);

test('eleven complete registered layers reconstruct each approved master byte for byte',()=>{
  for(const pack of packs){
    assert.equal(pack.cfg.order.length,11);assert.equal(pack.cfg.overlap,25);
    assert.deepEqual(compositeNeutral(pack).data,pack.master.data,pack.cfg.outfit);
    for(const name of PARTS){
      const png=pack.layers[name];assert.deepEqual([png.width,png.height],[1024,1536]);
      assert.ok(png.data.some((a,i)=>i%4===3&&a===255),name);
    }
    for(const [name,p] of Object.entries(pack.cfg.joints))assert.ok(p[0]>0&&p[0]<1024&&p[1]>0&&p[1]<1536,name);
  }
});

test('hierarchical joints meet and bone lengths stay fixed through the complete walk',()=>{
  for(const {cfg} of packs)for(let phase=0;phase<8;phase+=.25){
    const pose=walkPose(cfg,phase);
    for(const side of ['near','far']){
      const hip=cfg.joints[side+'Hip'],knee=cfg.joints[side+'Knee'],ankle=cfg.joints[side+'Ankle'];
      const h=point(pose.mats[side+'Thigh'],hip),k=point(pose.mats[side+'Thigh'],knee),a=point(pose.mats[side+'Shin'],ankle);
      assert.ok(Math.abs(distance(h,k)-distance(hip,knee))<1e-7);
      assert.ok(Math.abs(distance(k,a)-distance(knee,ankle))<1e-7);
      assert.ok(distance(k,point(pose.mats[side+'Shin'],knee))<1e-7,'knee continuity');
      assert.ok(distance(a,point(pose.mats[side+'Boot'],ankle))<1e-7,'ankle continuity');
      const elbow=cfg.joints[side+'Elbow'];
      assert.ok(distance(point(pose.mats[side+'UpperArm'],elbow),point(pose.mats[side+'Forearm'],elbow))<1e-7,'elbow continuity');
    }
  }
});

test('planted feet stay at the same world point while the actor moves forward',()=>{
  for(const {cfg} of packs)for(const [side,start] of [['near',0],['far',4]] as const){
    let planted:number[]|undefined;
    for(let phase=start;phase<start+4;phase+=.25){
      const foot=walkPose(cfg,phase).feet[side];assert.ok(foot.planted);
      const world=[foot.ankle[0]+phase*cfg.walk.strideSource/4,foot.ankle[1]];
      planted??=world;assert.ok(distance(planted,world)<1e-7);
    }
  }
});

test('rendered poses retain palette, binary transparency, 2px grid, safe edges and covered joints',()=>{
  for(const pack of packs)for(let phase=0;phase<8;phase++){
    const frame=renderPackFrame(pack,{phase});assert.equal(paletteConformity(frame.data),1);
    for(let y=0;y<256;y+=2)for(let x=0;x<256;x+=2){
      const o=(y*256+x)*4;
      for(const [dx,dy] of [[1,0],[0,1],[1,1]])assert.deepEqual(frame.data.subarray(o,o+4),frame.data.subarray(((y+dy)*256+x+dx)*4,((y+dy)*256+x+dx)*4+4));
      assert.ok(frame.data[o+3]===0||frame.data[o+3]===255);
    }
    for(let y=0;y<256;y++)assert.equal(frame.data[(y*256)*4+3]+frame.data[(y*256+255)*4+3],0,'horizontal clipping');
    const pose=walkPose(pack.cfg,phase),k=(pack.cfg.height/2-2)/pack.cfg.sourceHeight,hx=(pack.cfg.joints.nearHip[0]+pack.cfg.joints.farHip[0])/2;
    for(const side of ['near','far'])for(const [joint,part] of [['Elbow','UpperArm'],['Knee','Thigh'],['Ankle','Shin']]){
      const p=point(pose.mats[side+part],pack.cfg.joints[side+joint]);
      const x=Math.floor((64+(p[0]-hx)*k)*2),y=Math.floor((126+(p[1]-pack.cfg.baseline)*k)*2);
      let opaque=false;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(x+dx>=0&&x+dx<256&&y+dy>=0&&y+dy<256&&frame.data[((y+dy)*256+x+dx)*4+3])opaque=true;
      assert.ok(opaque,`${pack.cfg.outfit} ${phase} ${side}${joint}`);
    }
  }
});

test('eight-frame timing lands on 0/4 and legacy sheets keep six-frame 7px timing',()=>{
  assert.deepEqual(walkTiming(),LEGACY_WALK);
  for(const {cfg} of packs){
    const timing=walkTiming(walkMetadata(cfg));assert.deepEqual(timing.plantFrames,[0,4]);
    assert.deepEqual(Array.from({length:9},(_,i)=>walkFrameAt((i+.001)*timing.distancePerFrame,8,timing)),[0,1,2,3,4,5,6,7,0]);
  }
  assert.deepEqual(Array.from({length:7},(_,i)=>walkFrameAt(i*7,6,LEGACY_WALK)),[0,1,2,3,4,5,0]);
});

test('every outfit has a visible blink after reduction to the game grid',()=>{
  for(const pack of packs){
    const open=renderPackFrame(pack),closed=renderPackFrame(pack,{blink:true});let changed=0,top=256,bottom=-1;
    for(let k=0;k<open.data.length;k+=4){assert.equal(open.data[k+3],closed.data[k+3]);if(open.data[k+3]){top=Math.min(top,Math.floor(k/4/256));bottom=Math.max(bottom,Math.floor(k/4/256))}if(!open.data.subarray(k,k+3).equals(closed.data.subarray(k,k+3)))changed++}
    assert.equal(bottom-top+1,232,'Standing art height');
    assert.ok(changed>0&&changed<=64,`${pack.cfg.outfit}: ${changed} eye pixels changed`);
  }
});

test('outfit equipment and gauntlet power are independent across chapters',()=>{
  const state=newGame(),ch1=CHAPTERS.ch1,ctx={state,room:ch1.rooms[state.room],cold:false};
  state.kit.owned.push('layered-armor','light-armor');
  assert.ok(equip(state.kit,'armor','layered-armor'));
  assert.equal(heroSheetFor(ch1.story,ctx),'mara-casual');
  const unpoweredStory={...ch1.story,heroSheet:[{pick:'mara'}]};
  assert.equal(heroSheetFor(unpoweredStory,ctx),'mara-medium');
  state.flags.hasGauntlet=true;assert.equal(heroSheetFor(ch1.story,ctx),'mara-medium-gauntlet');
  for(const armor of ['patched-coat','light-armor']){
    assert.ok(equip(state.kit,'armor',armor));assert.equal(heroSheetFor(ch1.story,ctx),'mara-gauntlet');
    state.flags.hasGauntlet=false;assert.equal(heroSheetFor(unpoweredStory,ctx),'mara');state.flags.hasGauntlet=true;
  }
  assert.ok(equip(state.kit,'armor','layered-armor'));
  const ch2=CHAPTERS.ch2;assert.equal(heroSheetFor(ch2.story,{state,room:ch2.rooms[ch2.start.room],cold:false}),'mara-medium-gauntlet');
});

test('powered variants retain the same silhouette and change only the ember cell',()=>{
  for(const pack of packs.filter(p=>p.cfg.outfit!=='casual')){
    const off=renderPackFrame(pack),on=renderPackFrame(pack,{powered:true});let changed=0;
    for(let k=0;k<off.data.length;k+=4){assert.equal(on.data[k+3],off.data[k+3]);if(!on.data.subarray(k,k+3).equals(off.data.subarray(k,k+3)))changed++}
    assert.ok(changed>0&&changed<100,`${pack.cfg.outfit}: ${changed} changed pixels`);
  }
});

test('installed kneeling and lying frames preserve the gauntlet power state',()=>{
  for(const base of ['mara','mara-medium']){
    const a=PNG.sync.read(readFileSync(`art/src/characters/${base}.png`)),b=PNG.sync.read(readFileSync(`art/src/characters/${base}-gauntlet.png`));
    const json=JSON.parse(readFileSync(`art/src/characters/${base}.json`,'utf8'));
    for(const tag of ['crouch','dead']){
      const frame=json.frames[json.meta.frameTags.find((t:{name:string})=>t.name===tag).from].frame;let changed=0;
      for(let y=frame.y;y<frame.y+frame.h;y++)for(let x=frame.x;x<frame.x+frame.w;x++){
        const k=(y*a.width+x)*4;assert.equal(a.data[k+3],b.data[k+3]);if(!a.data.subarray(k,k+3).equals(b.data.subarray(k,k+3)))changed++;
      }
      assert.ok(changed>0&&changed<100,`${base}/${tag}: ${changed}`);
    }
  }
});
