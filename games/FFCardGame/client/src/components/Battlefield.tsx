import { battleVisual } from '../presentation';
import { StoryDetails } from './StoryDetails';
import { assets } from '../assets';
import { currentIntent } from '../game/combat';
import type { BattleState } from '../game/types';
import { BATTLE_FEEDBACK_MS, type BattleAnimation } from '../hooks/useBattle';
import type { CSSProperties } from 'react';
import { ArtifactFrame, StatusCrest, ResourceSymbol, FrameCorners } from './Ornaments';

interface Props { state: BattleState; animation: BattleAnimation | null; onInspectIntent?: () => void; intentBlocked?: boolean; intentHighlighted?: boolean }

export function Battlefield({ state, animation, onInspectIntent, intentBlocked, intentHighlighted }: Props) {
  const visual=battleVisual(state),disabled=state.enemy.hp===0;
  const intent = currentIntent(state);
  const { hero, encounter } = state.config;
  return <section data-training={visual.training || undefined} data-action={animation?.motion} data-impact={animation?.impact} data-actor={animation?.actor} style={{'--motion-duration':`${BATTLE_FEEDBACK_MS}ms`} as CSSProperties} data-machine={visual.machine} className={`battlefield${animation?.overload ? ' overloaded' : ''}`} aria-label="Battlefield">
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
      <div key={`hero-motion-${state.revision}`} className="fighter-motion hero-motion">
      <span className="ground-shadow" />
      <img key={`hero-${state.revision}`} className="fighter hero-art" id="hero-art" src={assets.hero} alt="Mara, an ochre-cloaked courier in ceramic armor, standing on the kiln floor with a pressure gauntlet." />
      {animation?.actor==='hero'&&['guard','support','vent','cycle'].includes(animation.motion)&&<span className={`stance-effect stance-${animation.motion}`} aria-hidden="true"><ResourceSymbol kind="block"/><i/><i/><i/></span>}
      {animation?.overload&&<span className="overload-release" aria-hidden="true"/>}
      {animation?.actor==='hero'&&animation.enemyHit&&<span className="motion-trail" aria-hidden="true"/>}
      </div>
      {animation?.actor==='enemy'&&<ContactBurst/>}
    </div>
    <div className={`combatant enemy${disabled&&!animation?.enemyHit?' disabled-machine':''}`}>
      <button type="button" className={`intent${intentHighlighted ? ' lesson-target' : ''}`} id="intent" disabled={intentBlocked} onClick={onInspectIntent} aria-describedby={intentBlocked || intentHighlighted ? 'lesson-instruction' : undefined} aria-label={disabled?'Machine disabled. Passage clear.':`Next enemy action: ${intent.name}. ${intent.damage} damage.${intent.block ? ` Gains ${intent.block} block before attacking.` : ''}`}>
        <FrameCorners />
        {disabled?<strong className="disabled-label">DISABLED</strong>:<><div><span className="intent-mark" aria-hidden="true">⚔</span><strong>{intent.damage} <span>ATTACK</span></strong>{intent.block > 0 && <span className="intent-block"> + {intent.block} BLOCK</span>}</div>
        <small>{intent.name}</small></>}
      </button>
      <div key={`enemy-motion-${state.revision}`} className="fighter-motion enemy-motion">
      <span className="ground-shadow" />
      <img key={`enemy-${state.revision}`} style={visual.ink?{height:`calc(var(--enemy-size) / ${visual.ink.height})`,bottom:`calc(var(--floor) - 3px - var(--enemy-size) * ${visual.ink.gap/visual.ink.height})`,maxWidth:'none'}:undefined} className="fighter enemy-art" id="enemy-art" src={visual.sprite} alt={`${encounter.enemy.name}, a grounded maintenance machine with all supports planted on the floor.`} />
      {visual.reinforced&&<StoryDetails kind="armor"/>}
      </div>
      {visual.training&&<StoryDetails kind="cage"/>}
      {animation?.enemyHit&&<ContactBurst/>}
    </div>
    <div key={state.revision} className={`action-flash${animation ? ' show' : ''}`} id="action-flash" aria-hidden="true">{animation?.text}</div>
  </section>;
}

function ContactBurst() {
  return <span className="contact-burst" aria-hidden="true"><span className="pressure-ring"/><svg viewBox="0 0 100 100"><path d="m50 6 8 29 27-18-18 27 29 8-29 8 18 27-27-18-8 29-8-29-27 18 18-27L4 52l29-8-18-27 27 18Z"/><path d="m19 52 62-2M51 20l-2 63"/></svg></span>;
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
