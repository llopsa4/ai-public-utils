import { EQUIPMENT } from '../content/equipment';
export function EquipmentIcon({id}:{id:string}){
  const slot=EQUIPMENT[id].slot;
  const path=slot==='gauntlet'?'M8 25V13h3V7h3v6h3V5h3v8h3V8h3v13l-6 8H12ZM8 16l-4-3v8l8 8':slot==='armor'?'m11 5-7 7 5 5 3-3v15h16V14l3 3 5-5-7-7-5 4-5-4Zm3 13h12m-12 6h12':'M10 10h20v20H10Zm5 0V5h10v5M10 16h20M16 16v8h8v-8';
  return <svg className="equipment-icon" viewBox="0 0 40 36" aria-hidden="true" focusable="false"><path d={path} fill="none" stroke="currentColor" strokeWidth={id.includes('heavy')||id.includes('layered')?2.7:1.7} strokeLinecap="round" strokeLinejoin="round"/>{id.includes('quick')&&<path d="m4 10 3 8-3 8m29-16-3 8 3 8" fill="none" stroke="currentColor"/>}</svg>;
}
