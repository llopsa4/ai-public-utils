// Cinderfold: the bridge to Kiln Courier's React screens. Loaded with import() when the first fight
// starts, so React, the battle code, its art and fonts never weigh on the title screen.
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './kc.css';
import './kc-local.css';
import { App, type LessonView } from '@kc/App';
import { Armory, type ArmoryProps } from './Armory';
import { Victory, type Loot } from './Victory';
import type { LessonAction } from '@kc/content/tutorial';
import { createBattle, endTurn, playCard } from '@kc/game/combat';
import { newTutorial, tutorialTransition, type TutorialState } from '@kc/game/tutorial';
import type { BattleState, CharacterProfile, EncounterDefinition } from '@kc/game/types';
import type { BattleController } from '@kc/hooks/useBattle';

/** The room the fight plays over (src/game/room/fightBridge.ts fightStage), in page pixels. */
export interface FightStage { left: number; top: number; width: number; height: number; heroSize: number; enemySize: number; floor: number }

export interface BattleOptions {
  /** Over the room: the battle screen is transparent, its fighters placed and sized to the room. */
  stage?: FightStage;
  onDefeat?: () => void;
  retryProfile?: () => CharacterProfile;
  /** Mara as the rules see him (from the saved kit). */
  profile: CharacterProfile;
  /** The first fight is Kiln Courier's guided lesson; Skip turns it into a free fight. */
  guided: boolean;
  /** The enemy, also of the guided lesson (Kiln Courier's lesson, taught against it). */
  encounter: EncounterDefinition;
  /** The lesson's prompts reworded for this enemy, by step index. */
  lessonPrompts?: Readonly<Record<number, string>>;
  rewards: string[];
  /** What a win pays, for the victory screen's loot tiles. */
  loot: Loot[];
  /** Plays as each loot tile appears. */
  onLootShown?: () => void;
  tonics: () => number;
  /** Drinks a tonic: the new battle state, or null if none could be drunk. */
  drink: (battle: BattleState) => BattleState | null;
  onWin: (battle: BattleState) => void;
  /** Kiln Courier's technique practice: the Tempered Flow card in the opening hand, to be played first. */
  practice?: boolean;
  /** Random fights: a new enemy for each retry after a fall (else the same fight again). */
  pickEncounter?: () => EncounterDefinition;
  onMenu: () => void;
}

/**
 * Kiln Courier's teacher practice (as its opening's training stop sets it up): the Tempered Flow card
 * is put in the opening hand and must be played first; its banner explains the technique.
 */
function practiceBattle(battle: BattleState): BattleState {
  const all = [...battle.hand, ...battle.draw];
  const card = all.find(c => c.upgrade === 'tempered-flow') ?? all.find(c => c.type === 'pulse');
  if (!card) return battle;
  if (!battle.hand.some(c => c.id === card.id)) {
    const index = battle.draw.findIndex(c => c.id === card.id);
    const [drawn] = battle.draw.splice(index, 1);
    const swapped = battle.hand.pop();
    if (swapped) battle.draw.push(swapped);
    battle.hand.unshift(drawn);
  }
  return { ...battle, practice: { requiredCardId: card.id } };
}

