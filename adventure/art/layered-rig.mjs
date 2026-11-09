// Optional eleven-piece rig. Legacy characters keep the renderer in rig.mjs.
import {PNG} from 'pngjs';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {snapToPalette,addOutline} from './normalize.mjs';
import {encodeIndexed} from './png.mjs';
const art=dirname(fileURLToPath(import.meta.url));
export const PARTS=['farUpperArm','farForearm','farThigh','farShin','farBoot','nearThigh','nearShin','nearBoot','torso','nearUpperArm','nearForearm'];
const identity=()=>[1,0,0,1,0,0];
export const mul=(m,n)=>[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];
const translate=(x,y)=>[1,0,0,1,x,y];
const rotate=(r,[x,y])=>{const c=Math.cos(r),s=Math.sin(r);return[c,s,-s,c,x-c*x+s*y,y-s*x-c*y]};
export const point=(m,[x,y])=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const angle=(a,b)=>Math.atan2(b[1]-a[1],b[0]-a[0]);
const inverse=m=>{const d=m[0]*m[3]-m[1]*m[2];return[m[3]/d,-m[1]/d,-m[2]/d,m[0]/d,(m[2]*m[5]-m[3]*m[4])/d,(m[1]*m[4]-m[0]*m[5])/d]};
const align=(a,b,c,d)=>mul(translate(c[0]-a[0],c[1]-a[1]),rotate(angle(c,d)-angle(a,b),a));

export function loadPack(dir){
 const cfg=JSON.parse(readFileSync(join(dir,'rig.json'),'utf8'));
 if(cfg.version!==1||cfg.canvas.width!==1024||cfg.canvas.height!==1536||cfg.order.join()!==PARTS.join())throw Error('Invalid layered rig configuration '+dir);
 const layers=Object.fromEntries(PARTS.map(name=>[name,PNG.sync.read(readFileSync(join(dir,name+'.png')))]));
 for(const [name,png] of Object.entries(layers))if(png.width!==1024||png.height!==1536)throw Error('Invalid layer canvas '+name);
 const master=PNG.sync.read(readFileSync(join(dir,'master.png')));
 const assembled=compositeNeutral({cfg,layers});
 if(!assembled.data.equals(master.data))throw Error('Layers do not exactly reconstruct master '+dir);
 const idleFile=join(dir,'idle.png');
 return {cfg,layers,master,dir,idle:existsSync(idleFile)?PNG.sync.read(readFileSync(idleFile)):undefined};
}
export function compositeNeutral({cfg,layers}){
 const p=new PNG({width:cfg.canvas.width,height:cfg.canvas.height});
 for(const name of cfg.order)for(let k=0;k<p.data.length;k+=4)if(layers[name].data[k+3])layers[name].data.copy(p.data,k,k,k+4);
 return p;
}

