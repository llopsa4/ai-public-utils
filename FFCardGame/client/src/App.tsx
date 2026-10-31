import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { assets } from './assets';
import { Battlefield } from './components/Battlefield';
import { StrainGauge, EnergyOrb, EndTurn } from './components/Resources';
import { CardArt } from './components/CardArt';
import { Card } from './components/Card';
import { EffectPreview } from './components/EffectPreview';
import { EquipmentSummary } from './components/EquipmentSummary';
import { GameDialog, type DialogKind } from './components/GameDialog';
import { useBattle, type BattleController } from './hooks/useBattle';
import { completeTutorial, tutorialComplete } from './persistence/preferences';
import type { CardInstance, BattleSetup } from './game/types';
import { LESSON_STEPS, type LessonAction } from './content/tutorial';
import { tutorialMatches, type TutorialState } from './game/tutorial';

export interface LessonView { state: TutorialState; replay: boolean; act: (action: LessonAction) => boolean; reset: () => void }

export function App({ setup, controller, onMenu, onVictory, lesson, onReplay }: { setup?: BattleSetup; controller?: BattleController; onMenu?: () => void; onVictory?: () => void; lesson?: LessonView; onReplay?: () => void }) {
  const battle = useBattle(setup, controller);
  const { state, busy, animation } = battle;
  const supportRequired=state.support?.required;
  useEffect(()=>{if(supportRequired)document.getElementById('ally-support')?.focus();},[supportRequired]);
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [teaching, setTeaching] = useState(() => !tutorialComplete());
  const [inspected, setInspected] = useState<CardInstance | null>(null);
  const hand = useRef<HTMLDivElement>(null);
  const focusRequest = useRef<number | 'end-turn' | null>(null);
  const step = lesson ? LESSON_STEPS[lesson.state.step] : undefined;
  const validLesson = !lesson || tutorialMatches(lesson.state);
  const activeDialog = lesson ? (busy ? null : step?.dialog ?? null) : dialog;
  const blocked = (target: string) => !!lesson && (busy || step?.target !== target || !validLesson);
  const marked = (target: string) => step?.target === target;
  const highlighted = (target: string) => marked(target) ? ' lesson-target' : '';
  useLayoutEffect(() => {
    if (!lesson || busy || !step) return;
    const target = document.getElementById(step.target) ?? hand.current?.querySelector<HTMLElement>(`[data-card-id="${step.target}"]`);
    target?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    target?.focus({ preventScroll: true });
  }, [lesson?.state.step, busy, step?.target]);

  useEffect(() => {
    if (!lesson && state.outcome && !busy) setDialog('outcome');
  }, [state.outcome, busy, !!lesson]);

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
      focusRequest.current = keyboard && !lesson ? index : null;
    }
  }

  function endTurn(keyboard: boolean) {
    if (battle.finishTurn(state.revision)) {
      setInspected(null);
      focusRequest.current = keyboard && !lesson ? 'end-turn' : null;
    }
  }

  function restart() {
    if (!battle.restart()) return;
    setDialog(null);
    setInspected(null);
    focusRequest.current = 0;
  }

  function openDialog(kind: Exclude<DialogKind, 'outcome'>) {
    if (busy) return;
    if (lesson) lesson.act({ type: 'open', dialog: kind });
    else setDialog(kind);
  }
  function closeDialog() {
    if (lesson) { if (step?.dialog && step.dialog !== 'outcome') lesson.act({ type: 'close', dialog: step.dialog }); }
    else setDialog(null);
  }
  function confirmRestart() { openDialog('restart'); }

  return <div className={`combat-screen${lesson ? ' guided-combat' : ''}`} onClickCapture={event => {
    if (lesson && event.detail > 1) { event.preventDefault(); event.stopPropagation(); }
  }} onKeyDownCapture={event => {
    if (event.repeat && ['Enter', ' '].includes(event.key) && event.target instanceof Element && event.target.closest('button')) event.preventDefault();
  }}>
    <link rel="icon" href={assets.mark} type="image/svg+xml" />
    <a className="skip" href="#hand">Skip to cards</a>
    <header className="masthead">
      <a className="wordmark" href="./" aria-disabled={!!lesson || undefined} tabIndex={lesson ? -1 : undefined} aria-label={controller ? 'Kiln Courier, retry this encounter' : 'Kiln Courier, start a fresh battle'} onClick={event => { event.preventDefault(); if (!lesson) confirmRestart(); }}>KILN COURIER</a>
      <h1 className="chapter">{state.config.encounter.title} <span aria-hidden="true">·</span> <span id="phase-label">{state.outcome === 'victory' ? 'VICTORY' : state.outcome === 'defeat' ? 'DEFEAT' : 'TURN'}</span> <span id="turn">{String(state.turn).padStart(2, '0')}</span></h1>
      <nav aria-label="Game controls">
        {onMenu && <button className="quiet" onClick={onMenu}>Menu</button>}
        <button className={`quiet${highlighted('help-button')}`} id="help-button" disabled={blocked('help-button')} aria-describedby={lesson ? 'lesson-instruction' : undefined} onClick={() => openDialog('help')}><span className="help-icon" aria-hidden="true">?</span> Help</button>
        <button className={`quiet icon-button${highlighted('log-button')}`} id="log-button" disabled={blocked('log-button')} aria-label="Battle log" title="Battle log" aria-describedby={lesson ? 'lesson-instruction' : undefined} onClick={() => openDialog('log')}>≡</button>
        <button className={`quiet icon-button${highlighted('restart-button')}`} id="restart-button" disabled={blocked('restart-button')} aria-label="Restart" title="Restart battle" aria-describedby={lesson ? 'lesson-instruction' : undefined} onClick={confirmRestart}>↻</button>
      </nav>
    </header>
    {lesson && <aside className="lesson-banner" aria-label="Combat lesson"><strong>◆ {lesson.replay ? 'Practice' : 'Combat lesson'} {lesson.state.step + 1}/{LESSON_STEPS.length}</strong><p id="lesson-instruction" role="status">{step?.prompt} Follow the outlined control.</p>{!validLesson && <p role="alert">The lesson state does not match. <button onClick={lesson.reset}>Restart lesson safely</button></p>}</aside>}
    <main className="game">
      <Battlefield state={state} animation={animation} onInspectIntent={() => openDialog('intent')} intentBlocked={blocked('intent')} intentHighlighted={marked('intent')} />
      {teaching && !lesson && <aside className="teaching" id="teaching" aria-label="Combat tip"><p>Play cards. Block the next attack. At 6–9 strain, attacks hit harder.</p><button id="dismiss-tip" className="quiet" onClick={() => { completeTutorial(); setTeaching(false); document.getElementById('help-button')?.focus(); }}>Got it ×</button></aside>}
      <div className="resources-row"><StrainGauge state={state} overloaded={battle.overloadFeedback} /><EquipmentSummary state={state} /></div>
      {!!state.support?.present.length && <aside className={`support-panel${supportRequired?' support-introduction':''}`} aria-label="Ally support"><button id="ally-support" className={supportRequired?'session-secondary lesson-target':'session-secondary'} disabled={busy || !!state.outcome || state.support.spent.includes('iven')} onClick={event=>{if(event.detail<=1 && battle.support('iven',state.revision))focusRequest.current='end-turn';}}>Iven · {state.support.spent.includes('iven')?'Used this battle':'Brace · +8 block'}</button><p id="support-instruction" role="status">{supportRequired?'Iven can brace once each battle. Use his highlighted support before playing cards.':'One use per battle · no energy or MP cost.'}</p></aside>}
      <section className="combat-deck" aria-label="Combat controls">
        <aside className="deck-side left-controls">
          <EnergyOrb energy={state.energy} maximum={state.config.encounter.energyPerTurn} />
          <button className={`pile-button${highlighted('draw-button')}`} id="draw-button" disabled={blocked('draw-button')} aria-describedby={lesson ? 'lesson-instruction' : undefined} aria-label={`Draw pile ${state.draw.length}`} onClick={() => openDialog('draw')}><span className="pile-stack"><CardArt type="draw-back" /></span><span>DRAW <strong id="draw-count">{state.draw.length}</strong></span></button>
        </aside>
        <section className="hand-area" aria-labelledby="hand-title">
          <h2 className="sr-only" id="hand-title">Your hand <span id="hand-count">{state.hand.length} {state.hand.length === 1 ? 'card' : 'cards'}</span></h2>
          <div ref={hand} id="hand" className="hand" tabIndex={-1} aria-busy={busy}>{state.hand.map(card => <Card key={card.id} card={card} state={state} busy={busy || !!supportRequired} lessonBlocked={blocked(card.id)} highlighted={marked(card.id)} onInspect={setInspected} onPlay={play} />)}</div>
        </section>
        <aside className="deck-side right-controls">
          <EndTurn state={state} busy={busy || !!supportRequired} onEndTurn={endTurn} lessonBlocked={blocked('end-turn')} highlighted={marked('end-turn')} />
          <button className={`pile-button${highlighted('discard-button')}`} id="discard-button" disabled={blocked('discard-button')} aria-describedby={lesson ? 'lesson-instruction' : undefined} aria-label={`Discard pile ${state.discard.length}`} onClick={() => openDialog('discard')}><span className="pile-stack"><CardArt type="discard-back" /></span><span>DISCARD <strong id="discard-count">{state.discard.length}</strong></span></button>
        </aside>
      </section>
      <EffectPreview state={state} card={inspected} busy={busy} />
      {controller && !lesson && state.outcome && !dialog && !busy && <div className="battle-result-action"><button className="modal-primary" onClick={state.outcome === 'victory' ? onVictory : restart}>{state.outcome === 'victory' ? 'Continue' : 'Retry encounter'}</button></div>}
      <p className="sr-only" id="announcement" role="status" aria-live="polite" aria-atomic="true">{battle.announcement}</p>
    </main>
    <GameDialog kind={activeDialog} state={state} campaign={!!controller} lessonPrompt={step?.prompt} onReplay={onReplay} onVictory={onVictory} onClose={closeDialog} onRestart={restart} />
  </div>;
}
