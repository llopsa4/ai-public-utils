import fs from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {PNG} from 'pngjs';
import {render,neutral} from './renderer.mjs';
const root=fileURLToPath(new URL('../sources/characters/kofi-standing-rig/',import.meta.url));
const review=fileURLToPath(new URL('../inbox/kofi-rig-from-standing/',import.meta.url));
await fs.mkdir(review,{recursive:true});
const W=1024,H=1536,blank=()=>new PNG({width:W,height:H}),at=(x,y)=>(y*W+x)*4;
function clean(name){const p=PNG.sync.read(readFileSync(root+'raw/'+name+'.png'));if(p.width!==W||p.height!==H)throw Error(name+' source canvas');
 for(let k=0;k<p.data.length;k+=4)if(p.data[k+3]<128)p.data.fill(0,k,k+4);else p.data[k+3]=255;return p;}
function cut(p,test){const out=blank();for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(test(x,y))p.data.copy(out.data,at(x,y),at(x,y),at(x,y)+4);return out;}
function polygon(x,y,p){let hit=false;for(let a=0,b=p.length-1;a<p.length;b=a++){const [ax,ay]=p[a],[bx,by]=p[b];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)hit=!hit;}return hit;}
function over(a,b){const p={...a,data:Buffer.from(a.data)};for(let k=0;k<p.data.length;k+=4)if(b.data[k+3])b.data.copy(p.data,k,k,k+4);return p;}
async function registered(p,scale,from,to){const out=blank();for(let y=0;y<H;y++)for(let x=0;x<W;x++){const sx=Math.floor(from[0]+(x-to[0])/scale),sy=Math.floor(from[1]+(y-to[1])/scale);if(sx>=0&&sx<W&&sy>=0&&sy<H)p.data.copy(out.data,at(x,y),at(sx,sy),at(sx,sy)+4);}return out;}
const profile=clean('profile'),body=clean('body-underpainting'),arms=clean('arms'),gear=clean('gear');
const layers={};
// New anatomy is painted beneath the costume. Head and the uncovered chest strap retain profile pixels.
layers.torso=cut(body,(x,y)=>y<850);
layers.torso=over(layers.torso,cut(profile,(x,y)=>y<280||polygon(x,y,[[428,291],[483,317],[558,362],[595,442],[590,472],[566,434],[531,384],[461,345]])));
const j={nearShoulder:[390,400],nearElbow:[370,550],farShoulder:[550,405],farElbow:[570,565],nearHip:[430,820],farHip:[535,820],nearKnee:[410,1085],farKnee:[535,1070],nearAnkle:[395,1370],farAnkle:[530,1350]};
for(const [side,sourceX,to] of [['near',320,j.nearShoulder],['far',650,j.farShoulder]]){
 const arm=await registered(cut(arms,(x)=>side==='near'?x<480:x>=480),.68,[sourceX,470],to);
 const elbow=j[side+'Elbow'];layers[side+'UpperArm']=cut(arm,(x,y)=>y<=elbow[1]+30);layers[side+'Forearm']=cut(arm,(x,y)=>y>=elbow[1]-30);
}
// Full upper thighs come from the concealed-surface drawing; lower legs use the new profile.
const legs=over(body,cut(profile,(x,y)=>y>=1000));
const nearPoly=[[380,805],[505,805],[510,970],[477,1060],[464,1160],[450,1320],[485,1390],[570,1440],[570,1490],[325,1490],[325,1370],[350,1260],[345,1160],[365,1070]];
for(const side of ['near','far']){
 const leg=cut(legs,(x,y)=>y>=805&&(side==='near'?polygon(x,y,nearPoly):x>=475&&y<=1455));
 const knee=j[side+'Knee'][1],ankle=side==='near'?1345:1325;
 layers[side+'Thigh']=cut(leg,(x,y)=>y<knee+35);layers[side+'Shin']=cut(leg,(x,y)=>y>=knee-35&&y<ankle+35);layers[side+'Foot']=cut(leg,(x,y)=>y>=ankle-35);
}
const wrapPoly=[[420,630],[583,632],[614,725],[622,905],[612,966],[570,982],[535,964],[490,987],[441,965],[380,988],[369,928],[375,812],[393,716]];
layers.wrapBack=cut(profile,(x,y)=>polygon(x,y,wrapPoly)&&x>=498);layers.wrapFront=cut(profile,(x,y)=>polygon(x,y,wrapPoly)&&x<498);
layers.belt=cut(profile,(x,y)=>(x>=417&&x<=596&&y>=568&&y<644)||polygon(x,y,[[585,639],[610,651],[625,703],[619,735],[583,734],[576,700]]));
layers.fur=cut(profile,(x,y)=>polygon(x,y,[[311,425],[325,359],[341,307],[407,263],[452,252],[511,289],[527,333],[513,379],[472,407],[415,421],[370,420]]));
// Gear uses a single uniform registration per object, never frame-specific scaling or deformation.
layers.bow=await registered(cut(gear,x=>x<500),.34,[365,425],[420,625]);
layers.quiver=await registered(cut(gear,x=>x>=500),.33,[680,650],[325,405]);
const cfg={version:'kofi-standing-v1',canvas:[W,H],sourceHeight:1420,ground:1481,anchor:482,stride:280,lift:36,joints:j,
 soles:{near:{heel:[348,1478],mid:[439,1481],toe:[550,1480]},far:{heel:[490,1445],mid:[592,1450],toe:[696,1440]}},
 idleAnchors:{village:495,travel:495},idleBaselines:{village:1494,travel:1494},
 order:['quiver','farUpperArm','farForearm','wrapBack','farThigh','farShin','farFoot','nearThigh','nearShin','nearFoot','torso','wrapFront','belt','bow','nearUpperArm','fur','nearForearm'],
 provenance:'New source artwork and independent renderer. Original standing designs only. No existing rig dependency.',facing:'right only; opposite-facing asymmetry requires separately drawn sources'};
