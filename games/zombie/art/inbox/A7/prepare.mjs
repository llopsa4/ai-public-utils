// Sample ImageGen originals into the established palette/cell; no procedural artwork.
import {PNG} from 'pngjs';
import {readFileSync,writeFileSync,mkdirSync,cpSync,mkdtempSync,symlinkSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
const dir='art/inbox/A7';
const palette=JSON.parse(readFileSync('art/palette.json')).map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
const checks=[];
for(const facing of ['se','ne']){
 const src=PNG.sync.read(readFileSync(`${dir}/source-${facing}.png`));
 let l=src.width,r=-1,t=src.height,b=-1;
 for(let y=0;y<src.height;y++)for(let x=0;x<src.width;x++)if(src.data[(y*src.width+x)*4+3]>=160){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
 if(r<0)throw Error('Empty source');
 const scale=96/(b-t),cx=(l+r)/2,out=new PNG({width:128,height:128});
 const bounds=[128,128,-1,-1];
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  const sx=Math.round(cx+(x-64)/scale),sy=Math.round(b+(y-112)/scale);
  if(sx<l||sx>r||sy<t||sy>b)continue;
  const i=(sy*src.width+sx)*4;if(src.data[i+3]<160)continue;
  let best=palette[0],distance=Infinity;
  for(const rgb of palette){const d=rgb.reduce((s,v,k)=>s+(v-src.data[i+k])**2,0);if(d<distance){best=rgb;distance=d;}}
  out.data.set([...best,255],(y*128+x)*4);
  bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],y);
 }
 if(bounds[1]!==16||bounds[3]!==112||bounds[0]<1||bounds[2]>126)throw Error(`Bad bounds ${bounds}`);
 writeFileSync(`${dir}/fighter/idle_${facing}_0.png`,PNG.sync.write(out));
 checks.push({facing,cell:[128,128],bounds,anchor:[64,112],displayScale:.5,binaryAlpha:true,palette:true});
}
const preview=mkdtempSync(join(tmpdir(),'dead-woods-A7-'));
for(const name of ['src','scripts','vite.config.ts','package.json','tsconfig.json','playwright.config.ts','tests'])cpSync(name,join(preview,name),{recursive:true});
for(const name of ['manifest.json','palette.json','frames','atlas'])cpSync(join('art',name),join(preview,'art',name),{recursive:true});
symlinkSync(resolve('node_modules'),join(preview,'node_modules'),'junction');
// Scale only the old non-idle frames in the isolated preview to preserve runtime compatibility.
// They are review scaffolding, not A7 redraw deliverables.
const manifest=JSON.parse(readFileSync(join(preview,'art/manifest.json')));
for(const [anim,n] of Object.entries(manifest.figures.keys.fighter.anims))for(const f of ['se','ne'])for(let k=0;k<n;k++){
 const path=join(preview,'art/frames/fighter',`${anim}_${f}_${k}.png`);
 if(anim==='idle'){cpSync(`${dir}/fighter/idle_${f}_0.png`,path);continue;}
 const src=PNG.sync.read(readFileSync(path)),out=new PNG({width:128,height:128});
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(Math.floor(y/2)*src.width+Math.floor(x/2))*4;out.data.set(src.data.subarray(i,i+4),(y*128+x)*4);}
 writeFileSync(path,PNG.sync.write(out));
}
manifest.atlases.fighter.scale=2;
writeFileSync(join(preview,'art/manifest.json'),JSON.stringify(manifest,null,2));
mkdirSync(join(preview,'art/inbox/A7/fighter'),{recursive:true});
cpSync(`${dir}/fighter`,join(preview,'art/inbox/A7/fighter'),{recursive:true});
const main=join(preview,'src/main.ts');writeFileSync(main,readFileSync(main,'utf8').replace('new Phaser.Game({','(window as any).__artReviewGame = new Phaser.Game({'));
writeFileSync(`${dir}/local-preview-root.txt`,preview+'\n');
writeFileSync(`${dir}/checks.json`,JSON.stringify({checks,preview,tool:'built-in image_gen',note:'Idle gate only. Non-idles scaled solely as preview scaffolding; production untouched.'},null,2));
console.log(preview);
