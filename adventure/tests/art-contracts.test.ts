import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { walkPose, walkMetadata, point, type LayeredConfig } from '../art/layered-rig.mjs';
import { walkFrameAt, walkTiming, LEGACY_WALK } from '../src/game/walk';
import { CH1 } from '../src/chapters/ch1';
import { STORY as CH2_STORY } from '../src/chapters/ch2/story';
import { ROOMS as CH2_ROOMS, START_ROOM as CH2_START_ROOM } from '../src/chapters/ch2/rooms';
import { newGame } from '../src/engine/state';
import { equip } from '../src/engine/kit';
import { heroSheetFor } from '../src/engine/story';
import { MANIFEST, RIGS } from '../art/manifest.mjs';
import { NPC_IDS } from '../src/engine/types';
import { PORTRAIT_MOODS } from '../src/content/art';

// JSON-only fixtures: no PNG decoding, layer compositing, or chapter preloading in this file.
const configs = ['casual', 'light', 'medium'].map(id =>
  JSON.parse(readFileSync(new URL(`../art/sources/characters/mara-${id}-layered/rig.json`, import.meta.url), 'utf8')) as LayeredConfig);
const distance = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

test('art metadata registers unique files and every named character rig and portrait', () => {
  assert.equal(new Set(MANIFEST.map(entry => entry.id)).size, MANIFEST.length, 'manifest IDs are unique');
  assert.equal(new Set(MANIFEST.map(entry => entry.file)).size, MANIFEST.length, 'primary art files have one owner');
  for (const id of NPC_IDS) {
    const character = MANIFEST.find(entry => entry.kind === 'character' && entry.rig === id);
    assert.ok(character, `${id} has a character manifest entry`);
    assert.ok(RIGS[id], `${id} has rig settings`);
    assert.ok(character.sheet?.endsWith(`/${id}.json`), `${id} has animation metadata`);
    const portrait = MANIFEST.find(entry => entry.kind === 'portrait'
      && (entry.file.endsWith(`/portraits/${id}.png`) || entry.file === `portraits/${id}.png`));
    assert.ok(portrait, `${id} has a portrait manifest entry`);
    const rigMoods = RIGS[id].moods ?? ['neutral', 'worried', 'angry'];
    assert.deepEqual(portrait.moods, rigMoods, `${id} portrait and rig agree on expression frames`);
    if (PORTRAIT_MOODS[id]) assert.deepEqual(PORTRAIT_MOODS[id], portrait.moods, `${id} runtime portrait metadata agrees`);
  }
  for (const cfg of configs) {
    assert.equal(cfg.version, 1);
    assert.deepEqual(cfg.canvas, { width: 1024, height: 1536 });
    assert.equal(cfg.height, 232);
    assert.equal(cfg.walk.frames, 8);
  }
});

test('hierarchical joints meet and bone lengths stay fixed through the complete walk',()=>{
  for(const cfg of configs)for(let phase=0;phase<8;phase+=.25){
    const pose=walkPose(cfg,phase);
    for(const side of ['near','far']){
      const hip=cfg.joints[side+'Hip'],knee=cfg.joints[side+'Knee'],ankle=cfg.joints[side+'Ankle'];
      const h=point(pose.mats[side+'Thigh'],hip),k=point(pose.mats[side+'Thigh'],knee),a=point(pose.mats[side+'Shin'],ankle);
      assert.ok(Math.abs(distance(h,k)-distance(hip,knee))<1e-7);
      assert.ok(Math.abs(distance(k,a)-distance(knee,ankle))<1e-7);
      assert.ok(distance(k,point(pose.mats[side+'Shin'],knee))<1e-7,'knee continuity');
      assert.ok(distance(a,point(pose.mats[side+'Boot'],ankle))<1e-7,'ankle continuity');
      const elbow=cfg.joints[side+'Elbow'];
      const shoulder=cfg.joints[side+'Shoulder'];
      assert.ok(distance(point(pose.mats.torso,shoulder),point(pose.mats[side+'UpperArm'],shoulder))<1e-7,'shoulder continuity');
      assert.ok(distance(point(pose.mats[side+'UpperArm'],elbow),point(pose.mats[side+'Forearm'],elbow))<1e-7,'elbow continuity');
    }
  }
});

test('heel, flat-foot and toe contacts stay on their footprint while the actor moves forward',()=>{
  for(const cfg of configs)for(const [side,start] of [['near',0],['far',4]] as const){
    for(let phase=start;phase<start+4;phase+=.25){
      const foot=walkPose(cfg,phase).feet[side];assert.ok(foot.planted);
      const q=(phase+(side==='near'?0:4))%8;
      const world=[foot.contact[0]+q*cfg.walk.strideSource/4,foot.contact[1]];
      assert.ok(distance(world,[foot.contactSource[0]+cfg.walk.strideSource/2,foot.contactSource[1]])<1e-7);
    }
  }
});

test('walk has restrained heel-to-toe roll, counter-sway and a heavier gauntlet arm',()=>{
  const rotation=(m:number[])=>Math.atan2(m[1],m[0]);
  for(const cfg of configs){
    assert.equal(cfg.walk.footRollDegrees,6);assert.equal(cfg.walk.transitionMs,90);
    const heel=walkPose(cfg,0),flat=walkPose(cfg,1.5),toe=walkPose(cfg,3.5);
    assert.ok(rotation(heel.mats.nearBoot)<0);assert.ok(Math.abs(rotation(flat.mats.nearBoot))<1e-7);assert.ok(rotation(toe.mats.nearBoot)>0);
    const a=walkPose(cfg,2),b=walkPose(cfg,6);
    assert.ok(rotation(a.mats.torso)<5*Math.PI/180);assert.ok(rotation(b.mats.torso)>5*Math.PI/180);
    if(cfg.outfit!=='casual'){
      let near=0,far=0;
      for(let p=0;p<8;p+=.125){const pose=walkPose(cfg,p),torso=rotation(pose.mats.torso);near=Math.max(near,Math.abs(rotation(pose.mats.nearUpperArm)-torso));far=Math.max(far,Math.abs(rotation(pose.mats.farUpperArm)-torso));}
      assert.ok(near<far*.75,'heavy arm has less swing');
    }
    for(let p=0;p<8;p+=.125){
      const a=walkPose(cfg,p),b=walkPose(cfg,p+1e-5);
      for(const side of ['near','far'])assert.ok(distance(a.feet[side].ankle,b.feet[side].ankle)<.1,'foot targets are continuous through lift and contact');
    }
  }
});

test('eight-frame timing lands on 0/4 and legacy sheets keep six-frame 7px timing',()=>{
  assert.deepEqual(walkTiming(),LEGACY_WALK);
  for(const cfg of configs){
    const timing=walkTiming(walkMetadata(cfg));assert.deepEqual(timing.plantFrames,[0,4]);
    assert.deepEqual(Array.from({length:9},(_,i)=>walkFrameAt((i+.001)*timing.distancePerFrame,8,timing)),[0,1,2,3,4,5,6,7,0]);
  }
  assert.deepEqual(Array.from({length:7},(_,i)=>walkFrameAt(i*7,6,LEGACY_WALK)),[0,1,2,3,4,5,0]);
});

test('outfit equipment and gauntlet power are independent across chapters',()=>{
  const state=newGame(),ch1=CH1,ctx={state,room:ch1.rooms[state.room],cold:false};
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
  assert.equal(heroSheetFor(CH2_STORY,{state,room:CH2_ROOMS[CH2_START_ROOM],cold:false}),'mara-medium-gauntlet');
});
