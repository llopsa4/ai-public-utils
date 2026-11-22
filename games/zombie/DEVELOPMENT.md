# Dead Woods development

How to run, test and extend the game. Fixed technical shape and task units: [PLAN.md](PLAN.md).
Needs Node >= 22.12.

## Commands

| Command | What it does |
|---|---|
| `npm install` | install dependencies (once) |
| `npm run dev` | dev server at http://127.0.0.1:5175/ (add `?debug` for the `window.dw` hook) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | unit tests (`tests/**/*.test.ts`, Node's test runner via tsx) |
| `npm run build` | Vite build into `dist/` (git-ignored) |
| `npm run publish` | build, then write `index.html` and `build/` here, which GitHub Pages serves (commit them only when the user asks) |
| `npm run e2e` | Playwright smoke test on its own dev server (port 5185); see [TESTING.md](TESTING.md) |

Run `npm run typecheck && npm test` before finishing a task.

## Layout

- `src/sim/`: game rules, pure TypeScript, **no Phaser import** (`rng`, `grid`, `path` A*, `camp` so far).
- `src/render/`: `iso.ts` (tile ↔ world projection) and `camera.ts` (pan / zoom maths), both pure and
  unit-tested; `placeholders.ts` draws a grey texture for every manifest key that has a
  `placeholder` block.
- `src/scenes/`: `Boot.ts` (makes placeholder textures, starts Menu), `Menu.ts` (title, New Game),
  `Camp.ts` (clearing, survivors, select and move, camera), `Hud.ts` (food, scrap, selection). Scenes draw and send orders; they never hold game rules.
- `src/data/*.json`: numbers and content. `art/manifest.json`: every sprite key.
- `src/index.html` is the source page; `index.html` + `build/` at the game root are the published
  output written by `scripts/publish.mjs`. `dist/` and `node_modules/` are git-ignored.

## Conventions

- Fixed simulation tick of 10 per second, seeded RNG, plain-object JSON-serialisable state.
  Rendering reads state and never mutates it.
- Map: tile (x, y) → world pixels with `tileToWorld(x, y, size)`; tiles are 64 × 32 diamonds;
  upright sprites are depth-sorted by the world y of their anchor.
- Camera: WASD / arrows or the mouse within 16 px of the window edge pans; the wheel zooms at the
  cursor (0.5 to 2.0). Numbers in `src/data/view.json`.
- One fixed view: no camera rotation.

## Art placeholders

`art/manifest.json` lists every key: `size` [w, h] in px, `anchor` [x, y] (0-1), `frames`, `status`
(`placeholder` | `final`) and, for code stand-ins, a `placeholder` block `{ shape, color }` where
`shape` is `diamond`, `capsule`, `box`, `ring` or `ellipse`. `src/render/placeholders.ts` turns each block into a
texture of that key at Boot. Only grey tones, plus functional colours for vision cones (red / yellow
/ green) and blood (dark red). Codex replaces keys with final art; scenes use the key and
`anchorOf(key)`, never hard-coded sizes.
