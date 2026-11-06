import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { loadPack, compositeNeutral, renderPackFrame, walkPose, walkMetadata, partWidthTransform, point, PARTS } from '../art/layered-rig.mjs';
import { paletteConformity } from '../art/normalize.mjs';
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

test('Mara walks with lower passing feet and a five-degree upper-body lean only',()=>{
  for(const [i,pack] of packs.entries()){
    const cfg=pack.cfg;
    assert.equal(cfg.walk.lift,[120,117,107][i]);
    assert.equal(cfg.walk.torsoLeanDegrees,5);
    const straight=structuredClone(cfg);delete straight.walk.torsoLeanDegrees;
    for(let phase=0;phase<8;phase+=.25){
      const pose=walkPose(cfg,phase),neutral=walkPose(straight,phase);
      const torsoAngle=Math.atan2(pose.mats.torso[1],pose.mats.torso[0]),neutralAngle=Math.atan2(neutral.mats.torso[1],neutral.mats.torso[0]);
      assert.ok(Math.abs(torsoAngle-neutralAngle-5*Math.PI/180)<1e-10,'base lean is retained beneath the subtle counter-sway');
      assert.deepEqual(pose.feet,neutral.feet,'lean cannot move planted feet');
      assert.deepEqual(pose.knees,neutral.knees,'lean cannot change leg geometry');
      for(const side of ['near','far'])assert.ok(cfg.joints[side+'Ankle'][1]-pose.feet[side].ankle[1]<=cfg.walk.lift+1e-7);
    }
    const previous=structuredClone(cfg);previous.walk.lift=[180,175,160][i];delete previous.walk.torsoLeanDegrees;
    assert.ok(walkPose(cfg,6).knees.near[1]>walkPose(previous,6).knees.near[1],'passing knee is lower');
    assert.deepEqual(walkMetadata(cfg),walkMetadata(previous));
    assert.deepEqual(renderPackFrame(pack).data,renderPackFrame({...pack,cfg:previous}).data,'idle remains unchanged');
  }
});

test('walking thickness expands existing parts without moving bone anchors or changing idle',()=>{
  const area=(data:Buffer)=>{let n=0;for(let i=3;i<data.length;i+=4)if(data[i])n++;return n;};
  for(const pack of packs){
    const cfg=pack.cfg,thin=structuredClone(cfg);delete thin.walk.widthScale;
    assert.equal(cfg.walk.widthScale,1.15);
    for(const name of PARTS){
      assert.deepEqual(partWidthTransform(thin,name),[1,0,0,1,0,0]);
      const m=partWidthTransform(cfg,name);
      assert.ok(Math.abs(m[0]*m[3]-m[1]*m[2]-1.15)<1e-9,'cross-section expands by 15%');
      if(name==='torso')continue;
      const side=name.startsWith('near')?'near':'far';
      const joints=name.endsWith('UpperArm')?['Shoulder','Elbow']:name.endsWith('Forearm')?['Elbow']:name.endsWith('Thigh')?['Hip','Knee']:['Knee','Ankle'];
      for(const joint of joints){const p=cfg.joints[side+joint];assert.ok(distance(point(m,p),p)<1e-7,'bone anchor is unchanged');}
    }
    assert.deepEqual(renderPackFrame(pack).data,renderPackFrame({...pack,cfg:thin}).data);
    for(let phase=0;phase<8;phase++){
      const noRoll={...cfg,walk:{...cfg.walk,footRollDegrees:0}},thinNoRoll={...thin,walk:{...thin.walk,footRollDegrees:0}};
      assert.deepEqual(walkPose(noRoll,phase),walkPose(thinNoRoll,phase),'width alone does not move bone anchors; rolled soles use their widened footprint');
      assert.ok(area(renderPackFrame(pack,{phase}).data)>area(renderPackFrame({...pack,cfg:thin},{phase}).data)*1.04,'walking silhouette gains visible mass');
    }
    assert.deepEqual(walkMetadata(cfg),walkMetadata(thin));
  }
});

test('rendered poses retain palette, binary transparency, fine pixel detail, safe edges and covered joints',()=>{
  for(const pack of packs)for(let phase=0;phase<8;phase++){
    const frame=renderPackFrame(pack,{phase});assert.equal(paletteConformity(frame.data),1);
    let detailedBlocks=0;
    for(let y=0;y<256;y+=2)for(let x=0;x<256;x+=2){
      const o=(y*256+x)*4;
      if([[1,0],[0,1],[1,1]].some(([dx,dy])=>!frame.data.subarray(o,o+4).equals(frame.data.subarray(((y+dy)*256+x+dx)*4,((y+dy)*256+x+dx)*4+4))))detailedBlocks++;
    }
    assert.ok(detailedBlocks>100,'Samples preserve detail inside the former doubled 2px blocks');
    for(let o=3;o<frame.data.length;o+=4)assert.ok(frame.data[o]===0||frame.data[o]===255);
    for(let y=0;y<256;y++)assert.equal(frame.data[(y*256)*4+3]+frame.data[(y*256+255)*4+3],0,'horizontal clipping');
    const pose=walkPose(pack.cfg,phase),k=(pack.cfg.height/2-2)/pack.cfg.sourceHeight,hx=(pack.cfg.joints.nearHip[0]+pack.cfg.joints.farHip[0])/2;
    for(const side of ['near','far'])for(const [joint,part] of [['Shoulder','UpperArm'],['Elbow','UpperArm'],['Knee','Thigh'],['Ankle','Shin']]){
      const p=point(pose.mats[side+part],pack.cfg.joints[side+joint]);
      const x=Math.floor((64+(p[0]-hx)*k)*2),y=Math.floor((126+(p[1]-pack.cfg.baseline)*k)*2);
      let opaque=false;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(x+dx>=0&&x+dx<256&&y+dy>=0&&y+dy<256&&frame.data[((y+dy)*256+x+dx)*4+3])opaque=true;
      assert.ok(opaque,`${pack.cfg.outfit} ${phase} ${side}${joint}`);
    }
  }
});

test('every outfit has a visible blink after reduction to the game grid',()=>{
  for(const pack of packs){
    const open=renderPackFrame(pack),closed=renderPackFrame(pack,{blink:true});let changed=0,top=256,bottom=-1;
    for(let k=0;k<open.data.length;k+=4){assert.equal(open.data[k+3],closed.data[k+3]);if(open.data[k+3]){top=Math.min(top,Math.floor(k/4/256));bottom=Math.max(bottom,Math.floor(k/4/256))}if(!open.data.subarray(k,k+3).equals(closed.data.subarray(k,k+3)))changed++}
    assert.equal(bottom-top+1,232,'Standing art height');
    assert.ok(changed>0&&changed<=64,`${pack.cfg.outfit}: ${changed} eye pixels changed`);
  }
});

test('powered variants retain the same silhouette and change only the ember cell',()=>{
  for(const pack of packs.filter(p=>p.cfg.outfit!=='casual'))for(const phase of [null,0,1,2,3,4,5,6,7]){
    const off=renderPackFrame(pack,{phase}),on=renderPackFrame(pack,{phase,powered:true});let changed=0;
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
