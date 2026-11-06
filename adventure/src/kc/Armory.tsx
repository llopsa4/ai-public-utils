// Cinderfold: Mara's gear. In the game's gear pop-up, a paper doll (PaperDoll); elsewhere Kiln Courier's workshop screen (components/Workshop.tsx) in equip-only form: Mara's
// three slots with their pictures, the gear he owns on the shelf, the selected piece next to what
// is equipped, and the build before and after. No buying, upgrading or card work in this chapter.
import { useState, type ReactNode } from 'react';
import { openingArt } from './assets';
import { EquipmentArt } from './EquipmentArt';
import { EquipmentIcon } from '@kc/components/EquipmentIcon';
import { EQUIPMENT, STARTING_EQUIPMENT } from '@kc/content/equipment';
import { deriveStats, EQUIPMENT_SLOTS, openingHandSize } from '@kc/game/equipment';
import type { CharacterProfile, EquippedItem, EquipmentSlot } from '@kc/game/types';
import { equipmentComparison } from '@kc/game/workshop';
import { BASIC_WEAR, TONIC, type WearSlot } from '../content/kit';
import { TONIC_ART } from '../ui/icons';

export interface ArmoryProps {
  profile: CharacterProfile;
  owned: string[];
  locked: EquipmentSlot[];
  salvage: number;
  /** Extra lines under the build (tonics, materials). */
  carried: string[];
  /** Kiln Tonics carried (the paper doll's belt). */
  tonics?: number;
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
  'layered-armor': "Oren's layered cuirass: overlapping ceramic plates and brass fastenings over quilted leather.",
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
const SLOT_AT: Record<EquipmentSlot | WearSlot, { x: number; y: number }> = {
  gauntlet: { x: 86, y: 43 }, // his right hand, in the gauntlet
  armor: { x: 55, y: 27 }, // his chest
  utility: { x: 24, y: 43 }, // the carrier at his hip
  pants: { x: 50, y: 66 }, // his legs
  boots: { x: 52, y: 90 }, // his feet
};
/** What the stash shows: one type of gear at a time (or the tonics on his belt). Pants and boots: only what he wears for now. */
type GearType = EquipmentSlot | WearSlot | 'tonic';
const TYPE_NAME: Record<GearType, string> = { gauntlet: 'Gauntlets', armor: 'Armor', utility: 'Utility', pants: 'Pants', boots: 'Boots', tonic: 'Kiln Tonics' };
const Potion = () => <span className="doll-potion-icon" dangerouslySetInnerHTML={{ __html: TONIC_ART }} />;
const WEAR_SLOTS: WearSlot[] = ['pants', 'boots'];
const isWear = (t: GearType): t is WearSlot => (WEAR_SLOTS as string[]).includes(t);

/** Pictures of the trousers and boots once delivered (art/src/kc/equipment), else the drawn icons. */
const wearImages = import.meta.glob<string>('../../art/src/kc/equipment/*.webp', { eager: true, import: 'default' });
function WearArt({ slot }: { slot: WearSlot }) {
  const src = wearImages[`../../art/src/kc/equipment/${BASIC_WEAR[slot].id}.webp`];
  return <span className="equipment-art">{src ? <img src={src} alt={BASIC_WEAR[slot].name} width="512" height="512" decoding="async" /> : slot === 'pants' ? PANTS : BOOT}</span>;
}
const STASH_CELLS = 8;
// Two per row: the last row is health next to MP (now / most).
const STAT_ROWS: ['power' | 'defense' | 'speed' | 'cards' | 'hp' | 'mp', string][] = [['power', 'Power'], ['defense', 'Defense'], ['speed', 'Speed'], ['cards', 'Opening cards'], ['hp', 'HP'], ['mp', 'MP']];

/**
 * The gear pop-up as a paper doll: Mara's figure with his three slots on the body, a stash of square
 * cells with what he owns but isn't wearing, a tooltip card for the selected piece, and his stats.
 * Click selects, double-click equips, and a piece can be dragged onto its slot (touch: tap, then Equip).
 */
function PaperDoll({ profile, owned, locked, onEquip, tonics = 0 }: ArmoryProps) {
  const loadout = profile.equipment ?? STARTING_EQUIPMENT;
  const stash = owned.filter(id => loadout[EQUIPMENT[id].slot].id !== id);
  const first = stash[0] ?? loadout.armor.id;
  const [view, setView] = useState<GearType>(EQUIPMENT[first].slot);
  const [chosen, setSelected] = useState<string | null>(first);
  const shelf = isWear(view) || view === 'tonic' ? [] : stash.filter(id => EQUIPMENT[id].slot === view);
  // Trousers, boots and tonics have their own card.
  const selected = isWear(view) || view === 'tonic' ? null : chosen ?? loadout[view].id;
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<EquipmentSlot | null>(null);
  const [result, setResult] = useState('');
  const data = selected ? EQUIPMENT[selected] : null;
  const equipped = !!data && loadout[data.slot].id === selected, slotLocked = !!data && locked.includes(data.slot);
  const canEquip = (id: string) => !locked.includes(EQUIPMENT[id].slot) && loadout[EQUIPMENT[id].slot].id !== id;
  const equip = (id: string) => {
    if (!canEquip(id)) return;
    onEquip(id);
    setSelected(id);
    setResult(`${EQUIPMENT[id].name} equipped.`);
  };
  const stats = deriveStats(profile);
  const statValue = (key: (typeof STAT_ROWS)[number][0]) =>
    key === 'cards' ? openingHandSize(5, stats.speed) : key === 'hp' ? `${profile.hp} / ${profile.maxHp}` : key === 'mp' ? `${profile.mp} / ${stats.maxMp}` : stats[key];
  const spare = (id: string) => !(STARTING_EQUIPMENT_IDS as readonly string[]).includes(id);
  return <section className="kc-armory doll" aria-label="Mara's gear">
    <div className="doll-figure">
      <img className="doll-body" src={openingArt.iven} alt="" />
      {EQUIPMENT_SLOTS.map(slot => {
        const item = loadout[slot];
        const target = dragging !== null && EQUIPMENT[dragging].slot === slot && canEquip(dragging);
        return <button key={slot} type="button" style={{ left: `${SLOT_AT[slot].x}%`, top: `${SLOT_AT[slot].y}%` }}
          className={`doll-slot${item.id === selected ? ' doll-selected' : ''}${view === slot ? ' doll-viewing' : ''}${target ? ' doll-target' : ''}${over === slot && target ? ' doll-over' : ''}`}
          aria-pressed={item.id === selected} aria-label={`${slot}: ${EQUIPMENT[item.id].name}${locked.includes(slot) ? ', locked' : ''}`} title={`${EQUIPMENT[item.id].name} (${slot})`}
          onClick={() => { setView(slot); setSelected(item.id); setResult(''); }}
          onDragOver={event => { if (target) { event.preventDefault(); setOver(slot); } }}
          onDragLeave={() => setOver(null)}
          onDrop={event => { event.preventDefault(); setOver(null); if (dragging && target) equip(dragging); setDragging(null); }}>
          <EquipmentArt item={item} />
          {locked.includes(slot) && <span className="doll-lock" aria-hidden="true">{LOCK}</span>}
        </button>;
      })}
      {WEAR_SLOTS.map(slot => <button key={slot} type="button" style={{ left: `${SLOT_AT[slot].x}%`, top: `${SLOT_AT[slot].y}%` }}
        className={`doll-slot doll-wear${view === slot ? ' doll-viewing doll-selected' : ''}`} aria-pressed={view === slot}
        aria-label={`${slot}: ${BASIC_WEAR[slot].name}`} title={`${BASIC_WEAR[slot].name} (${slot})`} onClick={() => { setView(slot); setResult(''); }}>
        <WearArt slot={slot} />
      </button>)}
    </div>
    <div className="doll-belt">
      <button type="button" className={`doll-slot doll-tonic${view === 'tonic' ? ' doll-viewing doll-selected' : ''}`} aria-pressed={view === 'tonic'}
        aria-label={`Kiln Tonics: ${tonics} of ${TONIC.max}`} title={`Kiln Tonics: ${tonics} of ${TONIC.max}`} onClick={() => { setView('tonic'); setResult(''); }}>
        <Potion /><span className="doll-count">{tonics}</span>
      </button>
      <span className="doll-belt-label">Kiln Tonics <strong>{tonics} / {TONIC.max}</strong></span>
    </div>
    <dl className="doll-stats">{STAT_ROWS.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{statValue(key)}</dd></div>)}</dl>
    <div className="doll-side">
      <h3 className="doll-heading">Stash <span>· {TYPE_NAME[view]}</span></h3>
      <div className="doll-stash">{Array.from({ length: Math.max(STASH_CELLS, shelf.length) }, (_, n) => {
        if (view === 'tonic') return n < tonics ? <span key={`tonic-${n}`} className="stash-cell stash-tonic" title="Kiln Tonic"><Potion /></span>
          : <span key={`empty-${n}`} className="stash-cell stash-empty" aria-hidden="true" />;
        const id = shelf[n];
        if (!id) return <span key={`empty-${n}`} className="stash-cell stash-empty" aria-hidden="true" />;
        return <button key={id} type="button" draggable className={`gear-tile stash-cell${id === selected ? ' doll-selected' : ''}${spare(id) ? ' doll-spare' : ''}`}
          aria-pressed={id === selected} title={EQUIPMENT[id].name}
          onClick={() => { setSelected(id); setResult(''); }} onDoubleClick={() => equip(id)}
          onDragStart={event => { event.dataTransfer.setData('text/plain', id); event.dataTransfer.effectAllowed = 'move'; setDragging(id); setSelected(id); }}
          onDragEnd={() => { setDragging(null); setOver(null); }}>
          <EquipmentArt item={{ id }} /><span className="sr-only">{EQUIPMENT[id].name}</span>
        </button>;
      })}</div>
      {view === 'tonic' ? <ItemPreview key="tonic" tier="consumable" tag={`Consumable · on his belt · ${tonics} of ${TONIC.max}`} name="Kiln Tonic"
        art={<Potion />} lines={[{ text: `Heals ${TONIC.heal} HP`, good: true }, { text: 'Drunk in a fight, under End turn' }]}
        flavor="Corvin sells them in the ashways." />
      : isWear(view) ? <ItemPreview key={view} tier="common" tag={`Standard · ${view}`} name={BASIC_WEAR[view].name}
        art={<WearArt slot={view} />} lines={[{ text: 'No bonuses' }]} flavor={BASIC_WEAR[view].description}
        footer={<button id="armory-equip" type="button" className="session-secondary" disabled>Equipped</button>} />
      : !data || !selected ? null : <ItemPreview key={selected} tier={spare(selected) ? 'spare' : 'common'}
        tag={`${spare(selected) ? 'Spare' : 'Standard'} · ${data.slot}${equipped ? ' · equipped' : ''}${slotLocked ? ' · locked' : ''}`}
        name={data.name} art={<EquipmentArt item={{ id: selected }} />} lines={bonusLines({ id: selected })} flavor={descriptions[selected]}
        footer={<>
          {!equipped && <Changes profile={profile} item={{ id: selected }} />}
          <div className="preview-actions">
            <button id="armory-equip" type="button" className={equipped || slotLocked ? 'session-secondary' : 'modal-primary'} disabled={equipped || slotLocked}
              onClick={event => { if (event.detail <= 1) equip(selected); }}>
              {slotLocked && !equipped ? "His mother's: it stays" : equipped ? 'Equipped' : `Equip ${data.name}`}
            </button>
            <p role="status" className="doll-result" key={result}>{result}</p>
          </div>
        </>} />}
    </div>
  </section>;
}