/** Two-bone IK with fixed segment lengths; bend the knee toward the facing direction. */
export function solveLeg(hip,target,l1,l2){
 const d=dist(hip,target);if(d>l1+l2+1e-6||d<Math.abs(l1-l2)+1e-6)throw Error('Unreachable layered-rig foot target');
 const theta=angle(hip,target)-Math.acos(Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*d))));
 return [hip[0]+Math.cos(theta)*l1,hip[1]+Math.sin(theta)*l1];
}
function footMotion(cfg,side,q){
 const t=(q%4)/4,stance=q<4,ankle=cfg.joints[side+'Ankle'],stride=cfg.walk.strideSource;
 // Both feet swing about the same point under the hips (walk.footCentre, from each hip), not about
 // where the drawing happened to put each ankle: the masters stand with one foot back, which made
 // one leg reach further than the other and the body dip more on that step (a limp).
 // A number for both feet, or {near, far} when the drawing's legs differ enough to need evening out.
 const fc=cfg.walk.footCentre,offset=typeof fc==='object'?fc[side]:fc;
 const centre=offset===undefined?0:cfg.joints[side+'Hip'][0]+offset-ankle[0];
 const x=centre+(stance?stride/2-stride*t:-stride/2+stride*(.5-.5*Math.cos(Math.PI*t)));
 // The swinging foot clears the floor early, just after toe-off, then lowers as the leg straightens
 // to reach for the next step (walk.liftEarly 0..1; 0 keeps the even arc).
 const early=cfg.walk.liftEarly??0;
 const lift=stance?0:Math.sin(Math.PI*t)*(1+early*(.5-t)*1.6)*cfg.walk.lift;
 const roll=(cfg.walk.footRollDegrees??0)*Math.PI/180,sole=cfg.walk.soles?.[side];
 if(!roll||!sole)return {target:[ankle[0]+x,ankle[1]-lift],angle:stance?0:-.16*Math.sin(Math.PI*t),contactSource:ankle,stance};
 const width=partWidthTransform(cfg,side+'Boot'),heel=point(width,sole.heel),toe=point(width,sole.toe);
 const start=point(rotate(roll,toe),ankle),end=point(rotate(-roll,heel),ankle);
 if(stance){
  const angle=t<.25?-roll*(1-t/.25):t>.65?roll*(t-.65)/.35:0;
  const contactSource=t<.25?heel:t>.65?toe:ankle;
  return {target:point(mul(translate(x,0),rotate(angle,contactSource)),ankle),angle,contactSource,stance};
 }
 // Match toe-off and heel-strike continuously, without raising the passing foot higher.
 const a=Math.max(0,1-2*t)**2,b=Math.max(0,2*t-1)**2;
 return {target:[ankle[0]+x+a*(start[0]-ankle[0])+b*(end[0]-ankle[0]),ankle[1]-lift+a*(start[1]-ankle[1])+b*(end[1]-ankle[1])],
  angle:roll*Math.cos(Math.PI*t)-.16*Math.sin(Math.PI*t),contactSource:ankle,stance};
}
export function walkPose(cfg,phase){
 const j=cfg.joints,mats=Object.fromEntries(PARTS.map(n=>[n,identity()])),feet={},knees={};
 const p=((phase%8)+8)%8;
 const hipCenter=[(j.nearHip[0]+j.farHip[0])/2,(j.nearHip[1]+j.farHip[1])/2];
 const sway=(cfg.walk.hipSwayDegrees??0)*Math.sin(p*Math.PI/4)*Math.PI/180;
 const pelvis=rotate(sway,hipCenter);
 const motion=Object.fromEntries([['near',0],['far',4]].map(([side,offset])=>[side,footMotion(cfg,side,(p+offset)%8)]));
 // Reach both foot targets, then add a small downward weight shift at each contact.
 let drop=2;
 for(const [side,offset] of [['near',0],['far',4]]){
  const hip=point(pelvis,j[side+'Hip']),knee=j[side+'Knee'],ankle=j[side+'Ankle'],{target,stance}=motion[side];
  const len=dist(j[side+'Hip'],knee)+dist(knee,ankle)-(stance?5:1),x=target[0]-hip[0];
  drop=Math.max(drop,target[1]-hip[1]-Math.sqrt(Math.max(1,len*len-x*x)));
 }
 drop+=(cfg.walk.weightDrop??0)*(1+Math.cos(p*Math.PI/2))/2;
 const body=mul(translate(0,drop),pelvis);
 // Lean only the upper body; the pelvis and planted-foot IK remain independent.
 const counter=(cfg.walk.torsoSwayDegrees??0)*Math.sin(p*Math.PI/4)*Math.PI/180;
 const torso=mul(body,rotate((cfg.walk.torsoLeanDegrees??0)*Math.PI/180-sway-counter,hipCenter));
 mats.torso=torso;
 for(const [side,offset] of [['near',0],['far',4]]){
  const q=(p+offset)%8,t=(q%4)/4,stance=q<4;
  const hip=j[side+'Hip'],knee=j[side+'Knee'],ankle=j[side+'Ankle'];
  const {target,angle:bootAngle,contactSource}=motion[side];
  const h=point(body,hip),k=solveLeg(h,target,dist(hip,knee),dist(knee,ankle));
  const thigh=align(hip,knee,h,k),relative=angle(k,target)-angle(knee,ankle)-(angle(h,k)-angle(hip,knee));
  mats[side+'Thigh']=thigh;
  mats[side+'Shin']=mul(thigh,rotate(relative,knee));
  const shinAngle=angle(k,target)-angle(knee,ankle);
  mats[side+'Boot']=mul(mats[side+'Shin'],rotate(bootAngle-shinAngle,ankle));
  feet[side]={ankle:point(mats[side+'Shin'],ankle),planted:stance,contact:point(mats[side+'Boot'],contactSource),contactSource};knees[side]=k;
  const heavy=side==='near'&&cfg.outfit!=='casual';
  const lag=heavy?(cfg.walk.gauntletLagDegrees??0)*Math.PI/180:0;
  const swing=(side==='near'?1:-1)*cfg.walk.armSwing*(heavy?(cfg.walk.gauntletSwingScale??1):1)*Math.cos(p*Math.PI/4-lag)*Math.PI/180;
  const upper=mul(torso,rotate(swing,j[side+'Shoulder']));
  mats[side+'UpperArm']=upper;
  mats[side+'Forearm']=mul(upper,rotate(-.1-Math.abs(swing)*.22+(heavy?.035*Math.sin(p*Math.PI/4-lag):0),j[side+'Elbow']));
 }
 return {mats,feet,knees,bodyDrop:drop};
}
export function walkMetadata(cfg){
 const worldScale=(cfg.height/2-2)/cfg.sourceHeight;
 return {distancePerFrame:cfg.walk.strideSource/4*worldScale,plantFrames:[0,4],...(cfg.walk.transitionMs?{transitionMs:cfg.walk.transitionMs}:{})};
}
function closedEyes(png,cfg){
 const out={...png,data:Buffer.from(png.data)};
 for(const e of cfg.eyes){
  const s=(e.skinAt[1]*png.width+e.skinAt[0])*4,skin=png.data.subarray(s,s+3);
  const ry=e.blinkRy??Math.max(e.ry,12);
  for(let y=e.y-ry;y<=e.y+ry;y++)for(let x=e.x-e.rx;x<=e.x+e.rx;x++){
   const k=(y*png.width+x)*4;if(!out.data[k+3])continue;
   if(((x-e.x)/e.rx)**2+((y-e.y)/ry)**2<=1){for(let c=0;c<3;c++)out.data[k+c]=y>=e.y+(e.lashTop??-1)&&y<=e.y+(e.lashBottom??9)?[54,32,22][c]:skin[c]}
  }
 }
 return out;
}
function powerCell(png,cfg){
 if(!cfg.ember)return png;
 const out={...png,data:Buffer.from(png.data)},[cx,cy]=cfg.ember.center,r=cfg.ember.radius;
 for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++){
  const k=(y*png.width+x)*4,d=Math.hypot(x-cx,y-cy)/r;
  if(d>1||!out.data[k+3]||png.data[k]<png.data[k+1]*1.25)continue;
  out.data[k]=Math.round(255-d*48);out.data[k+1]=Math.round(182-d*112);out.data[k+2]=Math.round(40-d*17);
 }
 return out;
}
/** Expand existing artwork across a bone, keeping its centreline and joints fixed. */
export function partWidthTransform(cfg,name){
 const scale=cfg.walk.widthScale??1;
 if(scale===1)return identity();
 const j=cfg.joints,side=name.startsWith('near')?'near':'far';
 let a,b;
 if(name==='torso'){
  a=[(j.nearHip[0]+j.farHip[0])/2,(j.nearHip[1]+j.farHip[1])/2];b=[a[0],a[1]-1];
 }else if(name.endsWith('UpperArm')){a=j[side+'Shoulder'];b=j[side+'Elbow'];}
 else if(name.endsWith('Forearm')){
  a=j[side+'Elbow'];const shoulder=j[side+'Shoulder'];b=[a[0]+a[0]-shoulder[0],a[1]+a[1]-shoulder[1]];
 }else if(name.endsWith('Thigh')){a=j[side+'Hip'];b=j[side+'Knee'];}
 else {a=j[side+'Ankle'];b=j[side+'Knee'];}
 const length=dist(a,b),nx=-(b[1]-a[1])/length,ny=(b[0]-a[0])/length,d=scale-1;
 const xx=1+d*nx*nx,xy=d*nx*ny,yy=1+d*ny*ny;
 return [xx,xy,xy,yy,a[0]-xx*a[0]-xy*a[1],a[1]-xy*a[0]-yy*a[1]];
}
/** Sample each art pixel directly. Keep the established floor/hip geometry and 2px outline. */
export function renderPackFrame(pack,{phase=null,blink=false,powered=false}={}){
 const isIdle=phase===null&&!!pack.idle;
 // A forearm held up against the chest (Silas carrying the clerk's ledger), about the elbow.
 const raise=pack.forearmRaise?rotate(-pack.forearmRaise,pack.cfg.joints.nearElbow):null;
 const idle=pack.cfg.idle;
 const cfg=isIdle?{...pack.cfg,sourceHeight:idle.sourceHeight,baseline:idle.baseline,eyes:idle.eyes,ember:idle.ember,
  order:['torso'],joints:{...pack.cfg.joints,nearHip:[idle.anchorX,0],farHip:[idle.anchorX,0]}}:pack.cfg;
 const k=(cfg.height-4)/cfg.sourceHeight,W=256,H=256;
 const hipX=(cfg.joints.nearHip[0]+cfg.joints.farHip[0])/2,ground=252;
 const data=Buffer.alloc(W*H*4),pose=phase===null?null:walkPose(cfg,phase);
 for(const name of cfg.order){
  let layer=isIdle?pack.idle:pack.layers[name];if(blink&&name==='torso')layer=closedEyes(layer,cfg);if(powered&&(name==='nearForearm'||isIdle))layer=powerCell(layer,cfg);
  const base=pose?pose.mats[name]:identity(),held=raise&&name==='nearForearm'&&!isIdle?mul(base,raise):base;
  const inv=inverse(pose?mul(held,partWidthTransform(cfg,name)):held);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const src=point(inv,[hipX+(x+.5-W/2)/k,cfg.baseline+(y+.5-ground)/k]);
   const sx=Math.floor(src[0]),sy=Math.floor(src[1]);if(sx<0||sy<0||sx>=1024||sy>=1536)continue;
   const a=(sy*1024+sx)*4;if(layer.data[a+3]<128)continue;
   layer.data.copy(data,(y*W+x)*4,a,a+4);
  }
 }
 snapToPalette(data,W);addOutline(data,W,H);addOutline(data,W,H);
 const out=new PNG({width:256,height:256});
 data.copy(out.data);
 return out;
}
async function stillFrame(file,cfg,powered=false,poseName=''){
 const k=(cfg.height-4)/cfg.sourceHeight;
 const rawPng=typeof file==='string'?PNG.sync.read(readFileSync(file)):file;
 const image=powered&&cfg.poseEmbers?.[poseName]?powerCell(rawPng,{...cfg,ember:cfg.poseEmbers[poseName]}):rawPng;
 const encoded=PNG.sync.write(image);
 const src=await sharp(encoded).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let l=src.info.width,t=src.info.height,r=0,b=0;
 for(let y=0;y<src.info.height;y++)for(let x=0;x<src.info.width;x++)if(src.data[(y*src.info.width+x)*4+3]>=128){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y)}
 const w=Math.round((r-l+1)*k),h=Math.round((b-t+1)*k);
 const cut=await sharp(encoded).extract({left:l,top:t,width:r-l+1,height:b-t+1}).resize(w,h,{kernel:'nearest'}).ensureAlpha().raw().toBuffer();
 const raw=Buffer.alloc(256*256*4),left=Math.round((256-w)/2),top=254-h;
 for(let y=0;y<h;y++)cut.copy(raw,((top+y)*256+left)*4,y*w*4,(y+1)*w*4);
 snapToPalette(raw,256);addOutline(raw,256,256);addOutline(raw,256,256);
 const buf=await sharp(raw,{raw:{width:256,height:256,channels:4}}).png().toBuffer();
 return PNG.sync.read(buf);
}
/** `top` drawn over `base` (same canvas): the opaque pixels of the overlay win. */
function over(base,top){
 if(base.width!==top.width||base.height!==top.height)throw Error('Overlay canvas differs from its pose');
 const out={...base,data:Buffer.from(base.data)};
 for(let k=0;k<out.data.length;k+=4)if(top.data[k+3]>=128)top.data.copy(out.data,k,k,k+4);
 return out;
}
/**
 * A disguise (rig.json `overlays.<name>`): the mask drawn into the head (torso layer) for walking and
 * standing, over the kneeling and lying drawings, and anything held (the ledger) over the forearm.
 * Disguised, he stands in the walk master's pose (the masks are drawn to it, not to idle.png).
 */
