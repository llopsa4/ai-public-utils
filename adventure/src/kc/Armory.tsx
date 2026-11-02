// Cinderfold: Kiln Courier's workshop screen (components/Workshop.tsx) in equip-only form: Mara's
// three slots with their pictures, the gear he owns on the shelf, the selected piece next to what
// is equipped, and the build before and after. No buying, upgrading or card work in this chapter.
import { useState } from 'react';
import { openingArt } from './assets';
import { EquipmentArt } from './components/EquipmentArt';
import { EquipmentIcon } from './components/EquipmentIcon';
import { EQUIPMENT, STARTING_EQUIPMENT } from './content/equipment';
import { deriveStats, EQUIPMENT_SLOTS, openingHandSize } from './game/equipment';
import type { CharacterProfile, EquippedItem, EquipmentSlot } from './game/types';
import { equipmentComparison } from './game/workshop';

export interface ArmoryProps {
  profile: CharacterProfile;
  owned: string[];
  locked: EquipmentSlot[];
  salvage: number;
  /** Extra lines under the build (tonics, materials). */
  carried: string[];
  title: string;
  eyebrow: string;
  onEquip: (id: string) => void;
  onClose: () => void;
}

function bonuses(item: EquippedItem) {
  const data = EQUIPMENT[item.id], values = item.upgraded ? data.upgradedBonuses! : data.bonuses;
  const labels: Record<string, string> = { power: 'Power', defense: 'Defense', speed: 'Speed', maxMp: 'Max MP', attackStrain: 'Attack strain' };
  return Object.entries(values).map(([key, value]) => `${labels[key]} ${value! > 0 ? '+' : ''}${value}`).join(' · ') || 'Standard gear';
}
const descriptions: Record<string, string> = {
  'courier-gauntlet': "His mother's gauntlet. A familiar grip, repaired for another journey.",
  'patched-coat': 'Ceramic patches over a well-travelled coat.',
  'plain-carrier': 'Room for a delivery. Nothing to slow you down.',
  'light-armor': "Oren's spare: spaced plates keep protection light and joints free.",
  'quick-harness': "Oren's spare: quick-release fittings keep the next move within reach.",
};
function totals(profile: CharacterProfile) {
  const stats = deriveStats(profile);
  return `${stats.power} power · ${stats.defense} defense · ${stats.speed} speed · ${openingHandSize(5, stats.speed)} opening cards · ${stats.maxMp} max MP`;
}
function StatComparison({ profile, item }: { profile: CharacterProfile; item: EquippedItem }) {
  const values = equipmentComparison(profile, item).changed;
  return values.length ? <dl className="gear-deltas">{values.map(value => <div key={value.key} className={value.before === value.after ? 'unchanged' : (value.after > value.before) !== value.lowerBetter ? 'stat-benefit' : 'stat-tradeoff'}><dt>{value.label}</dt><dd><span>{value.before}</span><span aria-hidden="true"> → </span><strong>{value.after}</strong>{value.before !== value.after && <small>{value.after - value.before > 0 ? '+' : ''}{value.after - value.before}{value.lowerBetter ? ' pressure' : ''}</small>}</dd></div>)}</dl> : <p className="session-caption">No change to your current build.</p>;
}

export function Armory({ profile, owned, locked, salvage, carried, title, eyebrow, onEquip, onClose }: ArmoryProps) {
  const loadout = profile.equipment ?? STARTING_EQUIPMENT;
  const firstSpare = owned.find(id => loadout[EQUIPMENT[id].slot].id !== id) ?? owned[0];
  const [gearId, setGearId] = useState(firstSpare);
  const [result, setResult] = useState('');
  const data = EQUIPMENT[gearId], item = { id: gearId };
  const currentItem = loadout[data.slot];
  const equipped = currentItem.id === gearId, slotLocked = locked.includes(data.slot);
  return <section className="workshop showroom kc-armory" aria-label={title}>
    <header className="workshop-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><span className="salvage-balance"><span aria-hidden="true">◇</span> {salvage}<small>salvage</small></span></header>
    <div className="workshop-panorama" style={{ backgroundImage: `url(${openingArt['regulator-gallery']})` }} role="img" aria-label="The regulator gallery" />
    <div className="loadout-slots" aria-label="Three equipped slots">{EQUIPMENT_SLOTS.map(slot => {
      const equippedItem = loadout[slot];
      return <button key={slot} onClick={() => { setGearId(equippedItem.id); setResult(''); }} aria-label={`Inspect equipped ${EQUIPMENT[equippedItem.id].name}`}><EquipmentArt item={equippedItem} /><span><small>{slot} · equipped</small><strong>{EQUIPMENT[equippedItem.id].name}</strong></span></button>;
    })}</div>
    <p className="session-caption kc-build">{totals(profile)}</p>
    <p role="status" className={`workbench-result${result ? ' investment-complete' : ''}`} key={result}>{result}</p>
    <div className="showroom-grid">
      <aside className="gear-shelf" aria-label="Your gear"><h3><EquipmentIcon id="light-armor" /> Your gear</h3><div className="gear-tiles">{owned.map(id => {
        const isEquipped = loadout[EQUIPMENT[id].slot].id === id;
        return <button key={id} className="gear-tile" aria-pressed={id === gearId} aria-label={`Inspect ${EQUIPMENT[id].name}. ${isEquipped ? 'Equipped' : 'Owned'}`} onClick={() => { setGearId(id); setResult(''); }}><EquipmentArt item={{ id }} /><strong>{EQUIPMENT[id].name}</strong><small>{isEquipped ? 'Equipped' : 'Owned'}</small></button>;
      })}</div></aside>
      <section className="selected-workpiece" aria-label="Selected equipment">
        <div className="workpiece-title"><small>{data.slot} · {equipped ? 'Equipped' : 'Owned'}</small><h3>{data.name}</h3><p>{descriptions[gearId] ?? ''}</p></div>
        <div className="gear-pair"><figure><EquipmentArt item={currentItem} /><figcaption>Currently equipped<strong>{EQUIPMENT[currentItem.id].name}</strong></figcaption></figure><span className="comparison-arrow" aria-hidden="true">→</span><figure><EquipmentArt item={item} /><figcaption>Selected item<strong>{data.name}</strong></figcaption></figure></div>
        <p className="gear-properties">{bonuses(item)}</p>
        <div className="comparison-heading"><h4>Your build if equipped</h4></div>
        <StatComparison profile={profile} item={item} />
        <div className="workpiece-actions">
          <button id="armory-equip" className={equipped || slotLocked ? 'session-secondary' : 'modal-primary'} disabled={equipped || slotLocked} onClick={event => { if (event.detail <= 1) { onEquip(gearId); setResult(`${data.name} equipped.`); } }}>{slotLocked && !equipped ? 'This slot stays as it is' : equipped ? 'Equipped' : `Equip ${data.name}`}</button>
        </div>
        <p className="session-caption">{slotLocked ? "The gauntlet is his mother's: it stays." : 'Swaps are free. They never restore HP or MP.'}</p>
      </section>
    </div>
    {carried.length > 0 && <p className="session-caption kc-carried">{carried.join(' · ')}</p>}
    <footer className="workshop-exit"><p>Your gear is saved as you change it.</p><button id="armory-done" className="modal-primary" onClick={onClose}>Done →</button></footer>
  </section>;
}
