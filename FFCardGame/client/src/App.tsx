import { useEffect, useRef, useState } from 'react';
import { assets } from './assets';
import { Battlefield } from './components/Battlefield';
import { StrainGauge, EnergyOrb, EndTurn } from './components/Resources';
import { CardArt } from './components/CardArt';
import { Card } from './components/Card';
import { EffectPreview } from './components/EffectPreview';
import { GameDialog, type DialogKind } from './components/GameDialog';
import { useBattle } from './hooks/useBattle';
import { completeTutorial, tutorialComplete } from './persistence/preferences';
import type { CardInstance, BattleSetup } from './game/types';

export function App({ setup }: { setup?: BattleSetup }) {
  const battle = useBattle(setup);
  const { state, busy, animation } = battle;
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [teaching, setTeaching] = useState(() => !tutorialComplete());
  const [inspected, setInspected] = useState<CardInstance | null>(null);
  const hand = useRef<HTMLDivElement>(null);
  const focusRequest = useRef<number | 'end-turn' | null>(null);

  useEffect(() => {
    if (state.outcome && !busy) setDialog('outcome');
  }, [state.outcome, busy]);

  useEffect(() => {
    if (busy || focusRequest.current === null || state.outcome) return;
    const requested = focusRequest.current;
    focusRequest.current = null;
    const enabled = [...hand.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
    const target = typeof requested === 'number' ? enabled[Math.min(Math.max(0, requested), enabled.length - 1)] : null;
    (target ?? document.getElementById('end-turn'))?.focus();
  }, [busy, state]);

  function play(card: CardInstance, revision: number, keyboard: boolean) {
    const index = state.hand.findIndex(item => item.id === card.id);
    if (battle.play(card.id, revision)) {
      setInspected(null);
      focusRequest.current = keyboard ? index : null;
    }
  }

  function endTurn(keyboard: boolean) {
    if (battle.finishTurn(state.revision)) {
      setInspected(null);
      focusRequest.current = keyboard ? 'end-turn' : null;
    }
  }

  function restart() {
    if (!battle.restart()) return;
    setDialog(null);
    setInspected(null);
    focusRequest.current = 0;
  }

  function confirmRestart() { if (!busy) setDialog('restart'); }

  return <div className="combat-screen" onKeyDownCapture={event => {
    if (event.repeat && ['Enter', ' '].includes(event.key) && event.target instanceof Element && event.target.closest('button')) event.preventDefault();
  }}>
    <link rel="icon" href={assets.mark} type="image/svg+xml" />
    <a className="skip" href="#hand">Skip to cards</a>
    <header className="masthead">
      <a className="wordmark" href="./" aria-label="Kiln Courier, start a fresh battle" onClick={event => { event.preventDefault(); confirmRestart(); }}>KILN COURIER</a>
      <h1 className="chapter">{state.config.encounter.title} <span aria-hidden="true">·</span> <span id="phase-label">{state.outcome === 'victory' ? 'VICTORY' : state.outcome === 'defeat' ? 'DEFEAT' : 'TURN'}</span> <span id="turn">{String(state.turn).padStart(2, '0')}</span></h1>
      <nav aria-label="Game controls">
        <button className="quiet" id="help-button" onClick={() => setDialog('help')}><span className="help-icon" aria-hidden="true">?</span> Help</button>
        <button className="quiet icon-button" id="log-button" aria-label="Battle log" title="Battle log" onClick={() => setDialog('log')}>≡</button>
        <button className="quiet icon-button" id="restart-button" aria-label="Restart" title="Restart battle" onClick={confirmRestart}>↻</button>
      </nav>
    </header>
    <main className="game">
      <Battlefield state={state} animation={animation} />
      {teaching && <aside className="teaching" id="teaching" aria-label="Combat tip"><p>Play cards. Block the next attack. At 6–9 strain, attacks hit harder.</p><button id="dismiss-tip" className="quiet" onClick={() => { completeTutorial(); setTeaching(false); document.getElementById('help-button')?.focus(); }}>Got it ×</button></aside>}
      <div className="resources-row"><StrainGauge state={state} /></div>
      <section className="combat-deck" aria-label="Combat controls">
        <aside className="deck-side left-controls">
          <EnergyOrb energy={state.energy} maximum={state.config.encounter.energyPerTurn} />
          <button className="pile-button" id="draw-button" aria-label={`Draw pile ${state.draw.length}`} onClick={() => setDialog('draw')}><span className="pile-stack"><CardArt type="draw-back" /></span><span>DRAW <strong id="draw-count">{state.draw.length}</strong></span></button>
        </aside>
        <section className="hand-area" aria-labelledby="hand-title">
          <h2 className="sr-only" id="hand-title">Your hand <span id="hand-count">{state.hand.length} {state.hand.length === 1 ? 'card' : 'cards'}</span></h2>
          <div ref={hand} id="hand" className="hand" tabIndex={-1} aria-busy={busy}>{state.hand.map(card => <Card key={card.id} card={card} state={state} busy={busy} onInspect={setInspected} onPlay={play} />)}</div>
        </section>
        <aside className="deck-side right-controls">
          <EndTurn state={state} busy={busy} onEndTurn={endTurn} />
          <button className="pile-button" id="discard-button" aria-label={`Discard pile ${state.discard.length}`} onClick={() => setDialog('discard')}><span className="pile-stack"><CardArt type="discard-back" /></span><span>DISCARD <strong id="discard-count">{state.discard.length}</strong></span></button>
        </aside>
      </section>
      <EffectPreview state={state} card={inspected} busy={busy} />
      <p className="sr-only" id="announcement" role="status" aria-live="polite" aria-atomic="true">{battle.announcement}</p>
    </main>
    <GameDialog kind={dialog} state={state} onClose={() => setDialog(null)} onRestart={restart} />
  </div>;
}
