import type { EquippedItem } from '@kc/game/types';
import { EQUIPMENT } from '@kc/content/equipment';
import { EquipmentIcon } from '@kc/components/EquipmentIcon';
import type * as Original from '@kc/components/EquipmentArt';

// Cinderfold's stand-in for Kiln Courier's components/EquipmentArt.tsx (swapped in by vite.config.ts):
// the equipment pictures made by art/kc.mjs.
const images = import.meta.glob<string>('../../art/src/kc/equipment/*.webp', { eager:true, import:'default' });
export function EquipmentArt({ item, className = '' }: { item:EquippedItem; className?:string }) {
  // Each piece has ten tiers of art (<id>.webp is tier 1, <id>-t2 ... -t10 the stronger ones, see
  // art/manifest.mjs); Kiln Courier's reinforced upgrade shows tier 2 when there is no -upgraded picture.
  const pick = (name: string) => images[`../../art/src/kc/equipment/${name}.webp`];
  const src = item.upgraded ? pick(`${item.id}-upgraded`) ?? pick(`${item.id}-t2`) ?? pick(item.id) : pick(item.id);
  return <span className={`equipment-art ${className}`}>
    {src ? <img src={src} alt={`${EQUIPMENT[item.id].name}${item.upgraded ? ', reinforced upgrade' : ''}`} width="512" height="512" decoding="async"/> : <EquipmentIcon id={item.id}/>}
  </span>;
}

// Same props as Kiln Courier's own (checked by the compiler).
EquipmentArt satisfies typeof Original.EquipmentArt;
