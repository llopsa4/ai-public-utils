// Cinderfold's stand-in for Kiln Courier's client/src/presentation.ts (swapped in by vite.config.ts):
// which enemy picture and arena each of the adventure's fights uses. Chapter 1's Hatch Scavenger is
// in the regulator gallery, also during the lesson (which Kiln Courier would draw as its practice
// sweeper); chapter 2's sparring is Bryn's training rig in her workshop.
import { openingArt } from './assets';
import type { BattleState } from '@kc/game/types';
import type * as Original from '@kc/presentation';

export function battleVisual(state: BattleState): ReturnType<typeof Original.battleVisual> {
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
