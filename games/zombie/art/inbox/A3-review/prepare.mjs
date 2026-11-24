// Technical sizing and palette snapping of ImageGen artwork, per art/STYLE.md.
// Run from games/zombie; shared installed frames remain untouched.
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, mkdirSync, cpSync, mkdtempSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const review = 'art/inbox/A3-review', dest = 'art/inbox/A3/scout';
mkdirSync(dest, { recursive: true });
const palette = JSON.parse(readFileSync('art/palette.json')).map(h => [1,3,5].map(i => parseInt(h.slice(i,i+2),16)));
const checks = [];
const contact = new PNG({width:768,height:256});
const paths = ['art/frames/fighter/idle_se_0.png'];
for (const facing of ['se','ne']) {
  const src = PNG.sync.read(readFileSync(`${review}/source-${facing}.png`));
  let left=src.width,right=0,top=src.height,bottom=0;
  for(let y=0;y<src.height;y++) for(let x=0;x<src.width;x++) if(src.data[(y*src.width+x)*4+3]>=160) {
    left=Math.min(left,x); right=Math.max(right,x); top=Math.min(top,y); bottom=Math.max(bottom,y);
  }
  const scale=50/(bottom-top), center=(left+right)/2;
  const out=new PNG({width:64,height:64});
  let bounds=[64,64,-1,-1];
  for(let y=0;y<64;y++) for(let x=0;x<64;x++) {
    const sx=Math.round(center+(x-32)/scale), sy=Math.round(bottom+(y-56)/scale);
    if(sx<0||sy<0||sx>=src.width||sy>=src.height) continue;
    const i=(sy*src.width+sx)*4;
    if(src.data[i+3]<160) continue;
    let best=palette[0], distance=Infinity;
    for(const c of palette) { const d=c.reduce((v,n,k)=>v+(n-src.data[i+k])**2,0); if(d<distance){distance=d;best=c;} }
    out.data.set([...best,255],(y*64+x)*4);
    bounds=[Math.min(bounds[0],x),Math.min(bounds[1],y),Math.max(bounds[2],x),Math.max(bounds[3],y)];
  }
  const path=`${dest}/idle_${facing}_0.png`;
  writeFileSync(path,PNG.sync.write(out)); paths.push(path);
  if(bounds[1]!==6||bounds[3]!==56) throw Error(`Wrong height: ${bounds}`);
  checks.push({path,bounds,cell:[64,64],anchor:[32,56],palette:true,binaryAlpha:true});
}
for(let n=0;n<paths.length;n++) {
  const src=PNG.sync.read(readFileSync(paths[n]));
  for(let y=0;y<256;y++) for(let x=0;x<256;x++) {
    const i=(Math.floor(y/4)*64+Math.floor(x/4))*4, j=(y*768+n*256+x)*4;
    const rgb=src.data[i+3] ? [...src.data.subarray(i,i+3),255] : [75,79,73,255];
    contact.data.set(rgb,j);
  }
}
writeFileSync(`${review}/contact.png`,PNG.sync.write(contact));
writeFileSync(`${review}/checks.json`,JSON.stringify(checks,null,2)+'\n');
const preview=mkdtempSync(join(tmpdir(),'dead-woods-eli-'));
for(const name of ['src','scripts','vite.config.ts','package.json','tsconfig.json','playwright.config.ts','tests']) cpSync(name,join(preview,name),{recursive:true});
mkdirSync(join(preview,'art'),{recursive:true});
for(const name of ['manifest.json','palette.json','frames','atlas']) cpSync(join('art',name),join(preview,'art',name),{recursive:true});
cpSync('art/inbox/A3',join(preview,'art/inbox/A3'),{recursive:true});
symlinkSync(resolve('node_modules'),join(preview,'node_modules'),'junction');
writeFileSync(`${review}/local-preview-root.txt`,preview+'\n');
console.log(JSON.stringify({checks,preview}));
