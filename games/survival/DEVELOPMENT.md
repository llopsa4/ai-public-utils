# Survival development

How to run, test and extend the game. Fixed technical shape: [PLAN.md](PLAN.md); data and rules:
[DESIGN-slice.md](DESIGN-slice.md). Needs Node >= 22.12.

## Commands

| Command | What it does |
|---|---|
| `npm install` | install dependencies (once) |
| `npm run dev` | dev server at http://127.0.0.1:5174/ (add `?debug` for the debug hook, `?seed=7` for another map) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | simulation and maths unit tests (`tests/**/*.test.ts`, Node's test runner via tsx) |
| `npm run build` | Vite build into `dist/` (not committed) |
| `npm run publish` | build, then write `index.html` and `build/` here, which GitHub Pages serves (commit them only when the user asks; pushing `main` deploys the site) |
| `npm run e2e` | Playwright smoke test (added by plan task C7) |

Run `npm run typecheck && npm test` before finishing a task.

## Layout

- `src/sim/`: game rules, pure TypeScript, **no Phaser import** (`rng.ts`, `map.ts`, `state.ts`, `people.ts` spawning, housing and A*, `buildings.ts` placement,
  sites and workers, `economy.ts` hunger, meals and Wotakuye, `jobs.ts`,
  `orders.ts` applies the orders queue, `tick.ts` has `newGame` and `step`).
- `src/render/`: projection and drawing helpers (`iso.ts`, `camera.ts` pure maths; `manifest.ts`,
  `placeholders.ts`, `people.ts` draws the people from state).
- `src/scenes/`: Phaser scenes (`Boot.ts` loads art and starts `Game.ts`; `Build.ts` is the build
  menu, `Hud.ts` the resource and Wotakuye bars, and `Select.ts` selection, right-click orders, the
  selection panel and toasts, all drawn above it). Scenes draw and send
  orders; they never hold game rules.
- `src/data/*.json`: numbers and content. `art/manifest.json`: every sprite.
- `scripts/publish.mjs`: build and publish. `dist/` and `node_modules/` are git-ignored.

## Conventions

- Fixed simulation tick of 10 per second, seeded RNG (`src/sim/rng.ts`, plain-object state), state
  is JSON-serialisable. Rendering reads state and never mutates it.
- Map: tile (x, y) maps to world pixels with `tileToWorld` in `src/render/iso.ts`; upright sprites
  are depth-sorted by the world y of their anchor.
- Camera: WASD/arrows or the mouse within 16 px of the window edge pans, the wheel zooms at the
  cursor (0.5 to 2.0). The numbers are in `src/data/map.json` `camera`.
- Long-running job tests use `stepFed` (`tests/sim/helpers.ts`), which puts back the food each meal
  eats so the store can be watched alone.
- `?debug` sets `window.camp = { state, step(n), orders(list) }`. Example, send three adults to
  gather: `camp.orders([{type:'assign', ids:[1,2,3], job:'gather', tile:[20,34]}]); camp.step(150)`.
  `orders` knows `move`, `assign` (gather/chop on a tile, or a building id), `place`, `cancel`,
  `draft`, `stance`, `speed` (1, 2 or 4) and `pause`; `attack` arrives with C6. A browser tab driven by
  automation may throttle frames, so use `camp.step(n)` to move the sim on.

## Art placeholders

Every key in `art/manifest.json` needs a drawing in `src/render/placeholders.ts`. When Codex
delivers a PNG, put it in `art/` and set the entry's `status` to `final`; `Boot.ts` then loads it
instead of the placeholder. Sprite strips (several frames) are not loaded as frames yet; add that
with the first multi-frame final asset. Procedure: [art/PIPELINE.md](art/PIPELINE.md).
