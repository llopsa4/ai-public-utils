// Independent Kofi experiment. No dependency on, or changes to, the existing character rigs.
import {PNG} from 'pngjs';
import {snapToPalette,addOutline} from '../normalize.mjs';
export const I=[1,0,0,1,0,0];
export const point=(m,p)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
export const mul=(m,n)=>[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];
const move=(x,y)=>[1,0,0,1,x,y];
const turn=(a,p)=>{const c=Math.cos(a),s=Math.sin(a);return[c,s,-s,c,p[0]-c*p[0]+s*p[1],p[1]-s*p[0]-c*p[1]]};
const angle=(a,b)=>Math.atan2(b[1]-a[1],b[0]-a[0]);
const len=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const align=(a,b,c,d)=>mul(move(c[0]-a[0],c[1]-a[1]),turn(angle(c,d)-angle(a,b),a));
const inverse=m=>{const d=m[0]*m[3]-m[1]*m[2];return[m[3]/d,-m[1]/d,-m[2]/d,m[0]/d,(m[2]*m[5]-m[3]*m[4])/d,(m[1]*m[4]-m[0]*m[5])/d]};
export function poseAtDistance(cfg,distance){
 const phase=((distance/cfg.stride)%1+1)%1,mats={},feet={};
 const j=cfg.joints,hips=[(j.nearHip[0]+j.farHip[0])/2,j.nearHip[1]];
 const motion={};let drop=8;
 for(const [side,offset] of [['near',0],['far',.5]]){
  const q=(phase+offset)%1,stance=q<.5,t=(q%.5)*2;
  const x=hips[0]+(stance?cfg.stride/4-cfg.stride*t/2:-cfg.stride/4+cfg.stride*(1-Math.cos(Math.PI*t))/4);
  const sole=cfg.soles[side],roll=stance?(t<.2?-.14*(1-t/.2):t>.75?.14*(t-.75)/.25:0):.14*Math.cos(Math.PI*t);
  // A material point on the sole moves at exactly -root speed during stance.
  const pivot=stance?(t<.2?sole.heel:t>.75?sole.toe:sole.mid):sole.mid;
  const foot=mul(move(x-sole.mid[0],cfg.ground-sole.mid[1]-(stance?0:cfg.lift*Math.sin(Math.PI*t))),turn(roll,pivot));
  // Rotation is about a ground contact; correct the chosen contact onto the one floor line.
  if(stance)foot[5]+=cfg.ground-point(foot,pivot)[1];
  const target=point(foot,j[side+'Ankle']),hip=j[side+'Hip'];
  const l1=len(hip,j[side+'Knee']),l2=len(j[side+'Knee'],j[side+'Ankle']);
  drop=Math.max(drop,target[1]-hip[1]-Math.sqrt(Math.max(1,(l1+l2-3)**2-(target[0]-hip[0])**2)));
  motion[side]={foot,target,pivot,stance};
 }
 const pelvis=move(0,drop),torso=mul(pelvis,turn(.018,hips));mats.pelvis=pelvis;mats.torso=torso;
 for(const [side,offset] of [['near',0],['far',.5]]){
  const h=point(pelvis,j[side+'Hip']),k=j[side+'Knee'],a=j[side+'Ankle'],{target,foot,pivot,stance}=motion[side];
  const l1=len(j[side+'Hip'],k),l2=len(k,a),d=len(h,target);
  if(d>l1+l2+.001||d<Math.abs(l1-l2))throw Error('Unreachable foot target');
  const theta=angle(h,target)-Math.acos(Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*d))));
  const knee=[h[0]+l1*Math.cos(theta),h[1]+l1*Math.sin(theta)];
  mats[side+'Thigh']=align(j[side+'Hip'],k,h,knee);mats[side+'Shin']=align(k,a,knee,target);mats[side+'Foot']=foot;
  const swing=.22*Math.cos((phase+offset)*Math.PI*2);
  mats[side+'UpperArm']=mul(torso,turn(swing,j[side+'Shoulder']));
  mats[side+'Forearm']=mul(mats[side+'UpperArm'],turn(-.08-Math.abs(swing)*.25,j[side+'Elbow']));
  feet[side]={stance,contact:point(foot,pivot),ankle:target,knee};
 }
 mats.wrapBack=mul(pelvis,turn(.014*Math.sin(phase*2*Math.PI),hips));
 mats.wrapFront=mul(pelvis,turn(-.018*Math.sin(phase*2*Math.PI),hips));
 mats.belt=pelvis;mats.fur=torso;mats.quiver=torso;
 // The rigid bow shares the thigh angle, but hangs from a belt pivot rather than tearing its tab away.
 mats.bow=mul(pelvis,turn(Math.atan2(mats.nearThigh[1],mats.nearThigh[0]),[420,625]));
 return {mats,feet,phase};
}
export function render(pack,{distance=null,size=256,outfit='village'}={}){
 const cfg=pack.cfg,walking=distance!==null,pose=walking?poseAtDistance(cfg,distance):null;
 const layers=walking?pack.layers:{idle:pack.idle[outfit]},order=walking?cfg.order.filter(n=>outfit==='travel'||!['bow','quiver'].includes(n)):['idle'];
 const scale=(size-28)/cfg.sourceHeight,anchor=walking?cfg.anchor:cfg.idleAnchors[outfit],baseline=walking?cfg.ground:cfg.idleBaselines[outfit];
 const out=new PNG({width:size,height:size});
 for(const name of order){const layer=layers[name];if(!layer)continue;const inv=inverse(pose?.mats[name]??I);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const [sx,sy]=point(inv,[anchor+(x+.5-size/2)/scale,baseline+(y+.5-(size-5))/scale]);const ix=Math.floor(sx),iy=Math.floor(sy);
   if(ix<0||iy<0||ix>=layer.width||iy>=layer.height)continue;const p=(iy*layer.width+ix)*4;
   if(layer.data[p+3]>=128)layer.data.copy(out.data,(y*size+x)*4,p,p+4);
  }
 }
 snapToPalette(out.data,size);addOutline(out.data,size,size);addOutline(out.data,size,size);return out;
}
export function neutral(pack,outfit='village'){
 const out=new PNG({width:1024,height:1536});
 for(const name of pack.cfg.order){if(outfit==='village'&&['bow','quiver'].includes(name))continue;const layer=pack.layers[name];
  for(let p=0;p<out.data.length;p+=4)if(layer.data[p+3])layer.data.copy(out.data,p,p,p+4);
 }return out;
}