/** Each bonus of a piece on its own line, as a gain or a cost. */
function bonusLines(item: EquippedItem): { text: string; good?: boolean; bad?: boolean }[] {
  const data = EQUIPMENT[item.id], values = item.upgraded ? data.upgradedBonuses! : data.bonuses;
  const labels: Record<string, string> = { power: 'Power', defense: 'Defense', speed: 'Speed', maxMp: 'Max MP', attackStrain: 'Attack strain' };
  const lines = Object.entries(values).map(([key, value]) => {
    const cost = key === 'attackStrain' ? value! > 0 : value! < 0;
    return { text: `${value! > 0 ? '+' : ''}${value} ${labels[key]}`, good: !cost, bad: cost };
  });
  return lines.length ? lines : [{ text: 'No bonuses' }];
}

/** "If equipped": each stat that would change, as a chip (gain green, loss red). */
function Changes({ profile, item }: { profile: CharacterProfile; item: EquippedItem }) {
  const changed = equipmentComparison(profile, item).changed;
  if (!changed.length) return <p className="preview-same">No change to your build.</p>;
  return <div className="preview-changes"><span className="preview-label">If equipped</span>{changed.map(v => {
    const better = (v.after > v.before) !== v.lowerBetter;
    return <span key={v.key} className={`preview-chip ${better ? 'chip-good' : 'chip-bad'}`}>
      {v.label} <span className="chip-from">{v.before}</span> → <strong>{v.after}</strong> <small>{v.after - v.before > 0 ? '+' : ''}{v.after - v.before}</small>
    </span>;
  })}</div>;
}

