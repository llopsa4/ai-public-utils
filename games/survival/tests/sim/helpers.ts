import { mealNeed } from '../../src/sim/economy';
import type { GameState } from '../../src/sim/state';
import { step } from '../../src/sim/tick';

/** Steps `n` ticks and puts back the food each meal eats, so job tests can watch the store alone. */
export function stepFed(s: GameState, n: number): void {
  for (let i = 0; i < n; i++) {
    const need = mealNeed(s);
    step(s, 1);
    if (s.tick % 600 === 0) s.store.food += need;
  }
}
