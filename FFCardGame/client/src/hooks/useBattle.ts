import { useEffect, useRef, useState } from 'react';
import { createBattle, playCard, endTurn, preview } from '../game/combat';
import { cardDefinition } from '../content/cards';
import { PROTOTYPE_SETUP } from '../content/encounter';
import type { BattleState, CardInstance, BattleSetup } from '../game/types';

export interface BattleAnimation {
  actor: 'hero' | 'enemy';
  enemyHit: boolean;
  overload: boolean;
  text: string;
}

export function useBattle(setup: BattleSetup = PROTOTYPE_SETUP) {
  // One copied session setup: a caller cannot change an active battle by
  // mutating its profile. Restart reuses these resources and a fresh shuffle.
  const [initial] = useState(() => structuredClone(setup));
  const [state, setState] = useState<BattleState>(() => createBattle(initial.profile, initial.encounter, initial.seed));
  const current = useRef(state);
  const locked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [busy, setBusy] = useState(false);
  const [animation, setAnimation] = useState<BattleAnimation | null>(null);
  const [overloadFeedback, setOverloadFeedback] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function commit(next: BattleState, card?: CardInstance): boolean {
    const previous = current.current;
    if (locked.current || next === previous || previous.outcome) return false;
    // Synchronous refs reject a second event before React commits the render.
    locked.current = true;
    current.current = next;
    setState(next);
    setBusy(true);
    if (card) {
      const effect = preview(previous, card);
      setOverloadFeedback(effect.overload);
      setAnimation({ actor: 'hero', enemyHit: effect.damage > 0, overload: effect.overload,
        text: effect.overload ? 'OVERLOAD −6 HP' : effect.damage ? `${effect.damage} DAMAGE` : effect.block ? `+${effect.block} BLOCK` : (cardDefinition(card).strain ?? 0) < 0 ? 'VENTED' : '+2 CARDS' });
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
    return card ? commit(playCard(current.current, id, revision), card) : false;
  }

  function finishTurn(revision: number): boolean {
    return !locked.current && commit(endTurn(current.current, revision));
  }

  function restart(): boolean {
    if (locked.current) return false;
    const fresh = createBattle(initial.profile, initial.encounter);
    current.current = fresh;
    setState(fresh);
    setAnimation(null);
    setOverloadFeedback(false);
    setAnnouncement(`A fresh battle begins. ${fresh.hero.hp} health. ${fresh.mp} MP. ${fresh.energy} energy. ${fresh.hand.length} cards.`);
    return true;
  }

  return { state, busy, animation, overloadFeedback, announcement, play, finishTurn, restart };
}
