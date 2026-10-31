import { cardDefinition, cardLabel } from '../content/cards';
import { preview, cardAvailability } from '../game/combat';
import type { BattleState, CardInstance } from '../game/types';
import { CardArt } from './CardArt';
import { FrameCorners, ResourceSymbol } from './Ornaments';

interface Props {
  card: CardInstance;
  state: BattleState;
  busy: boolean;
  onInspect: (card: CardInstance | null) => void;
  onPlay: (card: CardInstance, revision: number, keyboard: boolean) => void;
}

export function Card({ card, state, busy, onInspect, onPlay }: Props) {
  const data = cardDefinition(card), effect = preview(state, card);
  const { energyReason, mpReason } = cardAvailability(state, card);
  return <button className={`card ${data.kind.toLowerCase()}${effect.hot ? ' hot-card' : ''}${effect.overload ? ' overload-card' : ''}`} data-card-id={card.id}
    disabled={busy || !!state.outcome || !!energyReason || !!mpReason} title={`${data.text}${energyReason}${mpReason}`}
    aria-label={`${cardLabel(card)}. ${data.cost} energy.${data.mpCost ? ` ${data.mpCost} MP.` : ''} ${data.text}${effect.hot ? ' Hot bonus: +2 damage.' : ''}${effect.overload ? ' Warning: overload, lose 6 HP.' : ''}${energyReason}${mpReason}`}
    onPointerEnter={() => onInspect(card)} onPointerLeave={() => onInspect(null)} onFocus={() => onInspect(card)} onBlur={() => onInspect(null)}
    onClick={event => { if (event.detail <= 1) onPlay(card, state.revision, event.detail === 0); }}>
    <CardArt type={card.type} className="card-illustration" />
    <FrameCorners />
    <span className="card-cost" aria-hidden="true">{data.cost}</span>
    {data.mpCost && <span className="card-mp" aria-hidden="true"><ResourceSymbol kind="mp" /> {data.mpCost}<small>MP</small></span>}
    <span className="card-name">{data.name}{data.technique && <small className="card-technique">{data.technique}</small>}</span>
    <span className="card-description">
      {effect.damage > 0 && <span>Deal <strong>{effect.damage}</strong> damage.</span>}
      {effect.block > 0 && <span>Gain <strong>{effect.block}</strong> block.</span>}
      {data.draw && <span>Draw <strong>{data.draw}</strong> cards.</span>}
      {(data.strain ?? 0) < 0 && <span>Remove <strong>{-(data.strain ?? 0)}</strong> strain.</span>}
    </span>
    <span className="card-strain">{(data.strain ?? 0) > 0 ? `+${data.strain} strain.` : (data.strain ?? 0) < 0 ? 'Cool down' : 'No strain'}</span>
    {effect.overload && <span className="card-warning">Overload: −6 HP</span>}
    {effect.hot && !effect.overload && <span className="card-hot-note">Includes +2 hot damage</span>}
    {(energyReason || mpReason) && <span className="card-unavailable">{energyReason ? 'Not enough energy' : 'Not enough MP'}</span>}
  </button>;
}
