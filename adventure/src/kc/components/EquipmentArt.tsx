// Copied from Kiln Courier (FFCardGame/client/src), same repository. Keep in step with it; local changes are marked "Cinderfold:".
import type { EquippedItem } from '../game/types';
import { EQUIPMENT } from '../content/equipment';
import { EquipmentIcon } from './EquipmentIcon';

// Cinderfold: the equipment pictures made by art/kc.mjs.
const images = import.meta.glob<string>('../../../art/src/kc/equipment/*.webp', { eager:true, import:'default' });
export function EquipmentArt({ item, className = '' }: { item:EquippedItem; className?:string }) {
  const name = `${item.id}${item.upgraded ? '-upgraded' : ''}`;
  const src = images[`../../../art/src/kc/equipment/${name}.webp`];
  return <span className={`equipment-art ${className}`}>
    {src ? <img src={src} alt={`${EQUIPMENT[item.id].name}${item.upgraded ? ', reinforced upgrade' : ''}`} width="512" height="512" decoding="async"/> : <EquipmentIcon id={item.id}/>}
  </span>;
}
