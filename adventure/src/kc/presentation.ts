// Cinderfold's stand-in for Kiln Courier's client/src/presentation.ts (swapped in by vite.config.ts):
// the chapter's only fight is the Hatch Scavenger in the regulator gallery, also during the lesson
// (which Kiln Courier would draw as its practice sweeper).
import { openingArt } from './assets';
import type { BattleState } from '@kc/game/types';
import type * as Original from '@kc/presentation';

export function battleVisual(_state: BattleState): ReturnType<typeof Original.battleVisual> {
  return {
    machine: 'scavenger' as const,
    sprite: openingArt['pressure-scavenger'],
    arena: openingArt['regulator-gallery'],
    ink: { height: .958984, gap: .02832 },
    training: false,
    reinforced: false,
  };
}
