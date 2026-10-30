import { currentIntent } from '../game/combat';
import type { BattleState } from '../game/types';

export function StrainGauge({ state }: { state: BattleState }) {
  const hot = state.strain >= 6;
  return <section className={`strain-panel${hot ? ' hot' : ''}`} aria-label="Gauntlet strain">
    <span className="gauntlet-seal" aria-hidden="true">✧</span>
    <div className="strain-instrument"><div className="strain-title"><span>GAUNTLET STRAIN</span><span id="strain-value">{state.strain} / 10</span></div>
      <div className="strain-meter" id="strain-meter" role="meter" aria-label="Gauntlet strain" aria-valuemin={0} aria-valuemax={10} aria-valuenow={state.strain} aria-valuetext={`${state.strain} of 10. ${hot ? 'Hot: attacks gain 2 damage.' : 'Stable. Attacks gain 2 damage at 6 strain.'} Overload at 10 deals 6 damage.`}>
        {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < state.strain ? 'filled' : ''} />)}
      </div>
    </div>
    <div className="strain-legend"><strong id="heat-status">{hot ? 'HOT · +2 attack' : '6–9: +2 attack'}</strong><span>10 = OVERLOAD</span></div>
  </section>;
}

export function EnergyOrb({ energy, maximum }: { energy: number; maximum: number }) {
  return <div className="energy-orb" aria-label={`${energy} of ${maximum} energy`}><div><strong id="energy">{energy}</strong><span> / {maximum}</span></div><span className="energy-label">ENERGY</span></div>;
}

export function EndTurn({ state, busy, onEndTurn }: { state: BattleState; busy: boolean; onEndTurn: (keyboard: boolean) => void }) {
  const intent = currentIntent(state);
  return <div className="end-turn-group"><button className="end-turn" id="end-turn" disabled={busy || !!state.outcome} onClick={event => { if (event.detail <= 1) onEndTurn(event.detail === 0); }}>END TURN <span aria-hidden="true">→</span></button>
    <span className="enemy-reminder">{state.outcome ? 'Battle complete' : `Enemy attacks for ${intent.damage}.${intent.block ? ` Gains ${intent.block} block.` : ''}`}</span>
  </div>;
}
