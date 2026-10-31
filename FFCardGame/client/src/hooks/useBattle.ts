import { useEffect, useRef, useState } from 'react';
import { createBattle, playCard, endTurn, preview } from '../game/combat';
import { cardDefinition } from '../content/cards';
import { PROTOTYPE_SETUP } from '../content/encounter';
import type { BattleState, CardInstance, BattleSetup, AllyId } from '../game/types';

export interface BattleAnimation {
  actor: 'hero' | 'enemy';
  enemyHit: boolean;
  overload: boolean;
  text: string;
}
export interface BattleController {
  state: BattleState;
  play: (id: string, revision: number) => BattleState | null;
  endTurn: (revision: number) => BattleState | null;
  retry: () => BattleState | null;
  support?: (ally: AllyId, revision: number) => BattleState | null;
}

export function useBattle(setup: BattleSetup = PROTOTYPE_SETUP, controller?: BattleController) {
  // One copied session setup: a caller cannot change an active battle by
  // mutating its profile. Restart reuses these resources and a fresh shuffle.
  const [initial] = useState(() => structuredClone(setup));
  const [localState, setState] = useState<BattleState>(() => controller?.state ?? createBattle(initial.profile, initial.encounter, initial.seed));
  const state = controller?.state ?? localState;
  const current = useRef(state);
  current.current = state;
  const locked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [busy, setBusy] = useState(false);
  const [animation, setAnimation] = useState<BattleAnimation | null>(null);
  const [overloadFeedback, setOverloadFeedback] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function commit(next: BattleState, card?: CardInstance, supporting = false): boolean {
    const previous = current.current;
    if (locked.current || next === previous || previous.outcome) return false;
    // Synchronous refs reject a second event before React commits the render.
    locked.current = true;
    current.current = next;
    if (!controller) setState(next);
    setBusy(true);
    if (card) {
      const effect = preview(previous, card);
      setOverloadFeedback(effect.overload);
      setAnimation({ actor: 'hero', enemyHit: effect.damage > 0, overload: effect.overload,
        text: effect.overload ? 'OVERLOAD −6 HP' : effect.damage ? `${effect.damage} DAMAGE` : effect.block ? `+${effect.block} BLOCK` : (cardDefinition(card).strain ?? 0) < 0 ? 'VENTED' : '+2 CARDS' });
    } else if (supporting) {
      setOverloadFeedback(false);
      setAnimation({actor:'hero',enemyHit:false,overload:false,text:'IVEN +8 BLOCK'});
    } else {
      setOverloadFeedback(false);
      setAnimation({ actor: 'enemy', enemyHit: false, overload: false,
        text: previous.hero.hp > next.hero.hp ? `−${previous.hero.hp - next.hero.hp} HP` : 'BLOCKED' });
    }
    setAnnouncement(`${next.log.at(-1)} ${card ? '' : `Turn ${next.turn}. `}Health ${next.hero.hp}. MP ${next.mp}. Energy ${next.energy}. Strain ${next.strain}.`);
    timer.current = setTimeout(() => {
      locked.current = false;
      timer.current = null;
      setAnimation(null);
      setBusy(false);
      if (next.outcome) setAnnouncement(next.outcome === 'victory' ? `Victory. ${next.config.encounter.enemy.name} is defeated.` : 'Defeat. The delivery is lost.');
    }, 420);
    return true;
  }

  function play(id: string, revision: number): boolean {
    if (locked.current) return false;
    const card = current.current.hand.find(item => item.id === id);
    if (!card) return false;
    const next = controller ? controller.play(id, revision) : playCard(current.current, id, revision);
    return next ? commit(next, card) : false;
  }

  function finishTurn(revision: number): boolean {
    if (locked.current) return false;
    const next = controller ? controller.endTurn(revision) : endTurn(current.current, revision);
    return next ? commit(next) : false;
  }

  function support(ally: AllyId, revision: number): boolean {
    if(locked.current)return false;
    const next=controller?.support?.(ally,revision);
    return next?commit(next,undefined,true):false;
  }

  function restart(): boolean {
    if (locked.current) return false;
    const fresh = controller ? controller.retry() : createBattle(initial.profile, initial.encounter);
    if (!fresh) return false;
    current.current = fresh;
    if (!controller) setState(fresh);
    setAnimation(null);
    setOverloadFeedback(false);
    setAnnouncement(`A fresh battle begins. ${fresh.hero.hp} health. ${fresh.mp} MP. ${fresh.energy} energy. ${fresh.hand.length} cards.`);
    return true;
  }

  return { state, busy, animation, overloadFeedback, announcement, play, finishTurn, support, restart };
}
