import type { EquippedItem } from '../game/types';
import { EQUIPMENT } from '../content/equipment';
import { EquipmentIcon } from './EquipmentIcon';

const images = import.meta.glob<string>('../../../assets/equipment/runtime/*.webp', { eager:true, import:'default' });
export function EquipmentArt({ item, className = '' }: { item:EquippedItem; className?:string }) {
  const name = `${item.id}${item.upgraded ? '-upgraded' : ''}`;
  const src = images[`../../../assets/equipment/runtime/${name}.webp`];
  return <span className={`equipment-art ${className}`}>
    {src ? <img src={src} alt={`${EQUIPMENT[item.id].name}${item.upgraded ? ', reinforced upgrade' : ''}`} width="512" height="512" decoding="async"/> : <EquipmentIcon id={item.id}/>}
  </span>;
}
