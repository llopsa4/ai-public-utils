import { useEffect, useRef } from 'react';
import { cardDefinition, cardLabel } from '../content/cards';
import type { BattleState } from '../game/types';

export type DialogKind = 'help' | 'restart' | 'draw' | 'discard' | 'log' | 'outcome';
interface Props { kind: DialogKind | null; state: BattleState; onClose: () => void; onRestart: () => void }

export function GameDialog({ kind, state, onClose, onRestart }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (kind && !element.open) {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      element.showModal();
    } else if (!kind && element.open) element.close();
  }, [kind]);

  const victory = state.outcome === 'victory';
  const title = kind === 'help' ? 'Keep the fire in your hands.' : kind === 'restart' ? 'Start a fresh delivery?' : kind === 'draw' ? `Draw pile · ${state.draw.length}` : kind === 'discard' ? `Discard pile · ${state.discard.length}` : kind === 'log' ? 'Ashes of the battle' : kind === 'outcome' ? victory ? 'The delivery goes on.' : 'Even embers go cold.' : '';
  const closeLabel = kind === 'help' ? 'Back to the kiln' : kind === 'draw' || kind === 'discard' || kind === 'log' ? 'Back to battle' : 'Keep playing';

  return <dialog ref={dialog} id="modal" aria-labelledby="modal-title" onCancel={event => { event.preventDefault(); onClose(); }}
    onClose={() => {
      const target = returnFocus.current;
      if (target?.isConnected && !target.matches(':disabled')) target.focus();
      else document.getElementById('help-button')?.focus();
    }}
    onClick={event => {
      if (event.target !== dialog.current) return;
      const rect = dialog.current.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
    <div className="modal-top"><span className="eyebrow">KILN COURIER</span><button id="close-modal" className="quiet" aria-label="Close dialog" onClick={onClose}>Close ×</button></div>
    <h2 id="modal-title">{title}</h2>
    <div id="modal-body">
      {kind === 'help' && <Help state={state} />}
      {kind === 'restart' && <p>Your current battle will be lost. A new battle starts with its original resources and a freshly shuffled deck.</p>}
      {(kind === 'draw' || kind === 'discard') && <Pile state={state} which={kind} />}
      {kind === 'log' && <ol className="log-list">{state.log.map((entry, index) => <li key={index}>{entry}</li>)}</ol>}
      {kind === 'outcome' && <>
        <span className="outcome-kicker">{victory ? `${state.config.encounter.enemy.label.toUpperCase()} DEFEATED` : 'DELIVERY LOST'}</span>
        <p>{victory ? state.config.encounter.victoryText : 'The kiln keeps its silence. Take a breath, read its intentions, and give the gauntlet another chance.'}</p>
        <div className="summary-stats"><div><strong>{state.turn}</strong><span>TURNS</span></div><div><strong>{state.hero.hp}</strong><span>HEALTH LEFT</span></div><div><strong>{state.mp}</strong><span>MP LEFT</span></div><div><strong>{state.config.encounter.enemy.maxHp - state.enemy.hp}</strong><span>DAMAGE DEALT</span></div></div>
        <p>This is the end of the combat prototype. Try a fresh shuffle and a different balance of heat and defense.</p>
      </>}
    </div>
    <div id="modal-actions">
      {kind === 'outcome' ? <><button className="quiet" onClick={onClose}>Inspect battlefield</button><button className="modal-primary" onClick={onRestart}>Play again</button></>
        : kind === 'restart' ? <><button className="quiet" onClick={onClose}>Keep playing</button><button className="modal-primary" onClick={onRestart}>Restart battle</button></>
        : <button className="modal-primary" onClick={onClose}>{closeLabel}</button>}
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

function Help({ state }: { state: BattleState }) {
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
    <p>Defeat the {enemy} to win. If both fall on the same card, the delivery is lost. Reloading starts a fresh battle. This prototype has no audio.</p>
  </>;
}
