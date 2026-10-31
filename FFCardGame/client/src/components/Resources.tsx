import { useId, type CSSProperties } from 'react';
import { currentIntent } from '../game/combat';
import type { BattleState } from '../game/types';
import { FrameCorners } from './Ornaments';

export function StrainGauge({ state, overloaded = false }: { state: BattleState; overloaded?: boolean }) {
  const hot = state.strain >= 6 && state.strain <= 9;
  const critical = state.strain === 9;
  const id = useId();
  const label = overloaded ? 'OVERLOAD' : critical ? 'CRITICAL' : hot ? 'HEATED' : state.strain ? 'WARMING' : 'STEADY';
  const hint = overloaded ? 'Pressure released' : critical ? 'Attacks empowered · Vent soon' : hot ? 'Attacks empowered' : state.strain ? 'Heat carries between turns' : 'Build heat to empower attacks';
  return <section className={`strain-panel${hot ? ' hot' : ''}${critical ? ' critical' : ''}${overloaded ? ' overloaded' : ''}`} aria-label="Gauntlet strain" style={{ '--heat-level': state.strain / 10 } as CSSProperties}>
    <FrameCorners />
    <svg key={state.revision} className="strain-fire" viewBox="0 0 460 90" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id={`${id}-fire`} x2="0" y2="1"><stop stopColor="var(--flame-tip)" /><stop offset="1" stopColor="var(--flame-base)" stopOpacity=".15" /></linearGradient></defs>
      <path fill={`url(#${id}-fire)`} d="M0 90V68C18 64 10 46 28 37c-7 26 22 26 25 9 2-10-7-19 4-31 0 29 26 25 27 48 8-9 1-25 13-36 2 24 22 21 25 42 10-14 3-32 22-49-6 25 14 23 17 41 5-7 3-17 13-24-3 20 20 18 22 39 13-13 5-29 23-47-4 24 12 23 15 40 13-18 0-40 24-64-8 32 20 33 21 55 8-8 2-23 14-34 1 23 22 23 22 46 12-12 6-34 23-47-3 27 18 22 21 42 9-10 2-28 16-38 0 28 24 28 28 48 9-14 3-26 16-38 0 22 16 22 20 38 10-8 6-23 18-33 0 22 18 22 18 40v14Z" />
    </svg>
    <svg className="strain-gauntlet" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-metal`} x2="1" y2="1"><stop stopColor="#ddc797" /><stop offset=".4" stopColor="#756042" /><stop offset=".55" stopColor="#c8aa74" /><stop offset="1" stopColor="#33271c" /></linearGradient>
        <linearGradient id={`${id}-ceramic`} x2=".7" y2="1"><stop stopColor="#f2e1be" /><stop offset="1" stopColor="#8d7e65" /></linearGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill="#16100b" stroke={`url(#${id}-metal)`} strokeWidth="3" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#54412d" strokeWidth="1" strokeDasharray="3 5" />
      <g transform="rotate(-22 50 50)" stroke="#30251b" strokeWidth="2" strokeLinejoin="round">
        <path d="m32 63 2-28 5-12 10-3 17 4 9 15-4 24-9 13-25-3Z" fill={`url(#${id}-metal)`} />
        <path d="m33 43 5-18 10-3 2 20m0-20 10 1 2 20m-2-20 8 5 4 15M33 43l38 1-2 17-8 10-24-3Z" fill={`url(#${id}-ceramic)`} />
        <path d="m33 42-10 3-3 15 10 7 7-9Z" fill={`url(#${id}-metal)`} />
        <path d="m37 69 25 3-1 14-26-3Z" fill={`url(#${id}-metal)`} />
        <path className="gauntlet-vents" d="m42 48 18 1m-19 7 17 1m-17 7 14 1" fill="none" strokeWidth="3" strokeLinecap="round" />
        <circle cx="67" cy="49" r="3" fill="#2b2118" />
      </g>
    </svg>
    <div className="strain-instrument">
      <div className="strain-title">GAUNTLET STRAIN <strong id="heat-status">{label}</strong></div>
      <div className="strain-meter" id="strain-meter" role="meter" aria-label="Gauntlet strain" aria-valuemin={0} aria-valuemax={10} aria-valuenow={state.strain} aria-valuetext={`${state.strain} of 10. ${overloaded ? 'Overload released: lost 6 HP, reset to 4 strain. ' : ''}${hot ? 'Hot: attacks gain 2 damage.' : 'Attacks gain 2 damage at 6 strain.'} Strain persists between turns; vent cards release heat. A fresh fight starts at zero.`}><span /></div>
      <span className="strain-hint">{hint}</span>
    </div>
  </section>;
}

export function EnergyOrb({ energy, maximum }: { energy: number; maximum: number }) {
  return <div className="energy-orb" aria-label={`${energy} of ${maximum} energy`}><div><strong id="energy">{energy}</strong><span> / {maximum}</span></div><span className="energy-label">ENERGY</span></div>;
}

export function EndTurn({ state, busy, onEndTurn, lessonBlocked, highlighted }: { state: BattleState; busy: boolean; onEndTurn: (keyboard: boolean) => void; lessonBlocked?: boolean; highlighted?: boolean }) {
  const intent = currentIntent(state);
  return <div className="end-turn-group"><button className={`end-turn${highlighted ? ' lesson-target' : ''}`} id="end-turn" disabled={busy || !!state.outcome || lessonBlocked} aria-describedby={lessonBlocked || highlighted ? 'lesson-instruction' : undefined} title={lessonBlocked ? 'Follow the highlighted lesson control first.' : undefined} onClick={event => { if (event.detail <= 1) onEndTurn(event.detail === 0); }}><FrameCorners />END TURN <span className="end-turn-arrow" aria-hidden="true">→</span></button>
    <span className="enemy-reminder">{state.outcome ? 'Battle complete' : `Enemy attacks for ${intent.damage}.${intent.block ? ` Gains ${intent.block} block.` : ''}`}</span>
  </div>;
}