function Battle(o: BattleOptions) {
  const victory = (v: { state: BattleState; lesson: boolean; onContinue: () => void }) =>
    <Victory {...v} loot={o.loot} onReveal={o.onLootShown} />;
  const [lesson, setLesson] = useState<TutorialState | null>(() => (o.guided ? newTutorial(o.encounter) : null));
  const [start, setStart] = useState<BattleState>(() => (o.practice ? practiceBattle(createBattle(o.profile, o.encounter)) : createBattle(o.profile, o.encounter)));
  const [free, setFree] = useState<BattleState>(start);
  useEffect(()=>{if(free.outcome==='defeat')o.onDefeat?.();},[free.outcome]);
  const [, redraw] = useState(0);

  if (lesson) {
    const act = (action: LessonAction): TutorialState | null => {
      const next = tutorialTransition(lesson, { step: lesson.step, revision: lesson.revision, action }, o.encounter);
      if (next === lesson) return null;
      setLesson(next);
      if (action.type === 'finish') o.onWin(next.battle);
      return next;
    };
    const controller: BattleController = {
      state: lesson.battle,
      play: id => act({ type: 'play', id })?.battle ?? null,
      endTurn: () => act({ type: 'end-turn' })?.battle ?? null,
      retry: () => null,
    };
    const view: LessonView = {
      state: lesson, replay: false, encounter: o.encounter, prompts: o.lessonPrompts,
      act: action => !!act(action),
      reset: () => setLesson(newTutorial(o.encounter)),
      // Skip: the fight carries on from here, free.
      skip: () => {
        const here = structuredClone(lesson.battle);
        delete here.practice;
        setStart(createBattle(o.profile, o.encounter));
        setFree(here);
        setLesson(null);
      },
    };
    return <App key="lesson" controller={controller} lesson={view} onMenu={o.onMenu} onVictory={() => act({ type: 'finish' })} brand="The Rift: Ashlands" rewards={o.rewards} victoryView={victory} />;
  }

  const controller: BattleController = {
    state: free,
    play: (id, revision) => { const next = playCard(free, id, revision); if (next === free) return null; setFree(next); return next; },
    endTurn: revision => { const next = endTurn(free, revision); if (next === free) return null; setFree(next); return next; },
    // A fall is not a game over: the fight starts again as it began.
    retry: () => {
      const fresh = o.retryProfile ? createBattle(o.retryProfile(),o.encounter) : o.pickEncounter ? createBattle(o.profile, o.pickEncounter()) : structuredClone(start);
      setFree(fresh);
      return fresh;
    },
  };
  // A Kiln Tonic under End turn while Mara carries one.
  const tonics = o.tonics();
  const drink = () => { const next = o.drink(free); if (next) { setFree(next); redraw(n => n + 1); } };
  const tonic = ({ busy, lesson, over }: { busy: boolean; lesson: boolean; over: boolean }) => tonics > 0 &&
    <button id="kc-tonic" className="session-secondary kc-tonic" disabled={busy || lesson || free.hero.hp >= free.config.hero.maxHp || over} onClick={drink}>Kiln Tonic · {tonics}<small> +15 HP</small></button>;
  return <App key="free" controller={controller} onMenu={o.onMenu} onVictory={() => o.onWin(free)} brand="The Rift: Ashlands" rewards={o.rewards} extraControls={tonic} victoryView={victory} suppressHints />;
}

/** Shows Kiln Courier's battle screen in `el`. Returns a function that removes it. */
export function mountBattle(el: HTMLElement, options: BattleOptions): () => void {
  const s = options.stage;
  el.classList.toggle('in-room', !!s);
  if (s) for (const [k, v] of Object.entries({ '--room-left': s.left, '--room-top': s.top, '--room-width': s.width, '--room-height': s.height, '--room-hero': s.heroSize, '--room-enemy': s.enemySize, '--room-floor': s.floor })) el.style.setProperty(k, `${v}px`);
  const root = createRoot(el);
  root.render(<div className="kc kc-screen"><Battle {...options} /></div>);
  return () => root.unmount();
}

function ArmoryRoot(props: Omit<ArmoryProps, 'profile' | 'owned' | 'salvage' | 'carried' | 'tonics'> & { read: () => Pick<ArmoryProps, 'profile' | 'owned' | 'salvage' | 'carried' | 'tonics'> }) {
  const [, redraw] = useState(0);
  const { read, onEquip, ...rest } = props;
  return <Armory {...rest} {...read()} onEquip={id => { onEquip(id); redraw(n => n + 1); }} />;
}

/** Shows the workshop (equip-only) in `el`. Returns a function that removes it. */
export function mountArmory(el: HTMLElement, props: Parameters<typeof ArmoryRoot>[0]): () => void {
  const root = createRoot(el);
  root.render(<div className={props.popup ? 'kc kc-armory-popup' : 'kc kc-screen kc-armory-screen'}><ArmoryRoot {...props} /></div>);
  return () => root.unmount();
}
