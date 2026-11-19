// Approved C6 post-export skin pass. Inputs are immutable pre-colour exports; never run on an already recoloured sheet.
import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';
import assert from 'node:assert/strict';
import {snapToPalette} from '../../../normalize.mjs';
import {encodeIndexed} from '../../../png.mjs';
const here=dirname(fileURLToPath(import.meta.url));
assert.ok(process.argv[2],'Provide a scratch output directory');
const root=resolve(process.argv[2]);
assert.ok(root!==here,'Output must be separate from the source pack');
const bounds=p=>{let l=p.width,t=p.height,r=-1,b=-1;for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++)if(p.data[(y*p.width+x)*4+3]){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}return{left:l,top:t,width:r-l+1,height:b-t+1};};

// Recolour existing registered sheet pixels only. The generated full-figure edit is a
// colour reference; none of its geometry/alpha or re-rendered costume is installed.
mkdirSync(join(root,'candidate/intro/characters'),{recursive:true});mkdirSync(join(root,'candidate/intro/portraits'),{recursive:true});
const sheetFile=join(here,'sheet-before.png'),jsonFile=join(here,'atlas.json');
const sheet=PNG.sync.read(readFileSync(sheetFile)),before=Buffer.from(sheet.data),j=JSON.parse(readFileSync(jsonFile));
const mask=Buffer.alloc(sheet.data.length),seen=new Set();
const warm=(data,p,cheek=0,lip=false)=>{
 const r=data[p],g=data[p+1],b=data[p+2],l=.2126*r+.7152*g+.0722*b;
 // Skin-coloured shade only; leave outlines, eyes, hair and cool armour intact.
 if(data[p+3]<128||l<70||r<g-5||g<b-5||r-b>100||r-g>70)return false;
 if(lip){data[p]=Math.min(255,r+12);data[p+1]=Math.max(0,g-3);data[p+2]=Math.min(255,b+2);}
 else if(l>208&&r-b<35){data[p]=229;data[p+1]=207;data[p+2]=186;}
 else{data[p]=Math.min(255,Math.round(r+18+cheek*6));data[p+1]=Math.min(255,Math.round(g+4-cheek*2));data[p+2]=Math.max(0,Math.round(b-5+cheek));}
 return true;
};
let changed=0;
for(let n=0;n<j.frames.length;n++){
 const f=j.frames[n].frame,key=f.x+','+f.y;if(seen.has(key))continue;seen.add(key);
 const frame=new PNG({width:256,height:256});for(let y=0;y<256;y++)sheet.data.copy(frame.data,y*256*4,((f.y+y)*sheet.width+f.x)*4,((f.y+y)*sheet.width+f.x+256)*4);
 const b=bounds(frame),lying=b.width>b.height*1.6;
 let cx,cy,rx,ry;
 if(lying){cx=b.left+b.width-20;cy=b.top+b.height/2;rx=20;ry=Math.min(22,b.height/2);}
 else{
  let total=0,sum=0;for(let y=b.top+7;y<=Math.min(b.top+22,b.top+b.height-1);y++)for(let x=0;x<256;x++)if(frame.data[(y*256+x)*4+3]){sum+=x;total++;}
  cx=(total?sum/total:128)+5;cy=b.top+20;rx=12;ry=20;
 }
 for(let y=Math.max(0,Math.floor(cy-ry));y<Math.min(256,cy+ry);y++)for(let x=Math.max(0,Math.floor(cx-rx));x<Math.min(256,cx+rx);x++){
  if(((x-cx)/rx)**2+((y-cy)/ry)**2>1)continue;
  const p=((f.y+y)*sheet.width+f.x+x)*4,cheek=Math.exp(-(((x-cx-3)/7)**2+((y-cy)/5)**2));
  if(warm(sheet.data,p,cheek,y>cy+6&&y<cy+11)){mask[p]=255;mask[p+3]=255;changed++;}
 }
}
// Palette-normalize altered pixels only, preserving every untouched RGB and all alpha.
const normalized=Buffer.from(sheet.data);snapToPalette(normalized,sheet.width);
for(let p=0;p<sheet.data.length;p+=4){if(mask[p+3])normalized.copy(sheet.data,p,p,p+3);assert.equal(sheet.data[p+3],before[p+3]);if(!mask[p+3])assert.ok(sheet.data.subarray(p,p+4).equals(before.subarray(p,p+4)));}
writeFileSync(join(root,'candidate/intro/characters/sigrid.png'),encodeIndexed(sheet));copyFileSync(jsonFile,join(root,'candidate/intro/characters/sigrid.json'));
writeFileSync(join(root,'sigrid-skin-mask.png'),encodeIndexed({width:sheet.width,height:sheet.height,data:mask}));
const portrait=PNG.sync.read(readFileSync(join(here,'portrait-before.png'))),pb=Buffer.from(portrait.data);let pc=0;
for(let k=0;k<portrait.width/256;k++)for(let y=42;y<171;y++)for(let x=87;x<165;x++){
 const sx=x*370/256+350,sy=y*370/256;
 // Standing face/neck polygon approximated by two ellipses inside the registered crop.
 const face=((sx-532)/61)**2+((sy-151)/82)**2<1,neck=((sx-515)/34)**2+((sy-221)/35)**2<1;
 if(!face&&!neck)continue;
 if(((x-116)/9)**2+((y-90)/5)**2<1||((x-147)/9)**2+((y-90)/5)**2<1)continue;
 const p=(y*portrait.width+k*256+x)*4,cheek=Math.exp(-(((sx-523)/20)**2+((sy-159)/14)**2));
 const lip=sy>178&&sy<193&&sx>532&&sx<567;
 if(warm(portrait.data,p,cheek,lip)){const rgba=Buffer.from(portrait.data.subarray(p,p+4));snapToPalette(rgba,1);rgba.copy(portrait.data,p,0,3);pc++;}
}
for(let p=3;p<portrait.data.length;p+=4)assert.equal(portrait.data[p],pb[p]);
writeFileSync(join(root,'candidate/intro/portraits/sigrid.png'),encodeIndexed(portrait));
