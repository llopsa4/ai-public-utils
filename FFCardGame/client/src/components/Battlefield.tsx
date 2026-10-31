import { assets } from '../assets';
import { currentIntent } from '../game/combat';
import type { BattleState } from '../game/types';
import type { BattleAnimation } from '../hooks/useBattle';
import { ArtifactFrame, StatusCrest, ResourceSymbol, FrameCorners } from './Ornaments';

interface Props { state: BattleState; animation: BattleAnimation | null }

export function Battlefield({ state, animation }: Props) {
  const intent = currentIntent(state);
  const { hero, encounter } = state.config;
  return <section className={`battlefield${animation?.overload ? ' overloaded' : ''}`} aria-label="Battlefield">
    <div className="status-panel hero-status" aria-label={`${hero.name}'s status`}>
      <ArtifactFrame /><StatusCrest />
      <h2>{hero.name}</h2>
      <StatusBar who="hero" label={`${hero.name} HP`} current={state.hero.hp} maximum={hero.maxHp} />
      <StatusBar who="mp" label={`${hero.name} MP`} current={state.mp} maximum={hero.maxMp} />
      <span id="hero-block" className={`block-badge${state.hero.block ? '' : ' empty'}`}>{state.hero.block ? <><ResourceSymbol kind="block" /> {state.hero.block} BLOCK</> : 'No block'}</span>
    </div>
    <div className="status-panel enemy-status" aria-label={`${encounter.enemy.label}'s status`}>
      <ArtifactFrame /><StatusCrest enemy />
      <h2>{encounter.enemy.name}</h2>
      <StatusBar who="enemy" label={`${encounter.enemy.label} HP`} current={state.enemy.hp} maximum={encounter.enemy.maxHp} />
      <span id="enemy-block" className={`block-badge${state.enemy.block ? '' : ' empty'}`}>{state.enemy.block ? <><ResourceSymbol kind="block" /> {state.enemy.block} BLOCK</> : 'No block'}</span>
    </div>
    <div className="combatant hero">
      <span className="ground-shadow" />
      <img key={`hero-${state.revision}`} className={`fighter hero-art${animation ? animation.actor === 'hero' ? ' act' : ' hit' : ''}`} id="hero-art" src={assets.hero} alt="Mara, an ochre-cloaked courier in ceramic armor, standing on the kiln floor with a pressure gauntlet." />
    </div>
    <div className="combatant enemy">
      <div className="intent" id="intent" tabIndex={0} aria-label={`Next enemy action: ${intent.name}. ${intent.damage} damage.${intent.block ? ` Gains ${intent.block} block before attacking.` : ''}`}>
        <FrameCorners />
        <div><span className="intent-mark" aria-hidden="true">⚔</span><strong>{intent.damage} <span>ATTACK</span></strong>{intent.block > 0 && <span className="intent-block"> + {intent.block} BLOCK</span>}</div>
        <small>{intent.name}</small>
      </div>
      <span className="ground-shadow" />
      <img key={`enemy-${state.revision}`} className={`fighter enemy-art${animation?.actor === 'enemy' ? ' act' : animation?.enemyHit ? ' hit' : ''}`} id="enemy-art" src={assets.guardian} alt="A six-legged ceramic furnace guardian standing on the stone floor, its core glowing orange." />
    </div>
    <div key={state.revision} className={`action-flash${animation ? ' show' : ''}`} id="action-flash" aria-hidden="true">{animation?.text}</div>
  </section>;
}

function StatusBar({ who, label, current, maximum }: { who: 'hero' | 'enemy' | 'mp'; label: string; current: number; maximum: number }) {
  const mp = who === 'mp';
  return <div className={`status-row${mp ? ' magic' : ''}`}>
    <span className="status-icon" aria-hidden="true"><ResourceSymbol kind={mp ? 'mp' : 'hp'} /></span>
    <div className="status-track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={maximum} aria-valuenow={current}>
      <span id={mp ? 'mp-fill' : `${who}-health-fill`} style={{ width: `${maximum ? current / maximum * 100 : 0}%` }} />
    </div>
    <span id={mp ? 'hero-mp' : `${who}-hp`} className="status-value">{current} / {maximum}<small className="resource-label"> {mp ? 'MP' : 'HP'}</small></span>
  </div>;
}
