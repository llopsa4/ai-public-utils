import { useLayoutEffect, useRef } from 'react';
import { cardDefinition, cardLabel } from '../content/cards';
import type { BattleState } from '../game/types';

export type DialogKind = 'help' | 'restart' | 'draw' | 'discard' | 'log' | 'outcome' | 'intent';
interface Props { kind: DialogKind | null; state: BattleState; onClose: () => void; onRestart: () => void; campaign?: boolean; onVictory?: () => void; lessonPrompt?: string; onReplay?: () => void }

export function GameDialog({ kind, state, onClose, onRestart, campaign = false, onVictory, lessonPrompt, onReplay }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (kind && !element.open) {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      element.showModal();
    } else if (!kind && element.open) element.close();
  }, [kind]);

  const victory = state.outcome === 'victory';
  const title = kind === 'intent' ? state.config.encounter.enemy.intents[state.intent].name : kind === 'help' ? 'Keep the fire in your hands.' : kind === 'restart' ? 'Start a fresh delivery?' : kind === 'draw' ? `Draw pile · ${state.draw.length}` : kind === 'discard' ? `Discard pile · ${state.discard.length}` : kind === 'log' ? 'Ashes of the battle' : kind === 'outcome' ? victory ? 'The delivery goes on.' : 'Even embers go cold.' : '';
  const closeLabel = kind === 'help' ? 'Back to the kiln' : kind === 'draw' || kind === 'discard' || kind === 'log' ? 'Back to battle' : 'Keep playing';

  return <dialog ref={dialog} id="modal" aria-labelledby="modal-title" onCancel={event => { event.preventDefault(); onClose(); }}
    onClose={() => {
      if (lessonPrompt) return;
      const target = returnFocus.current;
      if (target?.isConnected && !target.matches(':disabled')) target.focus();
      else document.getElementById('help-button')?.focus();
    }}
    onClick={event => {
      if (lessonPrompt) return;
      if (event.target !== dialog.current) return;
      const rect = dialog.current.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
    <div className="modal-top"><span className="eyebrow">KILN COURIER</span><button id="close-modal" className={`quiet${lessonPrompt && kind !== 'restart' && kind !== 'outcome' ? ' lesson-target' : ''}`} disabled={!!lessonPrompt && (kind === 'restart' || kind === 'outcome')} aria-label="Close dialog" onClick={onClose}>Close ×</button></div>
    <h2 id="modal-title">{title}</h2>
    {lessonPrompt && <p className="lesson-modal-prompt" role="status">◆ {lessonPrompt}</p>}
    <div id="modal-body">
      {kind === 'intent' && <p>It will attack for <strong>{state.config.encounter.enemy.intents[state.intent].damage}</strong>.{state.config.encounter.enemy.intents[state.intent].block > 0 ? ` It gains ${state.config.encounter.enemy.intents[state.intent].block} block before attacking.` : ''} Gain block before ending your turn.</p>}
      {kind === 'help' && <Help state={state} campaign={campaign} />}
      {kind === 'restart' && <p>{lessonPrompt ? 'Cancel keeps this exact turn. To restart the whole lesson later, use Menu → Restart lesson.' : campaign ? 'Retry this encounter with exactly the same starting health, MP, deck order and seed. Your earlier progress stays.' : 'Your current battle will be lost. A new battle starts with its original resources and a freshly shuffled deck.'}</p>}
      {(kind === 'draw' || kind === 'discard') && <Pile state={state} which={kind} />}
      {kind === 'log' && <ol className="log-list">{state.log.map((entry, index) => <li key={index}>{entry}</li>)}</ol>}
      {kind === 'outcome' && <>
        <span className="outcome-kicker">{victory ? `${state.config.encounter.enemy.label.toUpperCase()} DEFEATED` : 'DELIVERY LOST'}</span>
        <p>{victory ? state.config.encounter.victoryText : 'The kiln keeps its silence. Take a breath, read its intentions, and give the gauntlet another chance.'}</p>
        <div className="summary-stats"><div><strong>{state.turn}</strong><span>TURNS</span></div><div><strong>{state.hero.hp}</strong><span>HEALTH LEFT</span></div><div><strong>{state.mp}</strong><span>MP LEFT</span></div><div><strong>{state.config.encounter.enemy.maxHp - state.enemy.hp}</strong><span>DAMAGE DEALT</span></div></div>
        <p>{lessonPrompt ? 'Lesson complete. Continue to return to your journey.' : campaign ? victory ? 'Continue to review the result and your reward. Your choices are saved.' : 'Retry from the exact saved starting state. Earlier progress stays.' : 'This is the end of the combat prototype. Try a fresh shuffle and a different balance of heat and defense.'}</p>
      </>}
    </div>
    <div id="modal-actions">
      {lessonPrompt ? kind === 'restart' ? <><button id="lesson-cancel" className="modal-primary lesson-target" onClick={onClose}>Cancel restart</button><button disabled title="Cancel first to keep this teaching battle." className="quiet">Restart unavailable during this step</button></> : kind === 'outcome' ? <button id="lesson-continue" className="modal-primary lesson-target" onClick={onVictory}>Continue</button> : null : kind === 'outcome' ? <><button className="quiet" onClick={onClose}>Inspect battlefield</button><button className="modal-primary" onClick={campaign && victory ? onVictory : onRestart}>{campaign ? victory ? 'Continue' : 'Retry encounter' : 'Play again'}</button></>
        : kind === 'restart' ? <><button className="quiet" onClick={onClose}>Keep playing</button><button className="modal-primary" onClick={onRestart}>Restart battle</button></>
        : <button className="modal-primary" onClick={onClose}>{closeLabel}</button>}
      {kind === 'help' && onReplay && <button className="quiet" onClick={onReplay}>Replay combat lesson</button>}
    </div>
  </dialog>;
}

function Pile({ state, which }: { state: BattleState; which: 'draw' | 'discard' }) {
  const counts = new Map<string, number>();
  for (const card of state[which]) {
    const label = cardLabel(card);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return <><p>{which === 'draw' ? 'Contents shown by name, not draw order. The discard pile reshuffles when this pile empties.' : 'Played and discarded cards return when the draw pile empties.'}</p>
    {counts.size ? <ul className="pile-list">{[...counts].sort(([a], [b]) => a.localeCompare(b)).map(([label, count]) => <li key={label}>{label}<span>×{count}</span></li>)}</ul> : <p>This pile is empty.</p>}
  </>;
}

function Help({ state, campaign }: { state: BattleState; campaign: boolean }) {
  const enemy = state.config.encounter.enemy.label.toLowerCase();
  const signature = [...state.hand, ...state.draw, ...state.discard].find(card => card.type === 'pulse');
  const pulse = cardDefinition(signature ?? { type: 'pulse', id: 'help-reference' });
  return <>
    <p>You are <strong>{state.config.hero.name}</strong>, a courier crossing a kiln district that should have gone cold years ago. One {enemy} stands between you and the exit.</p>
    <ul>
      <li><strong>Play cards:</strong> click, or Tab to a card and press Enter or Space. Attacks target the {enemy} automatically.</li>
      <li><strong>Spend energy:</strong> you get {state.config.encounter.energyPerTurn} each turn. Unspent energy does not carry over. Grey cards need more energy.</li>
      <li><strong>Spend MP:</strong> Kiln Pulse{pulse.technique ? ` (${pulse.technique})` : ''} costs {pulse.mpCost} MP and {pulse.cost} energy. MP lasts for the battle; normal cards need no MP. Pulse can return after reshuffling.</li>
      <li><strong>Read the intention:</strong> the {enemy} tells you its next action. Block absorbs damage, then expires at the start of your next turn.</li>
      <li><strong>Run hot:</strong> attacks played at 6–9 strain gain 2 damage, before the card adds strain. At 10 strain, lose 6 HP ignoring block, then reset to 4 strain.</li>
      <li><strong>Keep your heat:</strong> strain carries between turns. Use vent cards to cool it; each fresh battle starts with no strain.</li>
      <li><strong>End turn:</strong> discard your hand and let the {enemy} act. Then refill energy and draw {state.config.encounter.handSize}.</li>
      <li><strong>Keep cycling:</strong> when the draw pile empties, the discard pile is shuffled back in. Pressure Cycle cannot draw itself while resolving.</li>
    </ul>
    <p>Defeat the {enemy} to win. If both fall on the same card, the delivery is lost. {campaign ? 'Campaign actions autosave when storage is available; Continue resumes this exact state.' : 'Reloading the standalone battle returns to the menu without saving it.'} This prototype has no audio.</p>
  </>;
}
