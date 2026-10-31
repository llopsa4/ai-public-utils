import { CARDS, cardLabel } from '../content/cards';
import { ROUTE_ENCOUNTERS } from '../content/rewards';
import type { CampaignState, CampaignCommand } from '../game/campaign';
import { restProfile, trainingProfile, victoryProfile } from '../game/rewards';
import { deriveStats } from '../game/equipment';
import { nodeById } from '../game/dungeon';
import { ROUTE_PREVIEW } from '../content/dungeon';
import { CardArt } from './CardArt';
import type { RewardCardType } from '../game/types';

type Dispatch=(command:CampaignCommand)=>unknown;
export function DeckCollection({state}:{state:CampaignState}) {
  const cards=new Map<string,number>();
  for(const card of state.profile.deck){const name=cardLabel(card);cards.set(name,(cards.get(name)??0)+1);}
  return <details className="deck-collection"><summary>Deck · {state.profile.deck.length} cards</summary><ul className="pile-list">{[...cards].sort(([a],[b])=>a.localeCompare(b)).map(([name,count])=><li key={name}>{name}<span>×{count}</span></li>)}</ul></details>;
}
export function RewardChoice({state,dispatch}:{state:CampaignState;dispatch:Dispatch}) {
  const reward=state.pendingReward;
  if(!reward||reward.kind==='checkpoint')return null;
  const training=reward.kind==='training',victory=reward.kind==='victory';
  const after=training?trainingProfile(state.profile,state.battleStart!.hero.hp,state.battleStart!.mp):victory?victoryProfile(state.profile):state.profile;
  const salvage=victory?(reward.nodeId==='kiln-checkpoint'||reward.nodeId==='route-story'?20:12):0;
  function choose(card:RewardCardType|null){dispatch({type:'choose-reward',claimId:reward!.id,card,revision:state.revision});}
  return <section aria-label={training?'Training milestone':'Card reward'}>
    <p>{training?'A steadier gauntlet. A stronger courier.':victory?(reward.cards.length?'Keep one technique, or leave the cards.':'The crossing is clear. Collect your resources.'):'Choose one technique, or leave it behind.'}</p>
    <div className="session-stats reward-summary">
      {!!salvage&&<span>Salvage <strong>{state.salvage} → {state.salvage+salvage}</strong></span>}
      <span>MP <strong>{state.profile.mp} → {after.mp}/{deriveStats(after).maxMp}</strong></span>
      {training&&<><span>HP <strong>{state.profile.hp} → {after.hp}/{after.maxHp}</strong></span><span>Max HP <strong>+6</strong> · Max MP <strong>+2</strong></span></>}
    </div>
    {training?<><p className="session-caption">Restore pre-training resources, then grow. Kiln Pulse gains Tempered Flow: 3 MP and +3 strain, with the same damage, block and energy cost.</p><button className="modal-primary" onClick={()=>choose(null)}>Complete training</button></>:<>
      <div className="reward-options">{reward.cards.map(type=>{const card=CARDS[type];return <button key={type} className="reward-option" aria-label={`Choose ${card.name}. ${card.cost} energy.${card.mpCost?` ${card.mpCost} MP.`:''} ${card.text}`} onClick={event=>{if(event.detail<=1)choose(type);}}>
        <CardArt type={card.icon} className="reward-art"/><span className="reward-name">{card.name}</span><small>{card.cost} energy{card.mpCost?` · ${card.mpCost} MP`:''}</small><span className="reward-effect">{card.text}</span><span className="reward-pick">Add to deck</span>
      </button>;})}</div>
      <button className="session-secondary" onClick={()=>choose(null)}>{victory?(reward.cards.length?'Skip card · collect resources':'Collect resources'):'Skip card'}</button>
      {reward.cards.length>0&&<p className="session-caption">One choice. These cards stay with your story deck.</p>}
    </>}
    <DeckCollection state={state}/>
  </section>;
}
export function ProgressionDestination({state,dispatch}:{state:CampaignState;dispatch:Dispatch}) {
  const node=nodeById(ROUTE_PREVIEW,state.currentNode!)!,revision=state.revision,nodeId=node.id;
  const afterRest=restProfile(state.profile),encounter=ROUTE_ENCOUNTERS[nodeId];
  if(encounter)return <section className="route-destination" aria-label="Encounter preparation"><h2>{node.name}</h2><p>{node.kind==='teacher'?'Practice with the guarded rig. Victory restores your pre-training resources and unlocks growth.':`A ${encounter.enemy.maxHp}-HP machine blocks the path.`}</p>
    <p className="session-caption">{node.kind==='teacher'?'+6 maximum/current HP, +2 maximum/current MP and Tempered Flow, once.':'Victory: 12 salvage, recover up to 2 MP, and choose 1 of 3 cards or skip.'} Defeat retries the exact starting state.</p>
    <button className="modal-primary" onClick={()=>dispatch({type:'start-encounter',nodeId,revision})}>{node.kind==='teacher'?'Begin training':'Face the machine'}</button><DeckCollection state={state}/></section>;
  if(node.kind==='rest')return <section className="route-destination" aria-label="Rest site"><h2>{node.name}</h2><p>Catch your breath beside the quiet hearth.</p><div className="session-stats"><span>HP <strong>{state.profile.hp} → {afterRest.hp}/{afterRest.maxHp}</strong></span><span>MP <strong>{state.profile.mp} → {afterRest.mp}/{deriveStats(afterRest).maxMp}</strong></span></div><p className="session-caption">Recover 30% of maximum HP, rounded up, and refill MP. Once at this stop.</p><button className="modal-primary" onClick={()=>dispatch({type:'rest',nodeId,revision})}>Rest and continue</button></section>;
  if(node.kind==='discovery')return <section className="route-destination" aria-label="Discovery choice"><h2>{node.name}</h2><p>{nodeId==='route-discovery'?'Salvage remains beside a training fixture.':'A warm service alcove offers a brief pause.'}</p>
    <div className="discovery-options"><button className="session-secondary" onClick={()=>dispatch({type:'discover',nodeId,option:'salvage',revision})}>Take 10 salvage<small>{state.salvage} → {state.salvage+10}</small></button>
    {nodeId==='route-discovery'?<button className="session-secondary" onClick={()=>dispatch({type:'discover',nodeId,option:'cards',revision})}>Study a technique<small>Choose 1 of 3 cards, or skip</small></button>:<button className="session-secondary" onClick={()=>dispatch({type:'discover',nodeId,option:'mp',revision})}>Recover 2 MP<small>{state.profile.mp} → {victoryProfile(state.profile).mp}/{deriveStats(state.profile).maxMp}</small></button>}</div><p className="session-caption">Choose one. The other option is left behind.</p></section>;
  return null;
}
