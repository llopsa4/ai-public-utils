// Reuse the approved installed-regulator pixels; no painting or palette changes.
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const source=resolve(root,'art/sources/regulator-closeup/socket-pre-c7.png');
const output=resolve(root,'art/src/props/regulator-closeup-center.png');
const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const pixels=Buffer.alloc(80*80*4);
// The installed frame is the atlas's left 160px cell. Its brass centre is (80,76).
// A hard 2px-grid circular cut keeps the original RGB/alpha of the approved cap.
for(let y=0;y<80;y++)for(let x=0;x<80;x++){
  const gx=Math.floor(x/2)*2+1,gy=Math.floor(y/2)*2+1;
  if(Math.hypot(gx-40,gy-40)>36)continue;
  const from=((y+36)*info.width+x+40)*4;
  data.copy(pixels,(y*80+x)*4,from,from+4);
}
await sharp(pixels,{raw:{width:80,height:80,channels:4}}).png().toFile(output);
console.log('Prepared regulator centre: pre-C7 socket frame (socket-pre-c7.png); crop (40,36,80,80), centre (40,40), radius36, 2px grid.');
