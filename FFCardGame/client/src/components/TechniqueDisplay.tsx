import { cardDefinition } from '../content/cards';
import type { CardInstance } from '../game/types';
import { CardArt } from './CardArt';

export function TechniqueIllustration({ card }: { card:CardInstance }) {
  return <span className={`technique-illustration${card.upgrade==='tempered-flow'?' tempered-art':''}`}>
    <CardArt type={card.type}/>
    {card.upgrade==='tempered-flow'&&<svg className="tempered-channels" viewBox="0 0 240 140" aria-hidden="true"><path d="M20 105 65 105 90 80 130 80 160 50 220 50M20 115 70 115 95 90 135 90 165 60 220 60M40 20 40 50 65 75M180 15 180 30 155 55"/><circle cx="130" cy="80" r="12"/><circle cx="65" cy="105" r="7"/></svg>}
  </span>;
}

export function TechniqueDisplay({card,caption}:{card:CardInstance;caption:string}) {
  const data=cardDefinition(card);
  return <figure className={`technique-sample${card.upgrade?' enhanced-technique':''}`}>
    <figcaption>{caption}</figcaption>
    <TechniqueIllustration card={card}/>
    <div className="technique-description"><h4>{data.name}</h4><strong className="technique-rank">{data.technique??'Original technique'}</strong><small>{data.cost} energy{data.mpCost?` · ${data.mpCost} MP`:''}</small><p>{data.text}</p></div>
  </figure>;
}
