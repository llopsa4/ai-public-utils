import { CARDS } from '../content/cards';
import { preview } from '../game/combat';
import type { BattleState, CardInstance } from '../game/types';
import { CardIcon } from './CardIcon';

interface Props {
  card: CardInstance;
  state: BattleState;
  busy: boolean;
  onInspect: (card: CardInstance | null) => void;
  onPlay: (card: CardInstance, revision: number, keyboard: boolean) => void;
}

export function Card({ card, state, busy, onInspect, onPlay }: Props) {
  const data = CARDS[card.type], effect = preview(state, card);
  const reason = state.energy < data.cost ? ` Not enough energy: needs ${data.cost}, you have ${state.energy}.` : '';
  return <button className={`card ${data.kind.toLowerCase()}${effect.hot ? ' hot-card' : ''}`} data-card-id={card.id}
    disabled={busy || !!state.outcome || state.energy < data.cost} title={`${data.text}${reason}`}
    aria-label={`${data.name}. ${data.cost} energy. ${data.text}${effect.hot ? ' Hot bonus: +2 damage.' : ''}${effect.overload ? ' Warning: overload, lose 6 HP.' : ''}${reason}`}
    onPointerEnter={() => onInspect(card)} onPointerLeave={() => onInspect(null)} onFocus={() => onInspect(card)} onBlur={() => onInspect(null)}
    onClick={event => { if (event.detail <= 1) onPlay(card, state.revision, event.detail === 0); }}>
    <span className="card-top"><span className="card-cost">{data.cost}</span><span className="card-name">{data.name}</span></span>
    <span className="card-illustration"><CardIcon type={data.icon} /></span><span className="card-kind">{data.kind}</span>
    <span className="card-description">{effect.damage ? <>Deal <strong>{effect.damage}</strong> damage.{effect.hot && <> <strong>(+2 hot)</strong></>}</> : data.block ? <>Gain <strong>{data.block}</strong> block.</> : data.draw ? <>Draw <strong>{data.draw}</strong> cards.</> : <>Remove <strong>4</strong> strain.</>}</span>
    <span className={`card-strain${effect.overload ? ' danger' : ''}`}>{effect.overload ? '⚠ OVERLOAD · LOSE 6 HP' : (data.strain ?? 0) > 0 ? `+${data.strain} STRAIN` : (data.strain ?? 0) < 0 ? '−4 STRAIN · COOL DOWN' : 'NO STRAIN'}</span>
  </button>;
}
