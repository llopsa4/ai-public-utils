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
| `npm run balance` | plays Base 1 headless with a careful and a passive scripted defence over 100 seeds and prints each win rate against the DESIGN §19 target; `--seeds N`, `--bot careful`, `--verbose`, `--trace <seed> --from <s>` (see the header of `scripts/balance.ts`) |
| `npm run e2e` | Playwright smoke test on its own dev server (port 5185); see [TESTING.md](TESTING.md) |
| `npm run art:standins` | writes a grey numbered stand-in for every figure frame still missing in `art/frames/`, (and every UI item in the manifest `ui`) then rebuilds `art/atlas/` (never overwrites real art) |
| `npm run art:pack -- <batch>` | validates `art/inbox/<batch>/`, installs it into `art/frames/` (a `ui/` folder inside the batch holds UI items), rebuilds the atlases incl. `ui`; any bad file fails the whole batch with its name; palette checked against `art/palette.json` once Codex delivers it |

Run `npm run typecheck && npm test` before finishing a task.

## Layout

- `src/sim/`: game rules, pure TypeScript, **no Phaser import** (`rng`, `grid`, `path` A*, `camp` so far).
- `src/render/`: `iso.ts` (tile ↔ world projection) and `camera.ts` (pan / zoom maths), both pure and
  unit-tested; `placeholders.ts` draws a grey texture for every manifest key that has a
  `placeholder` block. Figures (survivors, zombies): `figure.ts` (pure, tested: facing, which anim and
  frame from the sim state, zombie variant; rates in `data/anims.json`), `atlas.ts` (loads
  `art/atlas/*` in Boot, nearest-neighbour filter) and `units.ts` (`UnitSprite`, used by Mission,
  Intro and Base; a figure without an atlas, such as the human guard, stays a grey capsule).
  `cues.ts` is the pure side of the text-size and shape-cue options (scale factor, `!`/`?` choice, dash
  styles per noise kind, hunger words, action-bar and squad-panel sizes); `scenes/uiScale.ts` applies it to Phaser text
  (`ui(px)`, `scaleText`): write every HUD length as a 100% length and scale it, never as a fixed pixel size.
- `src/audio/`: all sound, made in code with WebAudio (no sound files). `events.ts` (pure, tested: what
  the sim changed → sound events, `SoundId`, reach per sound), `space.ts` (pure, tested: pan and fade from
  the camera centre, the `Throttle` that keeps a crowd of zombies from machine-gunning one sound), `sfx.ts`
  (one recipe per `SoundId` plus its `LEVEL`; add a sound to `SoundId`, `REACH`, `RECIPES` and `LEVEL`) and
  `engine.ts` (the one `audio` instance: starts on the first click or key, master / effects / ambience buses
  from the options; `audio.play(id, { gain, pan, variant })`, `audio.ui()`). Scenes never build audio nodes:
  `scenes/feelFx.ts` feeds each frame's sim state to `soundEvents` and places the result. Phaser's own sound
  manager is off (`noAudio` in `main.ts`).
- `src/scenes/`: `Boot.ts` (loads atlases, makes placeholder textures, starts Menu), `Menu.ts` (title,
  Continue, New Game), `Intro.ts`, `Mission.ts`, `Base.ts` and their HUD, action bar and dialogue scenes. Scenes draw and send orders; they never hold game rules.
  `input.ts` is the one input and camera controller (`ViewInput`) the three play scenes share: pan keys
  (live key map), edge scroll, wheel zoom, click-or-box-select gesture; scenes pass it hooks.
  Keys are rebindable: `data/keys.json` lists every action with its default key, `sim/keymap.ts` (pure) binds,
  refuses conflicts and resolves them, `sim/options.ts` stores the overrides (`liveKeys()`, `rebindKey`, `resetKeys`) and
  `scenes/actionKeys.ts` turns a key press into an action (`bindActionKeys`) and fills `{action}` placeholders in help and
  hint texts (`fillHelp`). Never write a literal key letter in a scene or in `data/*.json` text: use `{action}`.
  Hit feedback: `render/fx.ts` (pure) compares the sim with the last frame (`observe`) and returns events (white
  flash on a figure that lost hit points, shake on a shot or a hit survivor, text pops for a crate's loot, a silent
  kill and the last bullet, alerts for an attacked survivor, fixed opening or barricade) and places off-screen
  alert arrows on the free screen edge (`edgeArrow`); `scenes/feelFx.ts` (`Feel`) is what each play scene calls once a
  frame after its sync (it also owns the jump key and the herd's arrival flash and pan), and `scenes/Feel.ts` is the
  overlay that draws the arrows and the flash from the registry (`fx_alerts`, `fx_flash`).
  Speed: `sim/path.ts` `findPath` uses a binary heap and reused typed arrays, and refuses a goal in another open
  area at once from an area map cached per grid (rebuilt when any tile changes); `scenes/ground.ts` `bakeGround`
  draws a scene's whole ground into one render texture (do not add per-tile ground images back).
- `src/data/*.json`: numbers and content. `art/manifest.json`: every sprite key.
- `src/index.html` is the source page; `index.html` + `build/` at the game root are the published
  output written by `scripts/publish.mjs`. `dist/` and `node_modules/` are git-ignored.

## Conventions

- Fixed simulation tick of 10 per second, seeded RNG, plain-object JSON-serialisable state.
  Rendering reads state and never mutates it.
- Map: tile (x, y) → world pixels with `tileToWorld(x, y, size)`; tiles are 64 × 32 diamonds;
  upright sprites are depth-sorted by the world y of their anchor.
- Camera: WASD / arrows or the mouse within 16 px of the window edge pans (not once the pointer has
  left the canvas); the wheel zooms at the cursor in fixed stops 1 / 1.5 / 2 / 3, touchpad deltas adding
  up to one step per 100 px; pixel rounding is on. Numbers in `src/data/view.json`, keys in `src/data/keys.json`.
- One fixed view: no camera rotation.

## Art placeholders

`art/manifest.json` lists every key: `size` [w, h] in px, `anchor` [x, y] (0-1), `frames`, `status`
(`placeholder` | `final`) and, for code stand-ins, a `placeholder` block `{ shape, color }` where
`shape` is `diamond`, `capsule`, `box`, `ring` or `ellipse`. `src/render/placeholders.ts` turns each block into a
texture of that key at Boot. Only grey tones, plus functional colours for vision cones (red / yellow
/ green) and blood (dark red). Codex replaces keys with final art; scenes use the key and
`anchorOf(key)`, never hard-coded sizes.
