import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {PNG} from 'pngjs';
import {fileURLToPath} from 'node:url';
import {poseAtDistance,point,render,neutral} from './renderer.mjs';
import {paletteConformity} from '../normalize.mjs';
const dir=fileURLToPath(new URL('../sources/characters/kofi-standing-rig/',import.meta.url));
const cfg=JSON.parse(fs.readFileSync(dir+'rig.json','utf8'));
const read=name=>PNG.sync.read(fs.readFileSync(dir+name+'.png'));
const pack={cfg,layers:Object.fromEntries(cfg.order.map(n=>[n,read(n)])),idle:{village:read('idle-village'),travel:read('idle-travel')}};
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
test('new sources have registered binary transparent anatomy, costume and equipment',()=>{
 assert.equal(cfg.order.length,17);
 for(const [name,png] of Object.entries(pack.layers)){
  assert.deepEqual([png.width,png.height],[1024,1536]);let count=0;
  for(let k=3;k<png.data.length;k+=4){assert.ok(png.data[k]===0||png.data[k]===255,name);if(png.data[k])count++;}
  assert.ok(count>100,name+' has art');
 }
 for(const outfit of ['village','travel']){
  assert.deepEqual(neutral(pack,outfit).data,read('neutral-'+outfit).data);
  const sheet=read('walk-'+outfit);assert.deepEqual([sheet.width,sheet.height],[4096,256]);
  const meta=JSON.parse(fs.readFileSync(dir+'walk-'+outfit+'.json','utf8'));assert.equal(meta.sourceDistancePerFrame,cfg.stride/16);
 }
});
test('standing idles retain all opaque original illustration pixels',()=>{
 for(const outfit of ['village','travel']){const raw=read('raw/standing-'+outfit),idle=pack.idle[outfit];
  for(let k=0;k<raw.data.length;k+=4)if(raw.data[k+3]>=128)assert.deepEqual(idle.data.subarray(k,k+3),raw.data.subarray(k,k+3));
 }
});
test('distance-driven gait keeps fixed bone lengths, connected joints and one ground line',()=>{
 const j=cfg.joints;
 for(let d=0;d<cfg.stride;d+=cfg.stride/64){const pose=poseAtDistance(cfg,d);
  for(const side of ['near','far']){
   const m=pose.mats,u=m[side+'UpperArm'],f=m[side+'Forearm'],t=m[side+'Thigh'],s=m[side+'Shin'];
   for(const [a,b,mat] of [[j[side+'Shoulder'],j[side+'Elbow'],u],[j[side+'Hip'],j[side+'Knee'],t],[j[side+'Knee'],j[side+'Ankle'],s]])assert.ok(Math.abs(distance(point(mat,a),point(mat,b))-distance(a,b))<1e-6);
   assert.ok(distance(point(u,j[side+'Elbow']),point(f,j[side+'Elbow']))<1e-6);
   assert.ok(distance(point(t,j[side+'Knee']),point(s,j[side+'Knee']))<1e-6);
   assert.ok(distance(point(s,j[side+'Ankle']),point(m[side+'Foot'],j[side+'Ankle']))<1e-6);
   if(pose.feet[side].stance)assert.ok(Math.abs(pose.feet[side].contact[1]-cfg.ground)<1e-6);
  }
  assert.ok(distance(point(pose.mats.bow,[420,625]),point(pose.mats.belt,[420,625]))<1e-6,'bow suspension stays at belt');
 }
});
test('flat planted soles do not slide as the root advances; cycle wraps continuously',()=>{
 for(const [side,offset] of [['near',0],['far',cfg.stride/2]]){
  const a=poseAtDistance(cfg,cfg.stride*.15+offset),b=poseAtDistance(cfg,cfg.stride*.25+offset);
  assert.ok(Math.abs(a.feet[side].contact[0]+cfg.stride*.15-b.feet[side].contact[0]-cfg.stride*.25)<1e-6);
 }
 assert.deepEqual(poseAtDistance(cfg,0),poseAtDistance(cfg,cfg.stride));
});
test('all exported frames stay on palette, transparent and inside the canvas',()=>{
 for(const outfit of ['village','travel'])for(let i=0;i<16;i++){
  const p=render(pack,{distance:i*cfg.stride/16,outfit});assert.equal(paletteConformity(p.data),1);
  for(let y=0;y<256;y++){assert.equal(p.data[(y*256)*4+3],0);assert.equal(p.data[(y*256+255)*4+3],0);}
  for(let k=3;k<p.data.length;k+=4)assert.ok(p.data[k]===0||p.data[k]===255);
 }
});
const snapshot=new URL('../inbox/kofi-rig-from-standing/existing-rig-hashes.json',import.meta.url);
test('existing Kofi rigs and shared renderer remain byte-identical to the starting snapshot',{skip:!fs.existsSync(snapshot)},()=>{
 const hashes=JSON.parse(fs.readFileSync(snapshot,'utf8'));
 for(const [file,hash] of Object.entries(hashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,file);
});
