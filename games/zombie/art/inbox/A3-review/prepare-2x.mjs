// Resolution trial only. Sample the preserved ImageGen originals at 2x density.
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, mkdirSync, cpSync, mkdtempSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const dir='art/inbox/A3-review', outdir=`${dir}/trial-2x`;
mkdirSync(outdir,{recursive:true});
const palette=JSON.parse(readFileSync('art/palette.json')).map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
const checks=[];
for(const facing of ['se','ne']) {
  const src=PNG.sync.read(readFileSync(`${dir}/source-${facing}.png`));
  let l=src.width,r=0,t=src.height,b=0;
  for(let y=0;y<src.height;y++)for(let x=0;x<src.width;x++)if(src.data[(y*src.width+x)*4+3]>=160){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
  const scale=100/(b-t),center=(l+r)/2,out=new PNG({width:128,height:128});
  let bounds=[128,128,-1,-1];
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    const sx=Math.round(center+(x-64)/scale),sy=Math.round(b+(y-112)/scale);
    if(sx<0||sy<0||sx>=src.width||sy>=src.height)continue;
    const i=(sy*src.width+sx)*4;if(src.data[i+3]<160)continue;
    let best=palette[0],distance=Infinity;
    for(const c of palette){const d=c.reduce((v,n,k)=>v+(n-src.data[i+k])**2,0);if(d<distance){best=c;distance=d;}}
    out.data.set([...best,255],(y*128+x)*4);
    bounds=[Math.min(bounds[0],x),Math.min(bounds[1],y),Math.max(bounds[2],x),Math.max(bounds[3],y)];
  }
  if(bounds[1]!==12||bounds[3]!==112)throw Error(`Wrong anchor/height ${bounds}`);
  writeFileSync(`${outdir}/idle_${facing}_0.png`,PNG.sync.write(out));
  checks.push({facing,cell:[128,128],bounds,anchor:[64,112],displayScale:.5,palette:true,binaryAlpha:true});
}
const baseline=readFileSync(`${dir}/local-preview-root.txt`,'utf8').trim();
const preview=mkdtempSync(join(tmpdir(),'dead-woods-eli-2x-'));
for(const name of ['src','scripts','art','vite.config.ts','package.json','tsconfig.json','playwright.config.ts','tests'])cpSync(join(baseline,name),join(preview,name),{recursive:true});
symlinkSync(resolve('node_modules'),join(preview,'node_modules'),'junction');
// Double every scout atlas cell; only the two idle frames gain source detail.
const jsonPath=join(preview,'art/atlas/scout.json'), pngPath=join(preview,'art/atlas/scout.png');
const atlas=JSON.parse(readFileSync(jsonPath)),old=PNG.sync.read(readFileSync(pngPath));
const doubled=new PNG({width:old.width*2,height:old.height*2});
for(let y=0;y<doubled.height;y++)for(let x=0;x<doubled.width;x++){
  const i=(Math.floor(y/2)*old.width+Math.floor(x/2))*4;doubled.data.set(old.data.subarray(i,i+4),(y*doubled.width+x)*4);
}
for(const [name,entry] of Object.entries(atlas.frames)){
  for(const k of ['x','y','w','h'])entry.frame[k]*=2;
  for(const prop of ['spriteSourceSize','sourceSize'])if(entry[prop])for(const k of Object.keys(entry[prop]))entry[prop][k]*=2;
  const match=name.match(/^scout_idle_(se|ne)_0$/);
  if(match){const frame=PNG.sync.read(readFileSync(`${outdir}/idle_${match[1]}_0.png`));PNG.bitblt(frame,doubled,0,0,128,128,entry.frame.x,entry.frame.y);}
}
if(atlas.meta?.size){atlas.meta.size.w*=2;atlas.meta.size.h*=2;}
writeFileSync(pngPath,PNG.sync.write(doubled));writeFileSync(jsonPath,JSON.stringify(atlas));
const units=join(preview,'src/render/units.ts');
let code=readFileSync(units,'utf8');
const needle='this.body = scene.add.image(0, 0, first.tex, first.frame);';
if(!code.includes(needle))throw Error('Renderer changed; review trial patch');
code=code.replace(needle,needle+"\n    if (this.key === 'scout') this.body.setScale(0.5);");
writeFileSync(units,code);
// A debug-only handle permits verification of the rendered frame dimensions.
const main=join(preview,'src/main.ts');
writeFileSync(main,readFileSync(main,'utf8').replace('new Phaser.Game({','(window as any).__resolutionTrial = new Phaser.Game({'));
writeFileSync(`${outdir}/checks.json`,JSON.stringify({checks,preview,baseline,note:'Trial only; no standing rule or shared runtime change.'},null,2)+'\n');
writeFileSync(`${outdir}/local-preview-root.txt`,preview+'\n');
console.log(preview);
