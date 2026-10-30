import { useEffect, useRef, useState } from 'react';
import { newBattle, playCard, endTurn, preview } from '../game/combat';
import { CARDS } from '../content/cards';
import type { BattleState, CardInstance } from '../game/types';

export interface BattleAnimation {
  actor: 'hero' | 'enemy';
  enemyHit: boolean;
  overload: boolean;
  text: string;
}

export function useBattle() {
  const [state, setState] = useState<BattleState>(() => newBattle());
  const current = useRef(state);
  const locked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [busy, setBusy] = useState(false);
  const [animation, setAnimation] = useState<BattleAnimation | null>(null);
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
      setAnimation({ actor: 'hero', enemyHit: effect.damage > 0, overload: effect.overload,
        text: effect.overload ? 'OVERLOAD −6 HP' : effect.damage ? `${effect.damage} DAMAGE` : effect.block ? `+${effect.block} BLOCK` : (CARDS[card.type].strain ?? 0) < 0 ? 'VENTED' : '+2 CARDS' });
    } else {
      setAnimation({ actor: 'enemy', enemyHit: false, overload: false,
        text: previous.hero.hp > next.hero.hp ? `−${previous.hero.hp - next.hero.hp} HP` : 'BLOCKED' });
    }
    setAnnouncement(`${next.log.at(-1)} ${card ? '' : `Turn ${next.turn}. `}Health ${next.hero.hp}. Energy ${next.energy}. Strain ${next.strain}.`);
    timer.current = setTimeout(() => {
      locked.current = false;
      timer.current = null;
      setAnimation(null);
      setBusy(false);
      if (next.outcome) setAnnouncement(next.outcome === 'victory' ? 'Victory. The guardian is defeated.' : 'Defeat. The delivery is lost.');
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
    const fresh = newBattle();
    current.current = fresh;
    setState(fresh);
    setAnimation(null);
    setAnnouncement('A fresh battle begins. 60 health. 3 energy. 5 cards.');
    return true;
  }

  return { state, busy, animation, announcement, play, finishTurn, restart };
}
