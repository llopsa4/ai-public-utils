// Only geometric test images. Existing approved Kofi rigs and illustrations are never imported.
import { registerArt, type AsepriteSheet } from '../../game/assets';
import { TEST_PROPS, ROOMS } from './rooms';
import { ITEMS } from './data';
import { BOW_DRAW_SHEET } from './bow';

const pngs=import.meta.glob('../../../art/src/kofi1-test/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const jsons=import.meta.glob('../../../art/src/kofi1-test/*.json',{eager:true,import:'default'}) as Record<string,AsepriteSheet>;
const png=(name:string)=>{const path=pngs[`../../../art/src/kofi1-test/${name}.png`];if(!path)throw new Error(`Missing Kofi test image: ${name}`);return path;};
export function registerChapterArt():void{
 const sheets:Record<string,{png:string;json:AsepriteSheet}>={};
 for(const name of ['kofi-test-hero','kofi-test-travel',BOW_DRAW_SHEET,...new Set(TEST_PROPS.map(p=>`prop-${p.room}-${p.id}`))]){
  const key=name.startsWith('prop-')?`kofi-${name}`:name;
  sheets[key]={png:png(name),json:jsons[`../../../art/src/kofi1-test/${name}.json`]};
 }
 const portraits=Object.fromEntries(['oweli','saluna','tohani','ahyeli','enali','deyu','huska','survivor','lateVolunteer','waterVolunteer','breakfastVolunteer'].map(w=>[`extra-kofi-${w}`,png(`portrait-${w}`)]));
 registerArt({rooms:Object.fromEntries(Object.keys(ROOMS).map(id=>[`kofi-room-${id}`,png(`room-${id}`)])),sheets,lazySheets:Object.keys(sheets),
  items:Object.fromEntries(ITEMS.map(id=>[id,png(`item-${id}`)])),portraits:{...portraits,'kofi-test-hero':png('portrait-hero')},
 });
}
