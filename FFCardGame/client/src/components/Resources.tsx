import { ENERGY_PER_TURN } from '../content/encounter';
import type { BattleState } from '../game/types';

export function Resources({ state, busy, onEndTurn }: { state: BattleState; busy: boolean; onEndTurn: (keyboard: boolean) => void }) {
  const hot = state.strain >= 6;
  return <section className="dashboard" aria-label="Combat resources">
    <div className="energy"><div className="energy-orb"><strong id="energy">{state.energy}</strong><span>/ {ENERGY_PER_TURN}</span></div><div><span className="eyebrow">ENERGY</span><span className="resource-note">Refills each turn</span></div></div>
    <div className="strain-panel"><div className="strain-title"><span><span className="eyebrow">GAUNTLET STRAIN</span> <strong id="heat-status" className={hot ? 'hot' : ''}>{hot ? 'RUNNING HOT' : 'STABLE'}</strong></span><span id="strain-value">{state.strain} <span>/ 10</span></span></div>
      <div className="strain-meter" id="strain-meter" role="meter" aria-label="Gauntlet strain" aria-valuemin={0} aria-valuemax={10} aria-valuenow={state.strain} aria-valuetext={`${state.strain} of 10. ${hot ? 'Hot: attacks gain 2 damage.' : 'Stable.'} Overload at 10 deals 6 damage.`}>
        {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < state.strain ? 'filled' : ''} />)}
      </div><div className="strain-legend"><span>6–9: attacks +2</span><span>10: overload, lose 6 HP</span></div>
    </div>
    <button className="end-turn" id="end-turn" disabled={busy || !!state.outcome} onClick={event => { if (event.detail <= 1) onEndTurn(event.detail === 0); }}>End turn <span aria-hidden="true">→</span><small>Cool 3 strain · Enemy acts</small></button>
  </section>;
}
