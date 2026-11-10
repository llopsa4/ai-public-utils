// Adventure-only combat poses; the standalone card game keeps its own battlefield.
import { battleVisual } from './presentation';
import { StoryDetails } from '@kc/components/StoryDetails';
import { assets } from './assets';
import { currentIntent } from '@kc/game/combat';
import type { BattleState } from '@kc/game/types';
import { BATTLE_FEEDBACK_MS, type BattleAnimation } from './useBattle';
import { combatDuration, heroPose } from './battleMotion';
import heroLow from '../../art/src/kc/hero-low.webp';
import heroPunch from '../../art/src/kc/hero-punch.webp';
import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { ArtifactFrame, StatusCrest, ResourceSymbol, FrameCorners } from '@kc/components/Ornaments';

/** A number popping from a fighter after a change: damage (red), block lost (blue), healing (green). */
interface Pop { id: number; who: 'hero' | 'enemy'; kind: 'damage' | 'block' | 'heal'; amount: number }
let popId = 0;

/** Compares each new state with the last one: the numbers to pop, and who was hit how hard. */
function useHits(state: BattleState): { pops: Pop[]; hit: { who: 'hero' | 'enemy'; heavy: boolean; id: number } | null } {
  const last = useRef({ hp: state.hero.hp, block: state.hero.block, ehp: state.enemy.hp, eblock: state.enemy.block });
  const [pops, setPops] = useState<Pop[]>([]);
  const [hit, setHit] = useState<{ who: 'hero' | 'enemy'; heavy: boolean; id: number } | null>(null);
  useEffect(() => {
    const before = last.current, now = { hp: state.hero.hp, block: state.hero.block, ehp: state.enemy.hp, eblock: state.enemy.block };
    last.current = now;
    const fresh: Pop[] = [];
    const add = (who: Pop['who'], kind: Pop['kind'], amount: number) => { if (amount > 0) fresh.push({ id: ++popId, who, kind, amount }); };
    add('hero', 'damage', before.hp - now.hp); add('hero', 'heal', now.hp - before.hp); add('hero', 'block', before.block - now.block);
    add('enemy', 'damage', before.ehp - now.ehp); add('enemy', 'heal', now.ehp - before.ehp); add('enemy', 'block', before.eblock - now.eblock);
    if (!fresh.length) return;
    setPops(p => [...p, ...fresh]);
    const struck = fresh.find(p => p.kind === 'damage');
    if (struck) setHit({ who: struck.who, heavy: struck.amount >= 6, id: struck.id });
    const ids = new Set(fresh.map(p => p.id));
    const timer = window.setTimeout(() => setPops(p => p.filter(x => !ids.has(x.id))), 1000);
    return () => window.clearTimeout(timer);
  }, [state.hero.hp, state.hero.block, state.enemy.hp, state.enemy.block]);
  return { pops, hit };
}

function Pops({ pops, who }: { pops: Pop[]; who: Pop['who'] }) {
  return <>{pops.filter(p => p.who === who).map((p, i) => <span key={p.id} className={`damage-pop pop-${p.kind}`} style={{ '--pop-i': i } as CSSProperties} aria-hidden="true">{p.kind === 'heal' ? '+' : '−'}{p.amount}</span>)}</>;
}

interface Props { state: BattleState; animation: BattleAnimation | null; onInspectIntent?: () => void; intentBlocked?: boolean; intentHighlighted?: boolean }