/**
 * The selected piece, presented like a loot tooltip: a large picture in a glowing frame, its tier
 * and slot, its name, each bonus on its own line, the flavour text, then what changes and Equip.
 */
function ItemPreview({ tier, tag, name, art, lines, flavor, footer }: {
  tier: 'common' | 'spare' | 'consumable'; tag: string; name: string; art: ReactNode;
  lines: { text: string; good?: boolean; bad?: boolean }[]; flavor?: string; footer?: ReactNode;
}) {
  return <article className={`doll-card preview tier-${tier}`} aria-live="polite">
    <div className="preview-top">
      <div className="preview-art"><span className="preview-glow" aria-hidden="true" />{art}</div>
      <div className="preview-body">
        <p className="preview-tag">{tag}</p>
        <h3 className="preview-name">{name}</h3>
        <ul className="preview-lines">{lines.map(l => <li key={l.text} className={l.good ? 'line-good' : l.bad ? 'line-bad' : ''}>{l.text}</li>)}</ul>
      </div>
    </div>
    {flavor && <p className="preview-flavor">{flavor}</p>}
    {footer}
  </article>;
}

const STARTING_EQUIPMENT_IDS = Object.values(STARTING_EQUIPMENT).map(e => e.id);
/** Drawn stand-ins for the trousers and boots (until their art is delivered). */
const PANTS = <svg className="doll-wear-icon" viewBox="0 0 48 48" aria-hidden="true">
  <path d="M13 6h22l3 36h-9l-5-22-5 22h-9z" fill="#3a2c22" stroke="#120a06" strokeWidth="1.6" strokeLinejoin="round" />
  <path d="M13 6h22v5H13z" fill="#6b4a2a" stroke="#120a06" strokeWidth="1.4" />
  <ellipse cx="16.5" cy="28" rx="3.6" ry="4.4" fill="#d9cdb6" stroke="#120a06" strokeWidth="1.2" />
  <ellipse cx="31.5" cy="28" rx="3.6" ry="4.4" fill="#d9cdb6" stroke="#120a06" strokeWidth="1.2" />
  <path d="M23 11v6" stroke="#b08a4a" strokeWidth="1.4" />
</svg>;
const BOOT = <svg className="doll-wear-icon" viewBox="0 0 48 48" aria-hidden="true">
  <path d="M15 6h11v20l11 5c3 1.5 4 4 4 7v3H9v-9l3-6z" fill="#6b4224" stroke="#120a06" strokeWidth="1.6" strokeLinejoin="round" />
  <path d="M9 37h32v4H9z" fill="#2a1a10" stroke="#120a06" strokeWidth="1.4" />
  <path d="M15 14h11M15 20h11" stroke="#c9a15a" strokeWidth="2" />
  <rect x="18" y="12.5" width="4" height="3" fill="#e0b860" stroke="#120a06" strokeWidth="0.8" />
</svg>;
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
