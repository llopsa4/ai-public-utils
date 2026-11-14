// Install only the three explicitly approved replacements from preserved Codex originals.
import { copyFileSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { snapToPalette } from '../../normalize.mjs';
const here=dirname(fileURLToPath(import.meta.url)),art=resolve(here,'../..');
const housing=resolve(art,'src/props/regulator-closeup-housing.png');
if(!existsSync(resolve(here,'regulator-housing-before.png')))copyFileSync(housing,resolve(here,'regulator-housing-before.png'));
async function install(name,file,w,h,{trim=false,grid=false}={}){
 let input=sharp(resolve(here,`${name}-generated.png`)).ensureAlpha();
 if(trim)input=input.trim();
 const {data,info}=await input.resize(grid?w/2:w,grid?h/2:h,{fit:trim?'contain':'fill',background:'#00000000',kernel:'lanczos3'}).raw().toBuffer({resolveWithObject:true});
 for(let i=3;i<data.length;i+=4)data[i]=data[i]>=128?255:0;
 snapToPalette(data,info.width);
 const out=resolve(art,'src',file);mkdirSync(dirname(out),{recursive:true});
 await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).resize(w,h,{kernel:'nearest'}).png().toFile(out);
}
await install('cursor','ui/cursor-work-glove.png',32,32,{trim:true});
await install('regulator','props/regulator-closeup-housing.png',512,320,{grid:true});
await install('strain','ui/strain-warning.png',128,128,{trim:true});
const path=resolve(art,'status.json'),status=JSON.parse(readFileSync(path,'utf8'));
for(const id of ['cursor-work-glove','regulator-closeup-housing','strain-warning'])status[id]='final';
writeFileSync(path,JSON.stringify(status,null,1)+'\n');
console.log('Installed cursor, regulator housing and strain warning; other art untouched.');
