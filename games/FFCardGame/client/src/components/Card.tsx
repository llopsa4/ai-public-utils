import { cardDefinition, cardLabel } from '../content/cards';
import { preview, cardAvailability } from '../game/combat';
import type { BattleState, CardInstance } from '../game/types';
import { CardArt } from './CardArt';
import { FrameCorners, ResourceSymbol } from './Ornaments';

interface Props {
  card: CardInstance;
  state: BattleState;
  busy: boolean;
  lessonBlocked?: boolean;
  highlighted?: boolean;
  instructionId?: string;
  onInspect: (card: CardInstance | null) => void;
  onPlay: (card: CardInstance, revision: number, keyboard: boolean) => void;
}

export function Card({ card, state, busy, lessonBlocked, highlighted, instructionId, onInspect, onPlay }: Props) {
  const data = cardDefinition(card), effect = preview(state, card);
  const { energyReason, mpReason } = cardAvailability(state, card);
  const effectText = `${effect.damage ? `${effect.damage} damage. ` : ''}${effect.block ? `${effect.block} block. ` : ''}${data.draw ? `Draw ${data.draw}. ` : ''}${effect.strainDelta} strain.${effect.hot ? ` Includes hot bonus: +${2+(data.hotDamage??0)} damage.` : ''}${effect.overload ? ' Warning: overload, lose 6 HP.' : ''}${energyReason}${mpReason}`;
  return <button className={`card ${data.kind.toLowerCase()}${effect.hot ? ' hot-card' : ''}${effect.overload ? ' overload-card' : ''}${highlighted ? ' lesson-target' : ''}`} data-card-id={card.id}
    disabled={busy || !!state.outcome || !!energyReason || !!mpReason || lessonBlocked} title={`${effectText}${lessonBlocked ? ' Follow the highlighted lesson control first.' : ''}`} aria-describedby={lessonBlocked || highlighted ? instructionId ?? 'lesson-instruction' : undefined}
    aria-label={`${cardLabel(card)}. ${data.cost} energy.${data.mpCost ? ` ${data.mpCost} MP.` : ''} ${effectText}`}
    onPointerEnter={() => onInspect(card)} onPointerLeave={() => onInspect(null)} onFocus={() => onInspect(card)} onBlur={() => onInspect(null)}
    onClick={event => { if (event.detail <= 1) onPlay(card, state.revision, event.detail === 0); }}>
    <CardArt type={card.type} className="card-illustration" />
    <FrameCorners />
    <span className="card-cost" aria-hidden="true">{data.cost}</span>
    {data.mpCost && <span className="card-mp" aria-hidden="true"><ResourceSymbol kind="mp" /> {data.mpCost}<small>MP</small></span>}
    <span className="card-name">{data.name}{data.technique && <small className="card-technique">{data.technique}</small>}</span>
    <span className="card-description">
      {!!data.hotDamage && <small className="card-condition">Hot: +{data.hotDamage} extra damage</small>}
      {effect.damage > 0 && <span>Deal <strong>{effect.damage}</strong> damage.</span>}
      {effect.block > 0 && <span>Gain <strong>{effect.block}</strong> block.</span>}
      {data.draw && <span>Draw <strong>{data.draw}</strong> {data.draw === 1 ? 'card' : 'cards'}.</span>}
      {effect.strainDelta < 0 && <span>Remove <strong>{-effect.strainDelta}</strong> strain.</span>}
    </span>
    <span className="card-strain">{effect.strainDelta > 0 ? `+${effect.strainDelta} strain.` : effect.strainDelta < 0 ? 'Cool down' : 'No strain'}</span>
    {effect.overload && <span className="card-warning">Overload: −6 HP</span>}
    {effect.hot && !effect.overload && <span className="card-hot-note">Includes +{2+(data.hotDamage??0)} hot damage</span>}
    {(energyReason || mpReason) && <span className="card-unavailable">{energyReason ? 'Not enough energy' : 'Not enough MP'}</span>}
  </button>;
}
