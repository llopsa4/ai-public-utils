import { openingArt } from '../assets';
import { EquipmentIcon } from './EquipmentIcon';
import { useEffect, useRef, useState } from 'react';
import type { CampaignCommand, CampaignState } from '../game/campaign';
import type { CharacterProfile, EquippedItem } from '../game/types';
import { EQUIPMENT, STARTING_EQUIPMENT } from '../content/equipment';
import { cardDefinition, cardLabel } from '../content/cards';
import { deriveStats, openingHandSize } from '../game/equipment';
import { atWorkshop } from '../game/systems';
import { equipOwned, SHOP_PRICES, GEAR_UPGRADE_COST, CARD_UPGRADE_COST, CARD_REMOVE_COST, MIN_DECK } from '../game/workshop';
import { ConfirmDialog } from './ConfirmDialog';

type Dispatch = (command: CampaignCommand) => unknown;
function totals(profile: CharacterProfile) { const stats = deriveStats(profile); return `${stats.power} power · ${stats.defense} defense · ${stats.speed} speed · ${openingHandSize(5,stats.speed)} opening cards · ${stats.maxMp} max MP${stats.attackStrain ? ` · +${stats.attackStrain} attack strain` : ''}`; }
function comparison(state: CampaignState, item: EquippedItem) { return totals(equipOwned(state.profile,item)); }
function bonuses(item: EquippedItem) {
  const data=EQUIPMENT[item.id],values=item.upgraded?data.upgradedBonuses!:data.bonuses;
  const labels:Record<string,string>={power:'Power',defense:'Defense',speed:'Speed',maxMp:'Max MP',attackStrain:'Attack strain'};
  return Object.entries(values).map(([key,value])=>`${labels[key]} ${value>0?'+':''}${value}`).join(' · ')||'Standard gear';
}
export function EquipmentCollection({state,dispatch}:{state:CampaignState;dispatch:Dispatch}) {
  if (!state.systems) return null;
  return <details className="equipment-collection"><summary>Equipment · free swaps between encounters</summary><p className="session-caption">Equipped: {totals(state.profile)}. Swaps never restore HP or MP.</p><ul className="owned-equipment">{state.systems.owned.map(item=>{
    const data=EQUIPMENT[item.id],equipped=(state.profile.equipment??STARTING_EQUIPMENT)[data.slot].id===item.id;
    return <li key={item.id} data-equipped={equipped}><div><EquipmentIcon id={item.id}/><strong>{data.name}{item.upgraded?' +':''}</strong><small>{data.slot} · {bonuses(item)} · {equipped?'Equipped':`If equipped: ${comparison(state,item)}`}</small></div><button className="quiet" disabled={equipped} onClick={event=>{if(event.detail<=1){dispatch({type:'equip',itemId:item.id,revision:state.revision});if(event.detail===0)event.currentTarget.closest('details')?.querySelector('summary')?.focus();}}}>{equipped?'Equipped':`Equip ${data.name}`}</button></li>;
  })}</ul></details>;
}
export function Workshop({state,dispatch}:{state:CampaignState;dispatch:Dispatch}) {
  const heading=useRef<HTMLHeadingElement>(null);
  const focusAfterPurchase=useRef(false);
  useEffect(()=>{if(focusAfterPurchase.current){focusAfterPurchase.current=false;heading.current?.focus();}},[state.revision]);
  const [selected,setSelected]=useState(state.profile.deck[0]?.id??'');
  useEffect(()=>{if(!state.profile.deck.some(card=>card.id===selected))setSelected(state.profile.deck[0]?.id??'');},[state.profile.deck,selected]);
  const [pending,setPending]=useState<CampaignCommand|null>(null);
  if(!state.systems||!atWorkshop(state))return null;
  const card=state.profile.deck.find(card=>card.id===selected),protectedCard=card?.type==='pulse';
  const refined=card&&!card.upgrade&&!protectedCard?cardDefinition({...card,upgrade:'refined'}):null;
  function confirm(command:CampaignCommand){setPending(command);}
  return <section className="workshop" aria-label="Workshop"><h2 ref={heading} tabIndex={-1}>{state.systems.opening?'Tempering workbench':'Old workbench'}</h2>{state.systems.opening&&<div className="workshop-location" style={{backgroundImage:`url(${openingArt['tempering-house']})`}} role="img" aria-label="The tempering workshop around the return pipe"/>}<p>Invest salvage in your gear or deck. Leaving closes this workshop.</p><p className="session-caption">Current build: {totals(state.profile)}</p>
    <h3>Equipment stock</h3><div className="shop-grid">{Object.entries(SHOP_PRICES).map(([id,cost])=>{
      const owned=state.systems!.owned.some(item=>item.id===id),available=state.systems!.stock.includes(id),short=state.salvage<cost;
      return <article className="shop-item" key={id} data-owned={owned} data-affordable={!short}><EquipmentIcon id={id}/><h4>{EQUIPMENT[id].name}</h4><small>{EQUIPMENT[id].slot} · {bonuses({id})}</small><p>If equipped: {comparison(state,{id})}</p><button className="session-secondary" disabled={owned||!available||short} onClick={()=>confirm({type:'buy',itemId:id,revision:state.revision})}>{owned?'Owned':!available?'Sold out':short?`Need ${cost-state.salvage} more salvage`:`Buy · ${cost} salvage`}</button></article>;
    })}</div>
    <EquipmentCollection state={state} dispatch={dispatch}/>
    <h3>Owned-item upgrades · {GEAR_UPGRADE_COST} salvage</h3><div className="item-upgrades">{state.systems.owned.filter(item=>EQUIPMENT[item.id].upgradedBonuses).map(item=><div key={item.id}><strong>{EQUIPMENT[item.id].name}</strong><p className="session-caption">If equipped after upgrade: {comparison(state,{...item,upgraded:true})}</p><button className="session-secondary" disabled={item.upgraded||state.salvage<GEAR_UPGRADE_COST} onClick={()=>confirm({type:'upgrade-item',itemId:item.id,revision:state.revision})}>{item.upgraded?'Fully upgraded':state.salvage<GEAR_UPGRADE_COST?'Not enough salvage':`Upgrade ${EQUIPMENT[item.id].name}`}</button></div>)}</div>
    {!state.systems.owned.some(item=>EQUIPMENT[item.id].upgradedBonuses)&&<p className="session-caption">Buy an alternative to unlock its one upgrade.</p>}
    <h3>Deck refinement</h3><label className="card-service-label">Choose a card instance<select value={selected} onChange={event=>setSelected(event.target.value)}>{state.profile.deck.map((card,index)=><option key={card.id} value={card.id}>{index+1}. {cardLabel(card)}</option>)}</select></label>
    <p className="session-caption">{protectedCard?'Kiln Pulse is kept for teacher training and cannot be removed.':card?.upgrade?'This instance is already refined.':`Refined: ${refined?.text??'Select a card.'}`}</p>
    <div className="session-actions"><button className="session-secondary" disabled={!refined||state.salvage<CARD_UPGRADE_COST} onClick={()=>confirm({type:'refine-card',cardId:selected,revision:state.revision})}>Refine · {CARD_UPGRADE_COST} salvage</button><button className="session-secondary" disabled={!card||protectedCard||state.profile.deck.length<=MIN_DECK||state.salvage<CARD_REMOVE_COST} onClick={()=>confirm({type:'remove-card',cardId:selected,revision:state.revision})}>Remove · {CARD_REMOVE_COST} salvage</button></div>
    <p className="session-caption">{state.profile.deck.length} cards · minimum {MIN_DECK}. Refinement once per instance. No refunds. {state.salvage<CARD_UPGRADE_COST?'Not enough salvage for card services.':''}</p>
    <button className="modal-primary" onClick={()=>dispatch({type:'continue-route',nodeId:state.currentNode!,revision:state.revision})}>Leave workshop</button>
    {pending&&<ConfirmDialog title="Confirm investment" confirmLabel="Spend salvage" onCancel={()=>setPending(null)} onConfirm={()=>{focusAfterPurchase.current=true;dispatch(pending);setPending(null);}}><p>{pending.type==='buy'?`Buy ${EQUIPMENT[pending.itemId].name} for ${SHOP_PRICES[pending.itemId]} salvage. This adds it to your collection; equip it separately.`:pending.type==='upgrade-item'?`Upgrade ${EQUIPMENT[pending.itemId].name} for ${GEAR_UPGRADE_COST} salvage.`:pending.type==='refine-card'?`Refine this ${card?cardLabel(card):'card'} for ${CARD_UPGRADE_COST} salvage.`:`Remove this ${card?cardLabel(card):'card'} permanently for ${CARD_REMOVE_COST} salvage.`}</p></ConfirmDialog>}
  </section>;
}