export function Battlefield({ state, animation, onInspectIntent, intentBlocked, intentHighlighted }: Props) {
  useEffect(() => {
    // Fetch both attack pictures at battle entry, before the first pose swap.
    for (const src of [assets.hero, heroPunch]) { const image = new Image(); image.src = src; }
  }, []);
  const visual=battleVisual(state),disabled=state.enemy.hp===0;
  const phase = animation?.phase ?? 'idle';
  const pose = heroPose(phase);
  const heroSprite = pose === 'upper' ? assets.hero : pose === 'punch' ? heroPunch : heroLow;
  const contact = phase !== 'approach';
  const motionKey = animation?.id ?? state.revision;
  const intent = currentIntent(state);
  const { hero, encounter } = state.config;
  const { pops, hit } = useHits(state);
  const field = useRef<HTMLElement>(null);
  useEffect(() => {
    // A heavy hit shakes the stage a few pixels; the struck fighter flashes (CSS, data-hit).
    const calm = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion');
    if (!hit?.heavy || calm) return;
    field.current?.animate([{ translate: '0 0' }, { translate: '-6px 2px' }, { translate: '5px -2px' }, { translate: '-3px 1px' }, { translate: '2px 0' }, { translate: '0 0' }], { duration: 340, easing: 'ease-out' });
    const struck = field.current?.querySelector(hit.who === 'enemy' ? '.enemy-art' : '.hero-art');
    struck?.animate([{ filter: 'brightness(2.6) saturate(.3)' }, { filter: 'brightness(2.6) saturate(.3)', offset: .25 }, { filter: 'none' }], { duration: 320, easing: 'ease-out' });
  }, [hit?.id]);
  return <section ref={field} data-phase={phase} data-training={visual.training || undefined} data-action={animation?.motion} data-impact={contact ? animation?.impact : undefined} data-actor={animation?.actor} style={{'--motion-duration':`${animation ? combatDuration(animation.motion) : BATTLE_FEEDBACK_MS}ms`} as CSSProperties} data-machine={visual.machine} className={`battlefield${animation?.overload && contact ? ' overloaded' : ''}`} aria-label="Battlefield">
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
      <div key={`hero-motion-${motionKey}`} className="fighter-motion hero-motion">
      <span className="ground-shadow" />
      <img className="fighter hero-art" id="hero-art" data-pose={pose} src={heroSprite} alt="Mara in ceramic armour, ready to fight with a powered gauntlet." />
      {animation?.actor==='hero'&&['guard','support','vent','cycle'].includes(animation.motion)&&<span className={`stance-effect stance-${animation.motion}`} aria-hidden="true"><ResourceSymbol kind="block"/><i/><i/><i/></span>}
      {animation?.overload&&contact&&<span className="overload-release" aria-hidden="true"/>}
      {animation?.actor==='hero'&&animation.enemyHit&&contact&&<span className="motion-trail" aria-hidden="true"/>}
      </div>
      {animation?.actor==='enemy'&&<ContactBurst/>}
      <Pops pops={pops} who="hero" />
    </div>
    <div className={`combatant enemy${disabled&&!animation?.enemyHit?' disabled-machine':''}`}>
      <button type="button" className={`intent${intentHighlighted ? ' lesson-target' : ''}`} id="intent" disabled={intentBlocked} onClick={onInspectIntent} aria-describedby={intentBlocked || intentHighlighted ? 'lesson-instruction' : undefined} aria-label={disabled?'Machine disabled. Passage clear.':`Next enemy action: ${intent.name}. ${intent.damage} damage.${intent.block ? ` Gains ${intent.block} block before attacking.` : ''}`}>
        <FrameCorners />
        {disabled?<strong className="disabled-label">DISABLED</strong>:<><div><span className="intent-mark" aria-hidden="true">⚔</span><strong>{intent.damage} <span>ATTACK</span></strong>{intent.block > 0 && <span className="intent-block"> + {intent.block} BLOCK</span>}</div>
        <small>{intent.name}</small></>}
      </button>
      <div key={`enemy-motion-${motionKey}`} className="fighter-motion enemy-motion">
      <span className="ground-shadow" />
      <img key={`enemy-${state.revision}`} style={visual.ink?{height:`calc(var(--enemy-size) / ${visual.ink.height})`,bottom:`calc(var(--floor) - 3px - var(--enemy-size) * ${visual.ink.gap/visual.ink.height})`,maxWidth:'none'}:undefined} className="fighter enemy-art" id="enemy-art" src={visual.sprite} alt={`${encounter.enemy.name}, a grounded maintenance machine with all supports planted on the floor.`} />
      {visual.reinforced&&<StoryDetails kind="armor"/>}
      </div>
      {visual.training&&<StoryDetails kind="cage"/>}
      {animation?.enemyHit&&contact&&<ContactBurst/>}
      <Pops pops={pops} who="enemy" />
    </div>
    <div key={motionKey} className={`action-flash${animation && contact ? ' show' : ''}`} id="action-flash" aria-hidden="true">{contact ? animation?.text : ''}</div>
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
      {/* The ghost: a lighter bar that drains after the real one, showing what the hit took. */}
      {!mp && <span className="health-ghost" style={{ width: `${maximum ? current / maximum * 100 : 0}%` }} />}
      <span id={mp ? 'mp-fill' : `${who}-health-fill`} style={{ width: `${maximum ? current / maximum * 100 : 0}%` }} />
    </div>
    <span id={mp ? 'hero-mp' : `${who}-hp`} className="status-value">{current} / {maximum}<small className="resource-label"> {mp ? 'MP' : 'HP'}</small></span>
  </div>;
}
