/** Very simple test art only: rectangles, circles and labels. Never draws finished game art. */
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { TEST_PROPS, ROOMS } from '../src/chapters/kofi1/rooms';
import { ITEMS } from '../src/chapters/kofi1/data';
import { BOW_DRAW_FRAME, BOW_DRAW_SHEET } from '../src/chapters/kofi1/bow';
import type { ArtEntry } from '../art/manifest.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const base=resolve(root,'art/src/kofi1-test');
const statusFile=resolve(root,'art/status.json');
const statuses=existsSync(statusFile)?JSON.parse(readFileSync(statusFile,'utf8')):{};
const entries:ArtEntry[]=[];
const manifestPath=resolve(root,'art/kofi-placeholder-manifest.json');
const previous:ArtEntry[]=existsSync(manifestPath)?JSON.parse(readFileSync(manifestPath,'utf8')):[];
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
const svg=(w:number,h:number,body:string)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`);
const label=(s:string,x:number,y:number,size=14)=>`<text x="${x}" y="${y}" text-anchor="middle" fill="#f5ecd8" font-family="sans-serif" font-size="${size}">${esc(s)}</text>`;
async function image(id:string,kind:ArtEntry['kind'],name:string,w:number,h:number,body:string,extra:Partial<ArtEntry>={}){
 if(statuses[id]==='final')throw new Error(`Refusing to overwrite approved art: ${id}`);
 const file=`kofi1-test/${name}.png`,out=resolve(root,'art/src',file);
 mkdirSync(dirname(out),{recursive:true});await sharp(svg(w,h,body)).png().toFile(out);
 entries.push({id,kind,file,size:{w,h},anchor:kind==='room'?'top-left':kind==='item'||kind==='portrait'?'none':'bottom-centre',chapter:'kofi1',status:'placeholder',generator:'../scripts/kofi-placeholders.ts',subject:`FUNCTIONAL PLACEHOLDER ONLY: ${name}. Simple shapes and labels; replace after logic testing.`,...extra});
}
function sheet(name:string,w:number,h:number,tags:string[],frames=1){
 const data={frames:Array.from({length:frames},(_,i)=>({filename:`frame${i}`,frame:{x:i*w,y:0,w,h},duration:250,rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w,h},sourceSize:{w,h}})),meta:{image:`${name}.png`,size:{w:w*frames,h},scale:'1',frameTags:tags.map((name,i)=>({name,from:frames===1?0:i%frames,to:frames===1?0:i%frames,direction:'forward'}))}};
 writeFileSync(resolve(base,`${name}.json`),JSON.stringify(data,null,2)+'\n');
}
for(const room of Object.values(ROOMS)){
 await image(`kofi-room-${room.id}`,'room',`room-${room.id}`,1280,720,`<rect width="1280" height="720" fill="#283d3a"/><rect y="610" width="1280" height="110" fill="#6d6855"/><path d="M0 610H1280" stroke="#baa889" stroke-width="4"/>${label(`TEST PLACEHOLDERS · ${room.id}`,640,50,24)}`);
}
const actorTags=['stand_side','stand_up','stand_down','walk_side','walk_up','walk_down','blink_side','blink_up','blink_down','crouch','dead'];
for(const name of ['kofi-test-hero','kofi-test-travel']){
 await image(name,'character',name,80,224,`<circle cx="40" cy="33" r="22" fill="#805938"/><rect x="17" y="57" width="46" height="96" fill="${name.endsWith('travel')?'#587a62':'#b49b69'}"/><path d="M25 153V220M55 153V220" stroke="#805938" stroke-width="16"/>`,{sheet:`kofi1-test/${name}.json`,height:224,tags:actorTags});
 sheet(name,80,224,actorTags);
}
// Two directions share the same foot point and canvas. Draw only circles, boxes and lines.
// The bent limb and triangular, pulled-back string make the tension readable at game scale.
const drawnBody='<circle cx="112" cy="33" r="22" fill="#805938"/><rect x="89" y="57" width="46" height="96" fill="#587a62"/><path d="M97 153V220M127 153V220" stroke="#805938" stroke-width="16"/><path d="M116 77L181 90M105 77L83 96L110 90" fill="none" stroke="#a87948" stroke-width="10" stroke-linecap="round"/><path d="M180 30Q222 90 180 150" fill="none" stroke="#c4a26b" stroke-width="8"/><path d="M180 30L110 90L180 150" fill="none" stroke="#f5ecd8" stroke-width="3"/><path d="M110 90H210" stroke="#c4a26b" stroke-width="4"/><path d="M210 85L220 90L210 95Z" fill="#d3dad4"/>';
await image(BOW_DRAW_SHEET,'character',BOW_DRAW_SHEET,BOW_DRAW_FRAME*2,BOW_DRAW_FRAME,
 drawnBody+`<g transform="translate(${BOW_DRAW_FRAME*2},0) scale(-1,1)">${drawnBody}</g>`,
 {sheet:`kofi1-test/${BOW_DRAW_SHEET}.json`,frame:{w:BOW_DRAW_FRAME,h:BOW_DRAW_FRAME},height:224,tags:['draw_right','draw_left']});
sheet(BOW_DRAW_SHEET,BOW_DRAW_FRAME,BOW_DRAW_FRAME,['draw_right','draw_left'],2);
const props=new Map(TEST_PROPS.map(p=>[`${p.room}-${p.id}`,p]));
for(const [id,p] of props){
 const name=`prop-${id}`,title=p.label.length>23?p.label.slice(0,21)+'…':p.label;
 const frame=(x:number,color:string)=>`<g transform="translate(${x},0)"><rect x="2" y="2" width="132" height="60" rx="3" fill="${color}" stroke="#c4b78e" stroke-width="3"/>${p.person?'<circle cx="15" cy="14" r="7" fill="#e6be89"/>':''}${label(title,68,37,11)}</g>`;
 await image(`kofi-prop-${id}`,'object',name,272,64,frame(0,p.person?'#425f77':'#5f6654')+frame(136,'#3d785b'),{sheet:`kofi1-test/${name}.json`,frame:{w:136,h:64},tags:['idle','done']});
 sheet(name,136,64,['idle','done'],2);
}
for(const id of ITEMS)await image(`item-${id}`,'item',`item-${id}`,64,64,`<rect x="2" y="2" width="60" height="60" fill="#595c47" stroke="#c4b78e" stroke-width="3"/>${label(id.slice(4,12),32,36,10)}`);
for(const who of ['hero','oweli','saluna','tohani','ahyeli','enali','deyu','huska','survivor','lateVolunteer','waterVolunteer','breakfastVolunteer']){
 const name=`portrait-${who}`;
 await image(`kofi-${name}`,'portrait',name,128,64,`<rect width="128" height="64" fill="#34463d"/><circle cx="32" cy="28" r="20" fill="#a87948"/><circle cx="96" cy="28" r="20" fill="#a87948"/>${label(who.slice(0,8),32,59,10)}${label(who.slice(0,8),96,59,10)}`,{moods:['neutral']});
}
const retained=new Set(entries.flatMap(e=>[e.file,...(e.sheet?[e.sheet]:[])]));
for(const old of previous)for(const file of [old.file,...(old.sheet?[old.sheet]:[])]){
 const absolute=resolve(root,'art/src',file);
 if(!retained.has(file)&&absolute.startsWith(base+'/')===false&&absolute.startsWith(base+'\\')===false)throw new Error(`Invalid old placeholder path: ${absolute}`);
 if(!retained.has(file)&&statuses[old.id]!=='final'&&existsSync(absolute))unlinkSync(absolute);
}
writeFileSync(manifestPath,JSON.stringify(entries,null,2)+'\n');
console.log(`Generated ${entries.length} simple Kofi test images under art/src/kofi1-test only.`);
