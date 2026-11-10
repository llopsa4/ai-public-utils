// Cinderfold's stand-in for Kiln Courier's client/src/presentation.ts (swapped in by vite.config.ts):
// which enemy picture and arena each of the adventure's fights uses. Chapter 1's Hatch Scavenger is
// in the regulator gallery, also during the lesson (which Kiln Courier would draw as its practice
// sweeper); chapter 2's sparring is Bryn's training rig in her workshop, and its tunnel creatures
// come from the creature registry (src/chapters/ch2/art.ts).
import { openingArt } from './assets';
import { CREATURE_ART } from '../game/assets';
import type { BattleState } from '@kc/game/types';
import type * as Original from '@kc/presentation';

export function battleVisual(state: BattleState): ReturnType<typeof Original.battleVisual> {
  return fightVisual(state);
}

function fightVisual(state: BattleState): ReturnType<typeof Original.battleVisual> {
  if (state.config.encounter.id === 'berserk-ash-sweeper') return {
    machine: 'sweeper', sprite: openingArt['ash-sweeper'], arena: openingArt.ashways,
    ink: { height: .74707, gap: .139648 }, training: false, reinforced: false,
  };
  const creature = CREATURE_ART[state.config.encounter.id];
  if (creature) {
    // Chapter 2's tunnel creatures (art/ch2.mjs trims each to 60% of its picture's height, 4% above
    // the bottom), in the scavenger's size class.
    return { machine: 'scavenger' as const, sprite: creature.fight, arena: creature.arena, ink: { height: 0.6, gap: 0.04 }, training: false, reinforced: false };
  }
  if (state.config.encounter.id === 'training-rig') {
    return {
      machine: 'sweeper' as const,
      sprite: openingArt['ash-sweeper'],
      arena: openingArt['tempering-house'],
      ink: { height: .74707, gap: .139648 },
      training: true,
      reinforced: false,
    };
  }
  return {
    machine: 'scavenger' as const,
    sprite: openingArt['pressure-scavenger'],
    arena: openingArt['regulator-gallery'],
    ink: { height: .958984, gap: .02832 },
    training: false,
    reinforced: false,
  };
}