function disguise(pack,name){
 const o=pack.cfg.overlays?.[name];if(!o)throw Error('No overlay '+name+' in '+pack.dir);
 const read=f=>PNG.sync.read(readFileSync(join(pack.dir,f)));
 const layers={...pack.layers,torso:over(pack.layers.torso,read(o.stand))};
 if(o.nearForearm)layers.nearForearm=over(pack.layers.nearForearm,read(o.nearForearm));
 return {...pack,layers,master:over(pack.master,read(o.stand)),idle:undefined,
  poses:{kneel:over(read('kneel.png'),read(o.kneel)),lie:over(read('lie.png'),read(o.lie))}};
}
export async function buildLayeredCharacter(id,cfg){
 let pack=loadPack(join(art,cfg.layeredPack));const powered=!!cfg.powered;
 if(cfg.overlay)pack=disguise(pack,cfg.overlay);
 if(cfg.forearmRaise)pack={...pack,forearmRaise:cfg.forearmRaise};
 const stand=renderPackFrame(pack,{powered});
 // A mask over the eyes does not blink.
 const blink=cfg.noBlink?stand:renderPackFrame(pack,{powered,blink:true});
 const frames=[stand,blink,stand,blink,stand],tags=[['stand_down',0,0],['blink_down',1,1],['stand_side',2,2],['blink_side',3,3],['stand_up',4,4]];
 for(const direction of ['down','side','up']){const from=frames.length;for(let p=0;p<8;p++)frames.push(renderPackFrame(pack,{phase:p,powered}));tags.push(['walk_'+direction,from,frames.length-1])}
 for(const [name,file] of [['crouch','kneel.png'],['dead','lie.png']]){const still=pack.poses?.[file.replace('.png','')]??join(pack.dir,file);tags.push([name,frames.length,frames.length]);frames.push(await stillFrame(still,pack.cfg,powered,file.replace('.png','')))}
 tags.push(['fidget',frames.length,frames.length]);frames.push(blink);
 // Direction tags reuse the same side-on art. Alias equal frames instead of storing three copies.
 const unique=[],slots=frames.map(frame=>{let slot=unique.findIndex(f=>f.data.equals(frame.data));if(slot<0){slot=unique.length;unique.push(frame)}return slot});
 const cols=5,rows=Math.ceil(unique.length/cols),sheet=new PNG({width:cols*256,height:rows*256});
 unique.forEach((f,n)=>{for(let y=0;y<256;y++)f.data.copy(sheet.data,((Math.floor(n/cols)*256+y)*sheet.width+(n%cols)*256)*4,y*256*4,(y+1)*256*4)});
 const dir=cfg.dir??'',dest=join(art,'src',dir+'characters');mkdirSync(dest,{recursive:true});
 writeFileSync(join(dest,id+'.png'),encodeIndexed(sheet));
 const walk=walkMetadata(pack.cfg);
 const json={frames:frames.map((_,n)=>({filename:String(n),frame:{x:slots[n]%cols*256,y:Math.floor(slots[n]/cols)*256,w:256,h:256},duration:n>=5&&n<29?Math.round(walk.distancePerFrame/110*1000):1000,rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:256,h:256},sourceSize:{w:256,h:256}})),meta:{app:'Cinderfold layered rig v1',version:'1',image:id+'.png',format:'RGBA8888',size:{w:sheet.width,h:sheet.height},scale:'1',frameTags:tags.map(([name,from,to])=>({name,from,to,direction:'forward'})),walk}};
 writeFileSync(join(dest,id+'.json'),JSON.stringify(json,null,1)+'\n');
 // Mara's portraits come from the lit-gauntlet sheet; other characters name theirs (cfg.portraitId).
 const portraitId=id==='mara-gauntlet'?'mara':cfg.portraitId;
 if(portraitId){
  // The portrait strip contract: each mood (neutral, worried, angry) × closed/open mouth.
  const [x,y,w,h]=pack.cfg.portrait,images=[],moods=(cfg.moods??['neutral','worried','angry']).length;
  for(let mood=0;mood<moods;mood++)for(let talking=0;talking<2;talking++){
   const face={...pack.master,data:Buffer.from(pack.master.data)},m=pack.cfg.face.mouth;
   if(talking)for(let sy=m.y-m.ry;sy<=m.y+m.ry;sy++)for(let sx=m.x-m.rx;sx<=m.x+m.rx;sx++)if(((sx-m.x)/m.rx)**2+((sy-m.y)/m.ry)**2<=1){const o=(sy*1024+sx)*4;if(face.data[o+3]){face.data[o]=45;face.data[o+1]=22;face.data[o+2]=18}}
   for(const brow of pack.cfg.face.brows)if(mood)for(let sy=brow.y0;sy<=brow.y1;sy++)for(let sx=brow.x0;sx<=brow.x1;sx++){
    const dy=Math.round((sx-brow.x0)/(brow.x1-brow.x0)*(mood===1?5:-4)),o=(sy*1024+sx)*4,s=((sy+dy)*1024+sx)*4;pack.master.data.copy(face.data,o,s,s+4);
   }
   images.push({input:await sharp(face.data,{raw:{width:1024,height:1536,channels:4}}).extract({left:x,top:y,width:w,height:h}).resize(256,256,{kernel:'nearest'}).png().toBuffer(),left:(mood*2+talking)*256,top:0});
  }
  mkdirSync(join(art,'src',dir+'portraits'),{recursive:true});
  await sharp({create:{width:moods*512,height:256,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(images).png().toFile(join(art,'src',dir+'portraits',portraitId+'.png'));
 }
 console.log('  '+id+': eleven-piece rig, eight-frame walk.');
 return {frames,json,pack};
}
