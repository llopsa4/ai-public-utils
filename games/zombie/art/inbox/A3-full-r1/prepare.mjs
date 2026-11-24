// Technical extraction/nearest-palette sampling of ImageGen sources, not procedural artwork.
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, mkdirSync, cpSync, mkdtempSync, symlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
const dir='art/inbox/A3-full-r1', dest=dir+'/candidate/scout';
mkdirSync(dest,{recursive:true});
const palette=JSON.parse(readFileSync('art/palette.json')).map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
const poses=(a,n)=>Array.from({length:n},(_,i)=>[a,i]);
const sheets=[
 ['move',4,[poses('walk',4),poses('walk',4),poses('run',4),poses('run',4)],[100,100,96,96]],
 ['low',4,[poses('crouch',4),poses('crouch',4),poses('crawl',4),poses('crawl',4)],[70,70,32,32]],
 ['states',4,[[['hold',0],['work',0],['work',1]],[['hold',0],['work',0],['work',1]],poses('death',4),poses('death',4)],[96,96,100,100]],
 ['actions',3,[poses('shot',3),poses('shot',3),poses('club',3),poses('club',3),poses('throw',3),poses('throw',3)],[100,100,100,100,100,100]],
];
function bbox(p,l=0,t=0,r=p.width,b=p.height){let q={l:r,t:b,r:-1,b:-1};for(let y=t;y<b;y++)for(let x=l;x<r;x++)if(p.data[(y*p.width+x)*4+3]>=160){q.l=Math.min(q.l,x);q.r=Math.max(q.r,x);q.t=Math.min(q.t,y);q.b=Math.max(q.b,y);}return q;}
const checks=[];
for(const [sheet,cols,rows,heights] of sheets){
 const src=PNG.sync.read(readFileSync(`${dir}/${sheet}-source.png`));
 // Remove isolated alpha specks, retaining coherent weapon/muzzle-flash components.
 const seen=new Uint8Array(src.width*src.height);
 for(let i=0;i<seen.length;i++){
  if(seen[i]||src.data[i*4+3]<160)continue;
  const q=[i];seen[i]=1;
  for(let k=0;k<q.length;k++){const n=q[k],x=n%src.width,y=Math.floor(n/src.width);for(const m of [x>0?n-1:-1,x<src.width-1?n+1:-1,y>0?n-src.width:-1,y<src.height-1?n+src.width:-1])if(m>=0&&!seen[m]&&src.data[m*4+3]>=160){seen[m]=1;q.push(m);}}
  if(q.length<12)for(const n of q)src.data[n*4+3]=0;
 }
 for(let row=0;row<rows.length;row++){
  const edges=sheet==='low'?[0,370,740,990,1247]:Array.from({length:rows.length+1},(_,i)=>Math.round(i*src.height/rows.length));
  const boxes=rows[row].map((_,col)=>bbox(src,Math.round(col*src.width/cols),edges[row],Math.round((col+1)*src.width/cols),edges[row+1]));
  const scale=Math.min(heights[row]/Math.max(...boxes.map(b=>b.b-b.t)),116/Math.max(...boxes.map(b=>b.r-b.l)));
  for(let col=0;col<rows[row].length;col++){
   const [anim,n]=rows[row][col],facing=row%2?'ne':'se',b=boxes[col];
   if(b.r<0)throw Error(`Missing ${sheet} ${row} ${col}`);
   // Standing figures pivot over the middle of the feet; prone figures use the body centre.
   const feet=bbox(src,b.l,Math.max(b.t,b.b-Math.round((b.b-b.t)*.08)),b.r+1,b.b+1);
   const cx=(anim==='crawl'||(anim==='death'&&n>=2))?(b.l+b.r)/2:(feet.l+feet.r)/2;
   const out=new PNG({width:128,height:128});
   // Final body frame is centred on the ground anchor, within logical rows 72–120.
   const baseline=anim==='death'&&n===3?120:112;
   for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    const sx=Math.round(cx+(x-64)/scale),sy=Math.round(b.b+(y-baseline)/scale);
    if(sx<b.l||sx>b.r||sy<b.t||sy>b.b)continue;
    const i=(sy*src.width+sx)*4;if(src.data[i+3]<160)continue;
    let best=palette[0],d=Infinity;
    for(const rgb of palette){const dd=rgb.reduce((s,v,k)=>s+(v-src.data[i+k])**2,0);if(dd<d){best=rgb;d=dd;}}
    out.data.set([...best,255],(y*128+x)*4);
   }
   const name=`${anim}_${facing}_${n}.png`,bounds=bbox(out);
   if(bounds.l<1||bounds.r>126||bounds.t<1||bounds.b>126)throw Error(`Clipped ${name}: ${JSON.stringify(bounds)}`);
   writeFileSync(`${dest}/${name}`,PNG.sync.write(out));checks.push({name,sheet,bounds,scale});
  }
 }
}
for(const f of ['se','ne'])cpSync(`art/inbox/A3-review/trial-2x/idle_${f}_0.png`,`${dest}/idle_${f}_0.png`);
const manifest=JSON.parse(readFileSync('art/manifest.json'));
const ordered=[];for(const [a,count] of Object.entries(manifest.figures.keys.scout.anims))for(const f of ['se','ne'])for(let n=0;n<count;n++)ordered.push(`${a}_${f}_${n}.png`);
const contact=new PNG({width:8*128,height:Math.ceil(ordered.length/8)*128});
for(let y=0;y<contact.height;y++)for(let x=0;x<contact.width;x++)contact.data.set([75,79,73,255],(y*contact.width+x)*4);
ordered.forEach((name,k)=>{const p=PNG.sync.read(readFileSync(`${dest}/${name}`));for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;if(p.data[i+3])contact.data.set(p.data.subarray(i,i+4),((Math.floor(k/8)*128+y)*contact.width+(k%8)*128+x)*4);}});
writeFileSync(`${dir}/contact.png`,PNG.sync.write(contact));
writeFileSync(`${dir}/checks.json`,JSON.stringify({frames:ordered.length,checks,order:ordered,cell:[128,128],anchor:[64,112],tool:'built-in image_gen',note:'Full-set candidate; approved idle copied byte-for-byte. Shared runtime and art unchanged.'},null,2));
const preview=mkdtempSync(join(tmpdir(),'dead-woods-A3-full-'));
for(const name of ['src','scripts','vite.config.ts','package.json','tsconfig.json','playwright.config.ts','tests'])cpSync(name,join(preview,name),{recursive:true});
for(const name of ['manifest.json','palette.json','frames','atlas'])cpSync(join('art',name),join(preview,'art',name),{recursive:true});
cpSync(`${dir}/candidate`,join(preview,'art/inbox/A3-full-r1'),{recursive:true});
symlinkSync(resolve('node_modules'),join(preview,'node_modules'),'junction');
manifest.atlases.scout.scale=2;manifest.figures.keys.scout.status='final';manifest.keys.survivor_scout.size=[24,50];
writeFileSync(join(preview,'art/manifest.json'),JSON.stringify(manifest,null,2));
const main=join(preview,'src/main.ts');writeFileSync(main,readFileSync(main,'utf8').replace('new Phaser.Game({','(window as any).__artReviewGame = new Phaser.Game({'));
writeFileSync(`${dir}/local-preview-root.txt`,preview+'\n');
console.log(JSON.stringify({frames:ordered.length,preview}));
