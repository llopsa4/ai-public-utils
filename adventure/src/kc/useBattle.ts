// Adventure's pose timeline wraps Kiln Courier's rules and feedback without changing its game.
import { useEffect, useRef, useState } from 'react';
import { createBattle, playCard, endTurn } from '@kc/game/combat';
import { PROTOTYPE_SETUP } from '@kc/content/encounter';
import { actionFeedback, type BattleAnimation as Feedback, type BattleController } from '@kc/hooks/useBattle';
import type { BattleState, CardInstance, BattleSetup, AllyId } from '@kc/game/types';
import { APPROACH_MS, CONTACT_MS, combatDuration, isOffensive, type AttackPhase } from './battleMotion';

export { actionFeedback, cardMotion, BATTLE_FEEDBACK_MS } from '@kc/hooks/useBattle';
export type { BattleController, CombatMotion } from '@kc/hooks/useBattle';

export interface BattleAnimation extends Feedback {
  /** Stable across phase and displayed-state changes, so CSS movement never restarts at contact. */
  id: number;
  phase: AttackPhase;
  durationMs: number;
}

export function useBattle(setup: BattleSetup = PROTOTYPE_SETUP, controller?: BattleController) {
  const [initial] = useState(() => structuredClone(setup));
  const [localState, setState] = useState<BattleState>(() => controller?.state ?? createBattle(initial.profile, initial.encounter, initial.seed));
  const authoritative = controller?.state ?? localState;
  // Rules/controller state advances immediately, but the rendered result waits for physical contact.
  const [displayState, setDisplayState] = useState<BattleState | null>(null);
  const state = displayState ?? authoritative;
  const current = useRef(authoritative);
  current.current = authoritative;
  const locked = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const actionId = useRef(0);
  const [busy, setBusy] = useState(false);
  const [animation, setAnimation] = useState<BattleAnimation | null>(null);
  const [overloadFeedback, setOverloadFeedback] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  function commit(next: BattleState, card?: CardInstance, supporting = false): boolean {
    const previous = current.current;
    if (locked.current || next === previous || previous.outcome) return false;
    // Ref locking rejects double input before React has rendered disabled controls.
    locked.current = true;
    current.current = next;
    if (!controller) setState(next);
    const feedback = actionFeedback(previous, next, card, supporting);
    const offensive = feedback.actor === 'hero' && isOffensive(feedback.motion);
    const durationMs = combatDuration(feedback.motion);
    const active: BattleAnimation = { ...feedback, id: ++actionId.current, durationMs, phase: offensive ? 'approach' : 'idle' };
    setBusy(true);
    setAnimation(active);
    setDisplayState(offensive ? previous : null);
    setOverloadFeedback(offensive ? false : feedback.overload);
    const announceContact = () => {
      setAnnouncement(`${next.log.at(-1)} ${card ? '' : `Turn ${next.turn}. `}Health ${next.hero.hp}. MP ${next.mp}. Energy ${next.energy}. Strain ${next.strain}.`);
    };
    if (offensive) {
      // Schedule every boundary from the action start, avoiding cumulative drift from nested timers.
      timers.current.push(setTimeout(() => {
        setDisplayState(null);
        setAnimation({ ...active, phase: 'contact' });
        setOverloadFeedback(feedback.overload);
        announceContact();
      }, APPROACH_MS));
      timers.current.push(setTimeout(() => setAnimation({ ...active, phase: 'return' }), APPROACH_MS + CONTACT_MS));
    } else announceContact();
    timers.current.push(setTimeout(() => {
      locked.current = false;
      timers.current = [];
      setDisplayState(null);
      setAnimation(null);
      setBusy(false);
      if (next.outcome) setAnnouncement(next.outcome === 'victory' ? `Victory. ${next.config.encounter.enemy.name} is defeated.` : 'Defeat. The delivery is lost.');
    }, durationMs));
    return true;
  }

  function play(id: string, revision: number): boolean {
    if (locked.current || current.current.outcome) return false;
    const card = current.current.hand.find(item => item.id === id);
    if (!card) return false;
    const next = controller ? controller.play(id, revision) : playCard(current.current, id, revision);
    return next ? commit(next, card) : false;
  }

  function finishTurn(revision: number): boolean {
    if (locked.current || current.current.outcome) return false;
    const next = controller ? controller.endTurn(revision) : endTurn(current.current, revision);
    return next ? commit(next) : false;
  }

  function support(ally: AllyId, revision: number): boolean {
    if (locked.current || current.current.outcome) return false;
    const next = controller?.support?.(ally, revision);
    return next ? commit(next, undefined, true) : false;
  }

  function restart(): boolean {
    if (locked.current) return false;
    const fresh = controller ? controller.retry() : createBattle(initial.profile, initial.encounter);
    if (!fresh) return false;
    current.current = fresh;
    if (!controller) setState(fresh);
    setDisplayState(null);
    setAnimation(null);
    setOverloadFeedback(false);
    setAnnouncement(`A fresh battle begins. ${fresh.hero.hp} health. ${fresh.mp} MP. ${fresh.energy} energy. ${fresh.hand.length} cards.`);
    return true;
  }

  return { state, busy, animation, overloadFeedback, announcement, play, finishTurn, support, restart };
}
