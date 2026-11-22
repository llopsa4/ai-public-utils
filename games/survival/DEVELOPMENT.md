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
| `npm run publish` | build, then write `index.html` and `build/` here, which GitHub Pages serves (commit them only when the user asks; pushing `main` deploys the site as committed, so run this and commit its output before a push that should change the live game) |
| `npm run art:standins` | writes a grey stand-in for every frame of every manifest key into the git-ignored `art/standins/<key>/` (about 7,000 files, under a minute) and packs them into `art/standins/atlas/` (13 pages; `-- --no-pack` skips packing); never shipped |
| `npm run art:pack -- ABn` | Codex, at install: validates `art/inbox/ABn/`, then repacks each atlas group the batch touches into `art/atlas/<group>-<n>.png` + `<group>.json` (Phaser multiatlas, 2048 px pages, trimmed, 2 px extrude and padding, at most 16 pages) from the batch and the `art/inbox/done/` deliveries of the group's other final keys |
| `npm run art:validate` | checks `art/manifest.json` against SPEC.md; `-- --inbox ABn` also checks a delivery in `art/inbox/ABn/` (exact cell, 2 px border, frame names and counts, cloth aligned with base, ground point) |
| `npm run e2e` | Playwright smoke test on its own dev server (port 5184); see [TESTING.md](TESTING.md) |

Run `npm run typecheck && npm test` before finishing a task.

## Layout

- `src/sim/`: game rules, pure TypeScript, **no Phaser import** (`rng.ts`, `map.ts`, `state.ts`, `people.ts` spawning, housing and A*, `buildings.ts` placement,
  sites and workers, `economy.ts` hunger, meals and Wotakuye, `jobs.ts`,
  `orders.ts` applies the orders queue, `tick.ts` has `newGame` and `step`).
- `src/render/`: projection and drawing helpers (`iso.ts`, `camera.ts` pure maths; `manifest.ts`,
  `placeholders.ts`, `people.ts` draws the people from state (a base and a family-tinted cloth sprite from the atlas, else the placeholder; a death plays `die` and fades), `personArt.ts` picks a person's model, facing, animation and frame (pure, tested in `tests/sim/people.test.ts`); `atlases.ts` queues the art atlases for Boot, `art.ts` `spriteFor` / `applyArt` draw a key
  from its atlas frame at scale 0.5 or from its code placeholder, `frames.ts` names a key's default frame, `standins.ts` / `standinFiles.ts` serve `?standins`).
- `src/audio/`: the music, made with Web Audio and no sound files (`theory.ts` pure rules, unit-tested; `music.ts` plays them and starts on the first click; the HUD
  menu has the on/off toggle and volume, kept in `localStorage` under `survival.music`).
- `src/scenes/`: Phaser scenes (`Boot.ts` loads art and starts `Menu.ts` (title, Start, Random seed, controls), which starts `Game.ts`; `Build.ts` is the build
  menu, `Hud.ts` the resource and Wotakuye bars, the pause / speed buttons, the wave banner and the end screen, and `Select.ts` selection, right-click orders, the
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

`art/manifest.json` is manifest v2 ([art/SPEC.md](art/SPEC.md) section 9): one entry per art key at its final 2x size.
A key with a code drawing in `src/render/placeholders.ts` also has a `placeholder` block (the size and anchor the code
draws at); `ensureTextures` skips keys without one, and `anchorOf(key)` gives the right origin until a key is `final`.
Ground, banks, spills, trees, bushes, rocks and tufts are drawn by `src/render/terrainView.ts` (picks in `terrain.ts`); banks, spills, stumps,
bushes, rocks and tufts have no code drawing, so they appear only with final art or `?standins`. The ground and its spills are baked into 16 x 16-tile
chunk textures (36 on the 96 x 96 map, about 75 MB) that are redrawn when a tile's picture changes (a season swap spreads over a few frames); trees,
bushes and props stay sprites; `TerrainView.cull` (called each frame from `Game.update`) shows only what is near the camera. Buildings pick their frame in `src/render/buildingArt.ts`
(stage by build progress, `finished` or `winter`, a barricade's neighbour mask, the drying rack's loop) and `Game.syncBuildings` applies it; a finished fire and fire
pit carry an `fx_flame` sprite when that key has art (none without it). Wolves, game, carcasses, allies, the stampede and the storm are drawn by
`src/render/enemies.ts` (picks in `creatureArt.ts`): a kind with art is a sprite per creature, else its code drawing; corral horses, a mounted
lancer (`person_rider`, in `people.ts`), arrow sprites (`arrows.ts`) and the one-shot effects (`src/render/fx.ts`: hit and foot dust, build sparkle,
fish) have no code drawing and appear only with art. Final art is loaded from
`art/atlas/*.json` by Boot (`src/render/atlases.ts`) and drawn by `spriteFor(scene, key, x, y, frame?)` / `applyArt(image, key, frame?)` in `src/render/art.ts`
(scale 0.5, the manifest anchor; the frame defaults to summer, the first variant, `finished`, the first animation, facing `s`); a key that is not `final`
keeps its code placeholder. Do not call `add.image(x, y, key)` for a manifest key (a person's placeholder in `src/render/people.ts` is the exception: it picks the family's `__b` texture). On the dev server, `?standins` (e.g. `/?debug&standins`) loads the grey
stand-ins from `art/standins/atlas/` instead (run `npm run art:standins` first); a build swaps that module for an empty one, so the published game never
contains them. Procedure: [art/PIPELINE.md](art/PIPELINE.md).

Interface (AC8): `src/render/ui.ts` gives scenes `makeSurface` (a Rectangle that gets a nine-slice from `ui_panel` / `ui_button` / `ui_bar_frame` when art exists; change its
look with `setLook`, never `setFillStyle`), `textButton`, `addIcon` / `showIcon` and `palette`; use `UI_FONT` (Alegreya, `render/fonts.ts`) for every text. Cursors are in
`render/cursors.ts`, the title picture in `render/title.ts` (`art/title.jpg`).
