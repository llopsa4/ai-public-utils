import { useEffect, useRef, useState } from 'react';
import { assets } from './assets';
import { Battlefield } from './components/Battlefield';
import { Resources } from './components/Resources';
import { Card } from './components/Card';
import { EffectPreview } from './components/EffectPreview';
import { GameDialog, type DialogKind } from './components/GameDialog';
import { useBattle } from './hooks/useBattle';
import { completeTutorial, tutorialComplete } from './persistence/preferences';
import type { CardInstance } from './game/types';

export function App() {
  const battle = useBattle();
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

  return <div onKeyDownCapture={event => {
    if (event.repeat && ['Enter', ' '].includes(event.key) && event.target instanceof Element && event.target.closest('button')) event.preventDefault();
  }}>
    <link rel="icon" href={assets.mark} type="image/svg+xml" />
    <a className="skip" href="#hand">Skip to cards</a>
    <header className="masthead">
      <a className="wordmark" href="./" aria-label="Kiln Courier, start a fresh battle" onClick={event => { event.preventDefault(); confirmRestart(); }}><img src={assets.mark} alt="" width={38} height={38} /><span>KILN<span className="wordmark-light">COURIER</span><small>THE FIRST DELIVERY</small></span></a>
      <div className="chapter"><span className="chapter-line" /> THE FORGOTTEN WORKS <span className="chapter-line" /></div>
      <nav aria-label="Game controls"><button className="quiet" id="help-button" onClick={() => setDialog('help')}>How to play <span aria-hidden="true">↗</span></button><button className="quiet" id="restart-button" onClick={confirmRestart}>Restart <span aria-hidden="true">↻</span></button></nav>
    </header>
    <main className="game">
      <section className="encounter-bar" aria-label="Encounter"><div><span className="eyebrow">ENCOUNTER 01 / THE KILN HALL</span><h1>A fire that never went out.</h1></div><div className="turn-label"><span className="status-dot" /><span id="phase-label">{state.outcome === 'victory' ? 'VICTORY' : state.outcome === 'defeat' ? 'DEFEAT' : 'YOUR TURN'}</span><strong id="turn">{String(state.turn).padStart(2, '0')}</strong></div></section>
      <Battlefield state={state} animation={animation} />
      <Resources state={state} busy={busy} onEndTurn={endTurn} />
      <section className="hand-area" aria-labelledby="hand-title"><div className="hand-heading"><h2 id="hand-title">Your hand <span id="hand-count">{state.hand.length} {state.hand.length === 1 ? 'CARD' : 'CARDS'}</span></h2><span id="play-hint">Choose a card. Make it count.</span></div>
        <div ref={hand} id="hand" className="hand" tabIndex={-1} aria-busy={busy}>{state.hand.map(card => <Card key={card.id} card={card} state={state} busy={busy} onInspect={setInspected} onPlay={play} />)}</div>
        <EffectPreview state={state} card={inspected} busy={busy} />
      </section>
      <footer className="battle-footer"><div className="pile-controls"><button className="pile-button" id="draw-button" onClick={() => setDialog('draw')}><span aria-hidden="true">▱</span> Draw pile <strong id="draw-count">{state.draw.length}</strong></button><button className="pile-button" id="discard-button" onClick={() => setDialog('discard')}><span aria-hidden="true">▱</span> Discard <strong id="discard-count">{state.discard.length}</strong></button></div><button className="quiet log-button" id="log-button" onClick={() => setDialog('log')}>Battle log <span aria-hidden="true">↗</span></button><span className="footer-edition">KILN COURIER <span>COMBAT PROTOTYPE / 01</span></span></footer>
      {teaching && <aside className="teaching" id="teaching" aria-label="Combat tip"><span className="tip-symbol" aria-hidden="true">✦</span><div><strong>A little heat goes a long way.</strong><p>Spend energy to play cards. Block the guardian’s next attack. Stay at 6–9 strain for stronger attacks, but reach 10 and your gauntlet overloads.</p></div><button id="dismiss-tip" className="quiet" onClick={() => { completeTutorial(); setTeaching(false); document.getElementById('help-button')?.focus(); }}>Got it <span aria-hidden="true">×</span></button></aside>}
      <p className="sr-only" id="announcement" role="status" aria-live="polite" aria-atomic="true">{battle.announcement}</p>
    </main>
    <GameDialog kind={dialog} state={state} onClose={() => setDialog(null)} onRestart={restart} />
  </div>;
}
