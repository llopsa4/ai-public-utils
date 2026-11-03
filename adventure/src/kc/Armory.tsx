// Cinderfold: Mara's gear. In the game's gear pop-up, a paper doll (PaperDoll); elsewhere Kiln Courier's workshop screen (components/Workshop.tsx) in equip-only form: Mara's
// three slots with their pictures, the gear he owns on the shelf, the selected piece next to what
// is equipped, and the build before and after. No buying, upgrading or card work in this chapter.
import { useState } from 'react';
import { openingArt } from './assets';
import { EquipmentArt } from './EquipmentArt';
import { EquipmentIcon } from '@kc/components/EquipmentIcon';
import { EQUIPMENT, STARTING_EQUIPMENT } from '@kc/content/equipment';
import { deriveStats, EQUIPMENT_SLOTS, openingHandSize } from '@kc/game/equipment';
import type { CharacterProfile, EquippedItem, EquipmentSlot } from '@kc/game/types';
import { equipmentComparison } from '@kc/game/workshop';

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
  /** Inside the game's gear pop-up: the panel gives the title and Done; no panorama. */
  popup?: boolean;
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

export function Armory(props: ArmoryProps) {
  return props.popup ? <PaperDoll {...props} /> : <Workshop {...props} />;
}

/** Where each slot sits on Mara's figure (art/src/kc/hero.webp), as a share of its width and height. */
const SLOT_AT: Record<EquipmentSlot, { x: number; y: number }> = {
  gauntlet: { x: 86, y: 43 }, // his right hand, in the gauntlet
  armor: { x: 55, y: 27 }, // his chest
  utility: { x: 24, y: 43 }, // the carrier at his hip
};
const STASH_CELLS = 8;
const STAT_ROWS: [keyof ReturnType<typeof deriveStats> | 'cards', string][] = [['power', 'Power'], ['defense', 'Defense'], ['speed', 'Speed'], ['cards', 'Opening cards'], ['maxMp', 'Max MP']];

/**
 * The gear pop-up as a paper doll: Mara's figure with his three slots on the body, a stash of square
 * cells with what he owns but isn't wearing, a tooltip card for the selected piece, and his stats.
 * Click selects, double-click equips, and a piece can be dragged onto its slot (touch: tap, then Equip).
 */
