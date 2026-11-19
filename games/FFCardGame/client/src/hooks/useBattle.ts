import { useEffect, useRef, useState } from 'react';
import { createBattle, playCard, endTurn, preview, currentIntent } from '../game/combat';
import { cardDefinition } from '../content/cards';
import { PROTOTYPE_SETUP } from '../content/encounter';
import type { BattleState, CardInstance, BattleSetup, AllyId } from '../game/types';

export const BATTLE_FEEDBACK_MS = 420;
export type CombatMotion = 'strike' | 'heavy' | 'pulse' | 'guard' | 'vent' | 'cycle' | 'support' | 'enemy';
export function cardMotion(card: CardInstance): CombatMotion {
  const data = cardDefinition(card);
  return data.damage ? card.type === 'pulse' ? 'pulse' : card.type === 'piston' ? 'heavy' : 'strike' : (data.strain ?? 0) < 0 ? 'vent' : data.block ? 'guard' : 'cycle';
}

export interface BattleAnimation {
  motion: CombatMotion;
  impact: 'damage' | 'blocked' | 'none';
  actor: 'hero' | 'enemy';
  enemyHit: boolean;
  overload: boolean;
  text: string;
}
export function actionFeedback(previous: BattleState, next: BattleState, card?: CardInstance, supporting = false): BattleAnimation {
  if(card){
    const data=cardDefinition(card),effect=preview(previous,card),parts:string[]=[];
    const hpDamage=previous.enemy.hp-next.enemy.hp,absorbed=Math.min(previous.enemy.block,effect.damage);
    if(hpDamage>0)parts.push(`${hpDamage} HP`);
    if(absorbed>0)parts.push(`${absorbed} BLOCKED`);
    const gained=next.hero.block-previous.hero.block;
    if(gained>0)parts.push(`+${gained} BLOCK`);
    if(data.draw){const drawn=next.hand.length-previous.hand.length+1;parts.push(drawn?`+${drawn} CARD${drawn===1?'':'S'}`:'NO CARDS TO DRAW');}
    if((data.strain??0)<0&&previous.strain>next.strain)parts.push('VENTED');
    if(effect.overload)parts.push(`OVERLOAD −${previous.hero.hp-next.hero.hp} HP`);
    return {actor:'hero',motion:cardMotion(card),impact:effect.damage?(hpDamage>0?'damage':'blocked'):'none',enemyHit:effect.damage>0,overload:effect.overload,text:parts.join(' · ')||'VENTED'};
  }
  if(supporting)return {actor:'hero',motion:'support',impact:'none',enemyHit:false,overload:false,text:`IVEN +${next.hero.block-previous.hero.block} BLOCK`};
  const lost=previous.hero.hp-next.hero.hp,absorbed=Math.min(previous.hero.block,currentIntent(previous).damage);
  const parts=[lost?`−${lost} HP`:'BLOCKED',...(absorbed&&lost?[`${absorbed} BLOCKED`]:[])];
  return {actor:'enemy',motion:'enemy',impact:lost?'damage':'blocked',enemyHit:false,overload:false,text:parts.join(' · ')};
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
    const feedback=actionFeedback(previous,next,card,supporting);
    setOverloadFeedback(feedback.overload);
    setAnimation(feedback);
    setAnnouncement(`${next.log.at(-1)} ${card ? '' : `Turn ${next.turn}. `}Health ${next.hero.hp}. MP ${next.mp}. Energy ${next.energy}. Strain ${next.strain}.`);
    timer.current = setTimeout(() => {
      locked.current = false;
      timer.current = null;
      setAnimation(null);
      setBusy(false);
      if (next.outcome) setAnnouncement(next.outcome === 'victory' ? `Victory. ${next.config.encounter.enemy.name} is defeated.` : 'Defeat. The delivery is lost.');
    }, BATTLE_FEEDBACK_MS);
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
