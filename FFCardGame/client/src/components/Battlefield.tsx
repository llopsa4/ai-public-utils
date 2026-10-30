import { assets } from '../assets';
import { HERO_MAX_HP, ENEMY_MAX_HP, INTENTS } from '../content/encounter';
import type { BattleState } from '../game/types';
import type { BattleAnimation } from '../hooks/useBattle';

interface Props { state: BattleState; animation: BattleAnimation | null }

export function Battlefield({ state, animation }: Props) {
  const intent = INTENTS[state.intent];
  return <section className={`battlefield${animation?.overload ? ' overloaded' : ''}`} aria-label="Battlefield">
    <div className="stage-shade" /><div className="stage-grain" />
    <div className="scene-caption" aria-hidden="true"><span>SECTOR 04</span><span>ASH &amp; IRON</span></div>
    <div className="combatant hero">
      <Nameplate kind="THE COURIER" name="Mara, the Kiln Runner" who="hero" hp={state.hero.hp} max={HERO_MAX_HP} block={state.hero.block} />
      <img key={`hero-${state.revision}`} className={`fighter hero-art${animation ? animation.actor === 'hero' ? ' act' : ' hit' : ''}`} id="hero-art" src={assets.hero} alt="Mara, an ochre-cloaked courier in rounded ceramic armor, carrying a pressure gauntlet." />
      <span className="ground-shadow" />
    </div>
    <div className="versus" aria-hidden="true">— <span>Ⅰ</span> —</div>
    <div className="combatant enemy">
      <div className="intent" id="intent" tabIndex={0} aria-label={`Next enemy action: ${intent.name}. ${intent.damage} damage.${intent.block ? ` Gains ${intent.block} block before attacking.` : ''}`}>
        <span className="intent-mark" aria-hidden="true">{intent.block ? '◇' : '⚔'}</span><strong>{intent.damage} attack{intent.block ? ` + ${intent.block} block` : ''}</strong><small>{intent.name}</small>
      </div>
      <Nameplate kind="AUTOMATON / GUARDIAN" name="The Hollow Kiln" who="enemy" hp={state.enemy.hp} max={ENEMY_MAX_HP} block={state.enemy.block} />
      <img key={`enemy-${state.revision}`} className={`fighter enemy-art${animation?.actor === 'enemy' ? ' act' : animation?.enemyHit ? ' hit' : ''}`} id="enemy-art" src={assets.guardian} alt="A six-legged cast-iron furnace guardian with a cracked ceramic shell and a glowing orange core." />
      <span className="ground-shadow" />
    </div>
    <div className="battle-caption"><span className="location-dot" /> Some things were never meant to keep burning.</div>
    <div key={state.revision} className={`action-flash${animation ? ' show' : ''}`} id="action-flash" aria-hidden="true">{animation?.text}</div>
  </section>;
}

function Nameplate({ kind, name, who, hp, max, block }: { kind: string; name: string; who: string; hp: number; max: number; block: number }) {
  return <div className="nameplate"><span className="eyebrow">{kind}</span><h2>{name}</h2>
    <div className="vitals"><span id={`${who}-hp`}>{hp} / {max} HP</span><span id={`${who}-block`} className="block">{block ? `◇ ${block} BLOCK` : ''}</span></div>
    <div className={`health-track${who === 'enemy' ? ' enemy-health' : ''}`}><div id={`${who}-health-fill`} style={{ width: `${hp / max * 100}%` }} /></div>
  </div>;
}