const pack={cfg,layers,idle:{village:clean('standing-village'),travel:clean('standing-travel')}};
await fs.writeFile(root+'rig.json',JSON.stringify(cfg,null,2)+'\n');
for(const [name,png] of Object.entries(layers))await fs.writeFile(root+name+'.png',PNG.sync.write(png));
for(const outfit of ['village','travel']){
 await fs.writeFile(root+`idle-${outfit}.png`,PNG.sync.write(pack.idle[outfit]));await fs.writeFile(root+`neutral-${outfit}.png`,PNG.sync.write(neutral(pack,outfit)));
 const frames=Array.from({length:16},(_,i)=>render(pack,{distance:i*cfg.stride/16,outfit})),pngs=frames.map(p=>PNG.sync.write(p));
 await sharp({create:{width:4096,height:256,channels:4,background:'#0000'}}).composite(pngs.map((input,i)=>({input,left:i*256,top:0}))).png().toFile(root+`walk-${outfit}.png`);
 await fs.writeFile(root+`walk-${outfit}.json`,JSON.stringify({image:`walk-${outfit}.png`,frameSize:[256,256],anchor:[128,251],tags:{walk_right:[0,15]},sourceDistancePerFrame:cfg.stride/16,renderedDistancePerFrame:cfg.stride/16*(256-28)/cfg.sourceHeight,previewMsPerFrame:50,note:'Advance by distance travelled, not preview time. No left-facing mirror or runtime installation.'},null,2)+'\n');
 await sharp({create:{width:1024,height:1024,channels:4,background:'#30261f'}}).composite(pngs.map((input,i)=>({input,left:i%4*256,top:Math.floor(i/4)*256}))).png().toFile(review+outfit+'-frames.png');
 const stack=await sharp({create:{width:256,height:4096,channels:4,background:'#30261f'}}).composite(pngs.map((input,i)=>({input,left:0,top:i*256}))).raw().toBuffer();
 await sharp(stack,{raw:{width:256,height:4096,channels:4,pageHeight:256}}).gif({delay:Array(16).fill(50),loop:0}).toFile(review+outfit+'-walk.gif');
 await fs.writeFile(review+outfit+'-idle.png',PNG.sync.write(render(pack,{outfit})));
}
const tiles=[];for(const [i,name] of cfg.order.entries()){const tile=await sharp(PNG.sync.write(layers[name])).resize(256,384).png().toBuffer();tiles.push({input:await sharp(tile).composite([{input:Buffer.from(`<svg width="256" height="384"><text x="8" y="20" fill="white" font-size="16">${name}</text></svg>`)}]).png().toBuffer(),left:i%5*256,top:Math.floor(i/5)*384});}
await sharp({create:{width:1280,height:1536,channels:4,background:'#30261f'}}).composite(tiles).png().toFile(review+'layers.png');
await sharp(PNG.sync.write(neutral(pack))).composite([{input:Buffer.from(`<svg width="1024" height="1536">${Object.values(j).map(([x,y])=>`<circle cx="${x}" cy="${y}" r="8" fill="#ffbb45" stroke="black" stroke-width="3"/>`).join('')}<path d="M200 ${cfg.ground}H800" stroke="#ffbb45" stroke-width="3"/></svg>`)}]).png().toFile(review+'joints.png');
console.log('Built independent Kofi rig: 11 body pieces, 4 costume layers, 2 rigid gear layers; original standing idles; 16 distance-driven frames per outfit.');
