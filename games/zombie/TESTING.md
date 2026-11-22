# Dead Woods testing

- **Unit tests** (`npm test`): everything in `src/sim/` and the pure render maths (`iso.ts`,
  `camera.ts`). Each task unit adds tests for the rules it adds (see its PLAN.md row). Drive the sim
  with its step function, never with timers.
- **Typecheck** (`npm run typecheck`) before every finish.
- **Smoke test** (`npm run e2e`, from Z7): Playwright starts its own dev server on port 5185, opens
  `/?debug`, checks the menu, starts a new game, advances with `window.dw.step(n)` and fails on any
  console error. A browser tab driven by automation may throttle frames, so use `dw.step`.
- **Hand check** after a BUILD unit: `npm run dev`, open http://127.0.0.1:5175/, try the unit's
  "done when" list. Report anything not checked in the browser as unverified.
- **Published build:** after `npm run publish`, serve the repository root with any static file
  server and open `/games/zombie/` to confirm the relative `build/` paths.