function PaperDoll({ profile, owned, locked, onEquip }: ArmoryProps) {
  const loadout = profile.equipment ?? STARTING_EQUIPMENT;
  const stash = owned.filter(id => loadout[EQUIPMENT[id].slot].id !== id);
  const [selected, setSelected] = useState(stash[0] ?? loadout.armor.id);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<EquipmentSlot | null>(null);
  const [result, setResult] = useState('');
  const data = EQUIPMENT[selected];
  const equipped = loadout[data.slot].id === selected, slotLocked = locked.includes(data.slot);
  const canEquip = (id: string) => !locked.includes(EQUIPMENT[id].slot) && loadout[EQUIPMENT[id].slot].id !== id;
  const equip = (id: string) => {
    if (!canEquip(id)) return;
    onEquip(id);
    setSelected(id);
    setResult(`${EQUIPMENT[id].name} equipped.`);
  };
  const stats = deriveStats(profile);
  const statValue = (key: (typeof STAT_ROWS)[number][0]) => (key === 'cards' ? openingHandSize(5, stats.speed) : stats[key]);
  const spare = (id: string) => !(STARTING_EQUIPMENT_IDS as readonly string[]).includes(id);
  return <section className="kc-armory doll" aria-label="Mara's gear">
    <div className="doll-figure">
      <img className="doll-body" src={openingArt.iven} alt="" />
      {EQUIPMENT_SLOTS.map(slot => {
        const item = loadout[slot];
        const target = dragging !== null && EQUIPMENT[dragging].slot === slot && canEquip(dragging);
        return <button key={slot} type="button" style={{ left: `${SLOT_AT[slot].x}%`, top: `${SLOT_AT[slot].y}%` }}
          className={`doll-slot${item.id === selected ? ' doll-selected' : ''}${target ? ' doll-target' : ''}${over === slot && target ? ' doll-over' : ''}`}
          aria-pressed={item.id === selected} aria-label={`${slot}: ${EQUIPMENT[item.id].name}${locked.includes(slot) ? ', locked' : ''}`} title={`${EQUIPMENT[item.id].name} (${slot})`}
          onClick={() => { setSelected(item.id); setResult(''); }}
          onDragOver={event => { if (target) { event.preventDefault(); setOver(slot); } }}
          onDragLeave={() => setOver(null)}
          onDrop={event => { event.preventDefault(); setOver(null); if (dragging && target) equip(dragging); setDragging(null); }}>
          <EquipmentArt item={item} />
          {locked.includes(slot) && <span className="doll-lock" aria-hidden="true">{LOCK}</span>}
        </button>;
      })}
    </div>
    <dl className="doll-stats">{STAT_ROWS.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{statValue(key)}</dd></div>)}</dl>
    <div className="doll-side">
      <h3 className="doll-heading">Stash</h3>
      <div className="doll-stash">{Array.from({ length: Math.max(STASH_CELLS, stash.length) }, (_, n) => {
        const id = stash[n];
        if (!id) return <span key={`empty-${n}`} className="stash-cell stash-empty" aria-hidden="true" />;
        return <button key={id} type="button" draggable className={`gear-tile stash-cell${id === selected ? ' doll-selected' : ''}${spare(id) ? ' doll-spare' : ''}`}
          aria-pressed={id === selected} title={EQUIPMENT[id].name}
          onClick={() => { setSelected(id); setResult(''); }} onDoubleClick={() => equip(id)}
          onDragStart={event => { event.dataTransfer.setData('text/plain', id); event.dataTransfer.effectAllowed = 'move'; setDragging(id); setSelected(id); }}
          onDragEnd={() => { setDragging(null); setOver(null); }}>
          <EquipmentArt item={{ id }} /><span className="sr-only">{EQUIPMENT[id].name}</span>
        </button>;
      })}</div>
      <article className={`doll-card${spare(selected) ? ' doll-spare' : ''}`} aria-live="polite">
        <h3>{data.name}</h3>
        <p className="doll-slotname">{data.slot}{equipped ? ' · equipped' : ''}{slotLocked ? ' · locked' : ''}</p>
        <p className="doll-bonuses">{bonuses({ id: selected })}</p>
        {descriptions[selected] && <p className="doll-desc">{descriptions[selected]}</p>}
        {!equipped && <><h4>Your build if equipped</h4><StatComparison profile={profile} item={{ id: selected }} /></>}
        <button id="armory-equip" type="button" className={equipped || slotLocked ? 'session-secondary' : 'modal-primary'} disabled={equipped || slotLocked}
          onClick={event => { if (event.detail <= 1) equip(selected); }}>
          {slotLocked && !equipped ? "His mother's: it stays" : equipped ? 'Equipped' : `Equip ${data.name}`}
        </button>
        <p role="status" className="doll-result" key={result}>{result}</p>
      </article>
    </div>
  </section>;
}

const STARTING_EQUIPMENT_IDS = Object.values(STARTING_EQUIPMENT).map(e => e.id);
const LOCK = <svg viewBox="0 0 16 16"><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" /><rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor" /></svg>;

/** The full-screen workshop (outside the pop-up): Kiln Courier's showroom layout. */
function Workshop({ profile, owned, locked, salvage, carried, title, eyebrow, onEquip, onClose, popup = false }: ArmoryProps) {
  const loadout = profile.equipment ?? STARTING_EQUIPMENT;
  const firstSpare = owned.find(id => loadout[EQUIPMENT[id].slot].id !== id) ?? owned[0];
  const [gearId, setGearId] = useState(firstSpare);
  const [result, setResult] = useState('');
  const data = EQUIPMENT[gearId], item = { id: gearId };
  const currentItem = loadout[data.slot];
  const equipped = currentItem.id === gearId, slotLocked = locked.includes(data.slot);
  return <section className="workshop showroom kc-armory" aria-label={title}>
    {!popup && <header className="workshop-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><span className="salvage-balance"><span aria-hidden="true">◇</span> {salvage}<small>salvage</small></span></header>}
    {!popup && <div className="workshop-panorama" style={{ backgroundImage: `url(${openingArt['regulator-gallery']})` }} role="img" aria-label="The regulator gallery" />}
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
    {carried.length > 0 && <p className="session-caption kc-carried">{[...(popup ? [`◇ ${salvage} salvage`] : []), ...carried].join(' · ')}</p>}
    {popup ? <p className="session-caption kc-carried">Your gear is saved as you change it.</p>
      : <footer className="workshop-exit"><p>Your gear is saved as you change it.</p><button id="armory-done" className="modal-primary" onClick={onClose}>Done →</button></footer>}
  </section>;
}
