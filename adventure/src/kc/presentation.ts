// Cinderfold: the scene's only fight is the Hatch Scavenger in the regulator gallery.
import { openingArt } from './assets';
import type { BattleState } from './game/types';

export function battleVisual(_state: BattleState) {
  return {
    machine: 'scavenger' as const,
    sprite: openingArt['pressure-scavenger'],
    arena: openingArt['regulator-gallery'],
    ink: { height: .958984, gap: .02832 },
    training: false,
    reinforced: false,
  };
}
