import { openingArt } from '../assets';
import { EquipmentIcon } from './EquipmentIcon';
import { EquipmentArt } from './EquipmentArt';
import { TechniqueDisplay, TechniqueIllustration } from './TechniqueDisplay';
import { useEffect, useRef, useState } from 'react';
import type { CampaignCommand, CampaignState } from '../game/campaign';
import type { CharacterProfile, EquippedItem } from '../game/types';
import { EQUIPMENT, STARTING_EQUIPMENT } from '../content/equipment';
import { cardDefinition, cardLabel } from '../content/cards';
import { deriveStats, EQUIPMENT_SLOTS, openingHandSize } from '../game/equipment';
import { atWorkshop } from '../game/systems';
import { catalogueItem, equipmentComparison, SHOP_PRICES, GEAR_UPGRADE_COST, CARD_UPGRADE_COST, CARD_REMOVE_COST, MIN_DECK } from '../game/workshop';
import { ConfirmDialog } from './ConfirmDialog';

type Dispatch = (command:CampaignCommand) => unknown;
function totals(profile:CharacterProfile) {
  const stats=deriveStats(profile);
  return `${stats.power} power · ${stats.defense} defense · ${stats.speed} speed · ${openingHandSize(5,stats.speed)} opening cards · ${stats.maxMp} max MP${stats.attackStrain?` · +${stats.attackStrain} attack strain`:''}`;
}
function bonuses(item:EquippedItem) {
  const data=EQUIPMENT[item.id],values=item.upgraded?data.upgradedBonuses!:data.bonuses;
  const labels:Record<string,string>={power:'Power',defense:'Defense',speed:'Speed',maxMp:'Max MP',attackStrain:'Attack strain'};
  return Object.entries(values).map(([key,value])=>`${labels[key]} ${value>0?'+':''}${value}`).join(' · ')||'Standard gear';
}
const descriptions:Record<string,string>={
  'courier-gauntlet':'A familiar grip. Repaired for another journey.',
  'patched-coat':'Ceramic patches over a well-travelled coat.',
  'plain-carrier':'Room for a delivery. Nothing to slow you down.',
  'heavy-gauntlet':'A heavier piston delivers force at the cost of pressure.',
  'balanced-gauntlet':'A compact chamber keeps every strike measured.',
  'layered-armor':'Overlapping ceramic takes the impact. Weight limits agility.',
  'light-armor':'Spaced plates keep protection light and joints free.',
  'quick-harness':'Quick-release fittings keep the next move within reach.',
  'insulated-kit':'Insulated channels protect the courier and hold more reserve.',
};
function StatComparison({profile,item,all=false}:{profile:CharacterProfile;item:EquippedItem;all?:boolean}) {
  const comparison=equipmentComparison(profile,item),values=all?comparison.values:comparison.changed;
  return values.length?<dl className="gear-deltas">{values.map(value=><div key={value.key} className={value.before===value.after?'unchanged':(value.after>value.before)!==value.lowerBetter?'stat-benefit':'stat-tradeoff'}><dt>{value.label}</dt><dd><span>{value.before}</span><span aria-hidden="true"> → </span><strong>{value.after}</strong>{value.before!==value.after&&<small>{value.after-value.before>0?'+':''}{value.after-value.before}{value.lowerBetter?' pressure':''}</small>}</dd></div>)}</dl>:<p className="session-caption">No change to your current build.</p>;
}
function Loadout({state,onSelect}:{state:CampaignState;onSelect?:(id:string)=>void}) {
  const loadout=state.profile.equipment??STARTING_EQUIPMENT;
  return <div className="loadout-slots" aria-label="Three equipped slots">{EQUIPMENT_SLOTS.map(slot=>{
    const item=loadout[slot],contents=<><EquipmentArt item={item}/><span><small>{slot} · equipped</small><strong>{EQUIPMENT[item.id].name}{item.upgraded?' +':''}</strong></span></>;
    return onSelect?<button key={slot} onClick={()=>onSelect(item.id)} aria-label={`Inspect equipped ${EQUIPMENT[item.id].name}`}>{contents}</button>:<div key={slot}>{contents}</div>;
  })}</div>;
}
export function EquipmentCollection({state,dispatch}:{state:CampaignState;dispatch:Dispatch}) {
  if(!state.systems)return null;
  return <details className="equipment-collection illustrated-collection"><summary>Equipment · free swaps between encounters</summary><Loadout state={state}/><p className="session-caption">{totals(state.profile)}. Swaps never restore HP or MP.</p><ul className="owned-gear-gallery">{state.systems.owned.map(item=>{
    const data=EQUIPMENT[item.id],equipped=(state.profile.equipment??STARTING_EQUIPMENT)[data.slot].id===item.id;
    return <li key={item.id} data-equipped={equipped}><EquipmentArt item={item}/><strong>{data.name}{item.upgraded?' +':''}</strong><small>{bonuses(item)}</small>{!equipped&&<StatComparison profile={state.profile} item={item}/>}<button className="session-secondary" disabled={equipped} onClick={event=>{if(event.detail<=1){dispatch({type:'equip',itemId:item.id,revision:state.revision});if(event.detail===0)event.currentTarget.closest('details')?.querySelector('summary')?.focus();}}}>{equipped?'Equipped':`Equip ${data.name}`}</button></li>;
  })}</ul></details>;
}
export function Workshop({state,dispatch}:{state:CampaignState;dispatch:Dispatch}) {
  const [view,setView]=useState<'equipment'|'techniques'>('equipment');
  const [gearId,setGearId]=useState('heavy-gauntlet');
  const [selected,setSelected]=useState(state.profile.deck[0]?.id??'');
  const [previewUpgrade,setPreviewUpgrade]=useState(false);
  const [pending,setPending]=useState<CampaignCommand|null>(null);
  const [result,setResult]=useState('');
  const heading=useRef<HTMLHeadingElement>(null),resultHeading=useRef<HTMLHeadingElement>(null);
  const confirming=useRef(false),focusResult=useRef(false);
  useEffect(()=>{if(!state.profile.deck.some(card=>card.id===selected))setSelected(state.profile.deck[0]?.id??'');},[state.profile.deck,selected]);
  useEffect(()=>{if(focusResult.current){focusResult.current=false;resultHeading.current?.focus();}},[state.revision]);
  if(!state.systems||!atWorkshop(state))return null;
  const owned=state.systems.owned.find(item=>item.id===gearId),item=catalogueItem(state.systems.owned,gearId),data=EQUIPMENT[gearId];
  const currentItem=(state.profile.equipment??STARTING_EQUIPMENT)[data.slot];
  const equipped=currentItem.id===gearId,upgradeable=!!owned&&!!data.upgradedBonuses&&!owned.upgraded;
  const candidate=previewUpgrade&&upgradeable?{...item,upgraded:true}:item;
  const available=state.systems.stock.includes(gearId),cost=SHOP_PRICES[gearId];
  const card=state.profile.deck.find(card=>card.id===selected),protectedCard=card?.type==='pulse';
  const refined=card&&!card.upgrade&&!protectedCard?{...card,upgrade:'refined' as const}:null;
  const insufficient=(price:number)=>state.salvage<price;
  function selectGear(id:string){setGearId(id);setPreviewUpgrade(false);setResult('');setView('equipment');}
  function confirm(command:CampaignCommand){confirming.current=false;setPending(command);}
  function finishInvestment(){
    if(!pending||confirming.current)return;
    confirming.current=true;
    if(dispatch(pending)){
      setResult(pending.type==='buy'?`${EQUIPMENT[pending.itemId].name} acquired. Equip it when you are ready.`:pending.type==='upgrade-item'?`${EQUIPMENT[pending.itemId].name} reinforced.`:pending.type==='refine-card'?`${card?cardDefinition(card).name:'Technique'} refined.`:'Card removed from your deck.');
      setPreviewUpgrade(false);focusResult.current=true;
    }
    setPending(null);
  }
  const pendingCost=pending?.type==='buy'?SHOP_PRICES[pending.itemId]:pending?.type==='upgrade-item'?GEAR_UPGRADE_COST:pending?.type==='refine-card'?CARD_UPGRADE_COST:CARD_REMOVE_COST;
  const pendingGear=pending&&(pending.type==='buy'||pending.type==='upgrade-item')?catalogueItem(state.systems.owned,pending.itemId):null;
  const galleryIds=Object.keys(SHOP_PRICES);
  return <section className="workshop showroom" aria-label="Workshop">
    <header className="workshop-heading"><div><span className="eyebrow">The tempering house</span><h2 ref={heading} tabIndex={-1}>{state.systems.opening?'Tempering workbench':'Old workbench'}</h2></div><span className="salvage-balance"><span aria-hidden="true">◇</span> {state.salvage}<small>salvage</small></span></header>
    <div className="workshop-panorama" style={{backgroundImage:`url(${openingArt['tempering-house']})`}} role="img" aria-label="The tempering workshop around the return pipe"/>
    <Loadout state={state} onSelect={selectGear}/>
    <nav className="bench-navigation" aria-label="Workbench views"><button className="session-secondary" aria-pressed={view==='equipment'} onClick={()=>setView('equipment')}><EquipmentIcon id="heavy-gauntlet"/>Equipment</button><button className="session-secondary" aria-pressed={view==='techniques'} onClick={()=>setView('techniques')}>✧ Techniques <small>{state.profile.deck.length} cards</small></button></nav>
    <p role="status" className={`workbench-result${result?' investment-complete':''}`} key={result}>{result}</p>
    {view==='equipment'?<div className="showroom-grid">
      <aside className="gear-shelf" aria-label="Equipment shelf"><h3>On the shelf</h3><div className="gear-tiles">{galleryIds.map(id=>{
        const entry=catalogueItem(state.systems!.owned,id),has=state.systems!.owned.some(item=>item.id===id),isEquipped=(state.profile.equipment??STARTING_EQUIPMENT)[EQUIPMENT[id].slot].id===id;
        return <button key={id} className="gear-tile" aria-pressed={id===gearId} aria-label={`Inspect ${EQUIPMENT[id].name}${entry.upgraded?' upgraded':''}. ${isEquipped?'Equipped':has?'Owned':!state.systems!.stock.includes(id)?'Sold out':`${SHOP_PRICES[id]} salvage`}`} onClick={()=>selectGear(id)}><EquipmentArt item={entry}/><strong>{EQUIPMENT[id].name}{entry.upgraded?' +':''}</strong><small>{isEquipped?'Equipped':has?'Owned':!state.systems!.stock.includes(id)?'Sold out':`${SHOP_PRICES[id]} salvage`}</small></button>;
      })}</div></aside>
      <section className="selected-workpiece" aria-label="Selected equipment">
        <div className="workpiece-title"><small>{data.slot} · {equipped?'Equipped':owned?'Owned':'Not owned'}</small><h3 ref={resultHeading} tabIndex={-1}>{data.name}{item.upgraded?' +':''}</h3><p>{descriptions[gearId]}</p></div>
        <div className="gear-pair"><figure><EquipmentArt item={previewUpgrade&&upgradeable?item:currentItem}/><figcaption>{previewUpgrade&&upgradeable?'Before reinforcement':'Currently equipped'}<strong>{EQUIPMENT[(previewUpgrade&&upgradeable?item:currentItem).id].name}{(previewUpgrade&&upgradeable?item:currentItem).upgraded?' +':''}</strong></figcaption></figure><span className="comparison-arrow" aria-hidden="true">→</span><figure className={candidate.upgraded?'reinforced-workpiece':''}><EquipmentArt item={candidate}/><figcaption>{previewUpgrade&&upgradeable?'After reinforcement':'Selected item'}<strong>{data.name}{candidate.upgraded?' +':''}</strong></figcaption></figure></div>
        <p className="gear-properties">{bonuses(candidate)}</p>
        <div className="comparison-heading"><h4>{previewUpgrade&&upgradeable?'Your build if reinforced and equipped':'Your build if equipped'}</h4>{upgradeable&&<button className="quiet" aria-pressed={previewUpgrade} onClick={()=>setPreviewUpgrade(value=>!value)}>{previewUpgrade?'Show owned item':'Preview reinforcement'}</button>}</div>
        <StatComparison profile={state.profile} item={candidate}/>
        <details className="build-totals"><summary>All build statistics</summary><StatComparison profile={state.profile} item={candidate} all/></details>
        <div className="workpiece-actions">
          {!owned?<button className="modal-primary" disabled={!available||insufficient(cost)} onClick={()=>confirm({type:'buy',itemId:gearId,revision:state.revision})}>{!available?'Sold out':insufficient(cost)?`Need ${cost-state.salvage} more salvage`:`Buy · ${cost} salvage`}</button>:<button className={equipped?'session-secondary':'modal-primary'} disabled={equipped} onClick={event=>{if(event.detail<=1&&dispatch({type:'equip',itemId:gearId,revision:state.revision})){setResult(`${data.name} equipped. No resource refill.`);focusResult.current=true;}}}>{equipped?'Equipped':`Equip ${data.name}`}</button>}
          {owned&&data.upgradedBonuses&&<button className="session-secondary" disabled={!!owned.upgraded||insufficient(GEAR_UPGRADE_COST)} onClick={()=>confirm({type:'upgrade-item',itemId:gearId,revision:state.revision})}>{owned.upgraded?'Fully upgraded':insufficient(GEAR_UPGRADE_COST)?`Upgrade needs ${GEAR_UPGRADE_COST-state.salvage} more salvage`:`Upgrade · ${GEAR_UPGRADE_COST} salvage`}</button>}
        </div>
        <p className="session-caption">{!owned?'Buying adds ownership. Equip separately.':equipped?'Free swaps between encounters.':'Equipping is free.'} Swaps never restore HP or MP.</p>
      </section>
    </div>:<div className="technique-workbench">
      <section className="technique-detail" aria-label="Selected technique"><h3 ref={resultHeading} tabIndex={-1}>Refinement bench</h3>{card&&<><div className="technique-pair"><TechniqueDisplay card={card} caption={`Selected · copy ${state.profile.deck.findIndex(item=>item.id===card.id)+1}`}/>{refined&&<><span className="comparison-arrow" aria-hidden="true">→</span><TechniqueDisplay card={refined} caption="After refinement"/></>}</div><p className="session-caption">{protectedCard?'Kiln Pulse is kept for teacher training. It cannot be refined here or removed.':card.upgrade?'This instance is already refined. Select another copy to refine.':'Refine this copy, or remove it from your deck.'}</p></>}
        <div className="workpiece-actions"><button className="modal-primary" disabled={!refined||insufficient(CARD_UPGRADE_COST)} onClick={()=>confirm({type:'refine-card',cardId:selected,revision:state.revision})}>{insufficient(CARD_UPGRADE_COST)?`Refine needs ${CARD_UPGRADE_COST-state.salvage} more salvage`:`Refine · ${CARD_UPGRADE_COST} salvage`}</button><button className="session-secondary" disabled={!card||protectedCard||state.profile.deck.length<=MIN_DECK||insufficient(CARD_REMOVE_COST)} onClick={()=>confirm({type:'remove-card',cardId:selected,revision:state.revision})}>Remove · {CARD_REMOVE_COST} salvage</button></div>
        <p className="session-caption">{state.profile.deck.length} cards · minimum {MIN_DECK}. Refinement once per copy. No refunds.{state.profile.deck.length<=MIN_DECK?' Minimum deck size reached.':''}{insufficient(CARD_REMOVE_COST)?` Removal needs ${CARD_REMOVE_COST-state.salvage} more salvage.`:''}</p>
      </section>
      <section className="technique-gallery" aria-label="Choose a card instance"><h3>Your techniques <small>{state.profile.deck.length} cards</small></h3><div className="technique-tiles">{state.profile.deck.map((entry,index)=>{
        const label=cardLabel(entry);
        return <button className={`technique-tile${entry.upgrade?' enhanced-technique':''}`} key={entry.id} aria-pressed={entry.id===selected} aria-label={`Select copy ${index+1}: ${label}`} onClick={()=>{setSelected(entry.id);setResult('');}}><TechniqueIllustration card={entry}/><span className="copy-number">{String(index+1).padStart(2,'0')}</span><strong>{cardDefinition(entry).name}</strong><small>{entry.upgrade?cardDefinition(entry).technique:'Original'}{entry.type==='pulse'?' · Teacher only':''}</small></button>;
      })}</div></section>
    </div>}
    <footer className="workshop-exit"><p>Leaving closes this workshop.</p><button className="session-secondary" onClick={()=>dispatch({type:'continue-route',nodeId:state.currentNode!,revision:state.revision})}>Leave workshop →</button></footer>
    {pending&&<ConfirmDialog title={pending.type==='buy'?'Acquire equipment':pending.type==='upgrade-item'?'Reinforce equipment':pending.type==='refine-card'?'Refine this technique?':'Remove this card permanently?'} confirmLabel={`Spend ${pendingCost} salvage`} onCancel={()=>setPending(null)} onConfirm={finishInvestment}>
      {pendingGear?<><div className="investment-art">{pending.type==='upgrade-item'&&<EquipmentArt item={pendingGear}/>}<EquipmentArt item={pending.type==='upgrade-item'?{...pendingGear,upgraded:true}:pendingGear}/></div><p><strong>{EQUIPMENT[pendingGear.id].name}</strong>{pending.type==='buy'?' joins your collection. Equip it separately.':' gains its one reinforcement.'}</p>{pending.type==='upgrade-item'&&<p className="session-caption">{bonuses(pendingGear)} → {bonuses({...pendingGear,upgraded:true})}. {equipped?'Equipped stats update.':'This item stays unequipped.'}</p>}</>:<>{card&&<TechniqueDisplay card={pending.type==='refine-card'&&refined?refined:card} caption={pending.type==='refine-card'?'Result':'Permanently removed'}/>}<p>{pending.type==='remove-card'?`${state.profile.deck.length} → ${state.profile.deck.length-1} cards. This removal cannot be undone.`:'Only this card copy is refined.'}</p></>}
      <p className="investment-cost">Salvage <strong>{state.salvage} → {state.salvage-pendingCost}</strong></p>
    </ConfirmDialog>}
  </section>;
}
