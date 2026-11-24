# Dead Woods testing

- **Unit tests** (`npm test`): everything in `src/sim/` and the pure render maths (`iso.ts`,
  `camera.ts`). Each task unit adds tests for the rules it adds (see its PLAN.md row). Drive the sim
  with its step function, never with timers.
- **Art scripts** (`tests/art-pack.test.ts`): run `art:standins` and `art:pack` against a temp copy of
  the manifest (`--root <dir>`); cover valid batches, every rejection (name, facing, anim, index, size,
  palette) and that a failed batch installs nothing. Slow (about 20 s) because each case spawns node.
- **Performance** (`tests/perf.test.ts`, from Z42): a 20-zombie sealed-out benchmark in a Base 1 whose
  openings are all fixed, with its pre-Z42 baseline (766 ms for 200 ticks) kept in the file and a budget
  of baseline / 5; the new A* must give exactly the old routes on random grids (a copy of the old search
  lives in the test); reachable routes must stay at least 2x faster. Timings are wall-clock: if a slow
  machine fails the budget, rerun alone (`node --import tsx --test tests/perf.test.ts`) before suspecting code.
- **Typecheck** (`npm run typecheck`) before every finish.
- **Smoke test** (`npm run e2e`, from Z7): Playwright starts its own dev server on port 5185, opens
  `/?debug`, checks the menu, starts a new game, advances with `window.dw.step(n)` and fails on any
  console error. A browser tab driven by automation may throttle frames, so use `dw.step`.
- **Base 1 e2e** (`tests/e2e/base1.spec.ts`, Z44): seeds a Base 1 save (`cassGun` false) in localStorage,
  clicks Continue, closes the arrival beat (the save then has `cassGun` true), steps with `dw.step` to the
  herd warning (dialogue opens, the save gains a checkpoint at that tick) and past the herd's arrival (`h…`
  zombies exist), pauses with Esc (the tick holds for 1.5 s) and resumes, then reloads and clicks Continue:
  Base 1 resumes at the checkpoint, no dialogue, no console errors. Roamers (`r…`) are removed between
  step chunks so the idle survivors live to the herd; the live frame loop also ticks, so ticks are checked
  with `>=` and small windows, never exact values.
- **Hand check** after a BUILD unit: `npm run dev`, open http://127.0.0.1:5175/, try the unit's
  "done when" list. Report anything not checked in the browser as unverified.
- **Published build:** after `npm run publish`, serve the repository root with any static file
  server and open `/games/zombie/` to confirm the relative `build/` paths.
