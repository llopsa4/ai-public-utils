# Cinderfold: A delivery he does not want

A point-and-click adventure built from the first scene of **Kiln Courier**'s story. Mara, a courier and kiln-minder in Cinderfold (a village built inside an old industrial kiln), must shut down the cracked regulator and carry it away for assessment. He doesn't want to go. The game runs entirely in the browser as static files on GitHub Pages: no server, no accounts, no tracking. It uses only free software: Phaser 3 (MIT), React (MIT, for the fight and gear screens), TypeScript, Vite and the Zilla Slab, Cinzel and Cormorant Garamond fonts (OFL); the art and test tools (pngjs, upng-js, sharp, Playwright) are development-only.

## Play

Live: <https://llopsa4.github.io/ai-public-utils/adventure/>

- **New game** opens with a few lines of context over black (click for the next, or Skip).
- **Walk:** click or tap the floor.
- **Act:** click or tap a person or object to open the action ring, then choose an action (Look at, Open, Close, Pick up, Use, Talk to, Go to). Arrow keys move around the ring and Esc closes it.
- **Satchel:** click an item for Look at / Use. Use carries it, so you then click what to use it on. Right-click or Esc puts it back.
- **Poses:** click Mara, Oren or Nell for Crouch, Lie down and Stand up.
- **Background people:** four workers go about their day in the kiln hall (a stoker at the kiln mouths, a hoist hand at the pulley, a clay hauler and the old tally-keeper), and two kids, Pip and Bea, play in the firing house. They walk between their stations, work or play, leave and come back, and chat in speech bubbles. Click one to look at them or talk (they stop, turn to Mara and say a line). When the alarm goes up the kids run to Nell; when the kiln goes cold the workers stare at it and two of them leave, and the kids huddle by the dead hearth.
- **Room names** hang on a board in every room (an iron shield-plate in the regulator gallery).
- **Talk:** choose a reply with the mouse or the number keys. Lines appear in the panel at the bottom with the speaker's portrait, which talks and shows a mood (worried, angry) on some lines. Click to skip a line.
- **Explore:** looking at something again often gets a different line, and four small secrets are hidden around Cinderfold (the notebook counts the ones you've found).
- **Labels:** hold **Space** (or press the eye button) to label everything you can interact with. **Notebook** lists what Mara has done and what he is doing now.
- **Exits:** double-click a doorway to go straight through.
- **Keyboard:** Tab moves between the things in the room (then on to the bar), Enter opens the action ring, arrow keys move around it, number keys pick replies.
- **Touch:** press and hold on the scene to label everything. The ⛶ button switches to full screen where the browser allows it.
- **Menu** (pause): Resume, **History** (everything said so far), **How to play**, saves, **Settings** (text speed, effects and music volume, mute, auto-advance, reduced motion, text size, high contrast) and **Title screen**.
- **Hints:** the notebook's **Hint** button gives a nudge for the current goal, then the plain answer.
- **Cursor:** the pointer shows the name of what it is over and what a click will do (look, handle, talk, leave).

The scene covers: Mara's tent → the kiln hall → the firing house (Nell's latch, then the alarm) → the regulator gallery (the failed patch, the conversation with Oren, his mother's notebook, the shutdown) → the cold firing house (goodbyes) → the ashways (the ash sweeper and the steam valve) → "To be continued".

Text is **English only** for now. Languages can be added back by dropping a `strings/<code>.json` beside `en.json` and listing it in `src/engine/i18n.ts`. The switcher reappears once there are two.

### Saves

Progress is **autosaved in this browser** (localStorage, one slot) after each walk, action and room change; the title screen offers **Continue**. Use **Menu → Export save** to download a `.json` copy and **Import save** to load one. Autosaves and imports go through the same validation: a damaged or foreign save is rejected and never loaded. Saves from older versions of the game are upgraded step by step (`src/engine/migrations.ts`, with a fixture save per old version in `tests/fixtures/saves/`). A save records the chapter, the chapters reached and each chapter's flags separately; Mara's kit, bag and the items a chapter marks as kept carry into the next chapter.

## Develop

Requires Node 22.12+.

```sh
npm ci
npm run dev        # http://127.0.0.1:5173 with live reload
npm test           # logic tests (full scene chain, argument paths, pathfinding, saves, strings)
npm run e2e        # build, then play the whole scene in headless Chromium (Playwright), plus saves, keyboard and phone checks
npm run build      # typecheck → Vite build → publish to index.html + build/ → verify
npm run preview    # serves the repo root like GitHub Pages: http://127.0.0.1:4173/adventure/
```

GitHub Pages serves the `main` branch as-is, so **commit the generated `index.html` and `build/`** together with the source changes. `dist/` and `node_modules/` are ignored.

Add `?debug` to the URL to draw the walk areas (green), obstacles (red), hotspots (yellow), approach points (blue) and entries (pink), and to expose `window.adventure = { game, session, sound, chapters, newGame, interact }` (the e2e tests use it). In debug mode the backtick key (`` ` ``) opens the **debug panel** (`?debug=panel` opens it at start): jump to a chapter or room, switch flags and items, add salvage, tonics or all gear, open the gear screen or shop, start a fight, and switch the visual quality or the walk-area overlay. In debug mode the gear screen also shows every equipable piece in the game, gauntlet slot unlocked; equipping one adds it to Mara's gear.

`node scripts/probe.mjs --room gallery --flags kilnCold --items regulator [--quality low]` screenshots the built game in any room at any point of the story (`--all`: every room, warm and cold, both qualities) into `shots/`. `tests/story-graph.test.ts` explores every story state each chapter can reach (1,790 for chapter 1) and checks that the end stays reachable from all of them, and that every room, goal, secret and spoken line exists.

Production builds bundle a reduced Phaser (`src/phaser-custom.cjs`: no physics, tilemaps, text or Phaser sound) built from Phaser's own sources; `vite.config.ts` sets Phaser's compile-time flags. The dev server uses the full prebuilt Phaser. If new code needs a Phaser module that is not in the custom entry, add it there; `npm run e2e` catches what's missing.

## Chapter 2 (debug only)

Chapter 2, **Tempered Flow**, is playable only in debug mode for now. Open the game with `?debug` and either finish chapter 1 (its end leads into chapter 2 instead of the end card), or press `` ` `` and pick `ch2` in the debug panel's chapter menu. It opens calm, at dawn at the mouth of a service tunnel (a pipe to sit on, thoughts of home); as he goes in, the roof falls behind him. Then he crosses the tunnels under the ashways: three dark scenes, each with a small puzzle that wakes a creature, drawn at random from four (Cinder Rat, Rat Pack, Ash Mite Swarm, Pipe Beetle) on every attempt, including after a lost fight:
- the collapsed tunnel: pry the rusted grate open with the gauntlet
- the steam junction: turn the valve the leaking pipe runs to (the wrong one scalds him for 5 health)
- the ash cistern: the chain holding the drawbridge up is too hot to grip, even with the gauntlet; Mara wraps Tobi's scarf round it (a Mara who left chapter 1 without the scarf finds an oily rag in the first tunnel's rubble instead)

His health carries from fight to fight (tonics can be drunk), and each win leaves 4 salvage. Then he reaches Bryn's tempering house on the road out of Cinderfold country, and later her cot heals him:
- she retunes his gauntlet: Kiln Courier's **Tempered Flow** technique, plus +6 most health and +2 most MP, kept for later chapters
- he tries it on her training rig: Kiln Courier's technique practice (the first play must be the highlighted Tempered Flow card, its banner explains the cost; he fights at full health and MP and loses nothing)
- he answers her question about what he is rushing towards
- she reads the regulator's records (the fault lies further along the return circuit), then supper
- over supper he writes home to Oren, lets Bryn pack his supplies, and finds the valley marked abandoned on her map
- he sleeps on her cot (health and MP back), and in the night a pressure surge through her return line shakes the house and puts out the lamps: the fault is still spreading, and he leaves before first light

Without `?debug` nothing changes: chapter 1 ends with its end card, and chapter 2's code and art are never downloaded. Chapter 2 lives in `src/chapters/ch2/`, loads on demand (`loadChapter` in `src/chapters/index.ts`), brings its own cast (Bryn) and its art (`src/chapters/ch2/art.ts`, `art/src/ch2/`), and has its own size budget. All of its art is placeholder, listed in the art manifest with Codex briefs.

## Fights

Fights use **Kiln Courier**'s card rules and battle screens from `../FFCardGame/client/src` in this repository, imported directly (as `@kc/...`, set in `tsconfig.json` and `vite.config.ts`), not copied. They load only when the first fight or the gear screen opens (`src/kc/mount.tsx`, the bridge, with `Armory.tsx`, the equip-only workshop).

- Kiln Courier's battle screen takes optional settings for a host game: `brand` (the Cinderfold title), `rewards` (what the fight paid, in the victory dialog), `extraControls` (the Kiln Tonic button), and for its guided lesson an `encounter` and reworded `prompts`. The first fight is that lesson taught against chapter 1's Hatch Scavenger (`src/chapters/ch1/combat.ts`).
- Three Kiln Courier modules are swapped for the adventure's own at build time (`kcOverrides` in `vite.config.ts`): `src/kc/assets.ts` and `src/kc/EquipmentArt.tsx` (the small WebPs from `art/kc.mjs` instead of Kiln Courier's full-size PNGs) and `src/kc/presentation.ts` (the scavenger in the gallery, also during the lesson). The compiler checks they keep the originals' names and types.
- Kiln Courier's stylesheet is scoped under `.kc` into `src/kc/kc.css` by `scripts/kc-css.mjs` on every build; Cinderfold's additions are in `src/kc/kc-local.css`.
- Changing Kiln Courier changes the adventure's fights: after editing FFCardGame, run both projects' checks.

## Layout

| Path | Contents |
| --- | --- |
| `src/engine/` | Pure, Phaser-free logic: types, geometry, pathfinding (visibility graph + A*), state, save files, dialogue runner, click rules (`rules.ts`), story rules (`story.ts`), i18n |
| `src/chapters/` | One folder per chapter behind the `Chapter` interface (`types.ts`, registry in `index.ts`). `ch1/`: rooms, click rules (`interactions.ts`), story rules (`story.ts`), dialogue trees, crowds, the fight, objectives, flags and `strings.en.json` |
| `src/content/` | What every chapter shares: Mara's kit (`kit.ts`), the interface strings (`strings/en.json`), art lists |
| `src/game/` | Phaser scenes (`scenes.ts`; the room's input, lighting, script runner, command handlers and fight bridge in `room/`), the `Actor` (pose/walk/blink/task poses), the background people (`Crowd`), room name boards (`sign.ts`), asset list, session |
| `src/ui/` | DOM interface over the canvas: `ui.ts` (layout, title, menu, satchel, toasts) with one module per screen: `speech`, `radial` (action ring, choices), `labels` (touch), `notebook` (goals, history), `settingsMenu`, `gear`, `shop`, `intro`, `saves` |
| `src/audio/` | Web Audio synthesizer for ambience, effects, footsteps per floor surface, and a generative score per room mood (no sound files) |
| `art/` | Art scripts and their output in `art/src/` (see [PROVENANCE](art/PROVENANCE.md)) |
| `tests/` | `node:test` suites run with tsx |

## Art pipeline

**New art (Codex):** every picture is redrawn by Codex in the look of [tent-reference.png](tent-reference.png) (already in the game as Mara's tent). Codex follows one file, [art/CODEX.md](art/CODEX.md): the setup, a pilot pack (then a stop for approval), and every picture in batches, room by room, each with its brief and exact file name. Everything is listed in the art manifest (`art/manifest.mjs`), with the detailed descriptions and the cast in `art/descriptions.mjs`. The style bible is [art/STYLE.md](art/STYLE.md): flat 2D rooms with a floor band where people walk at one size, true proportions, a 4-pixel grid, and a 160-colour palette from the reference. `npm run art:briefs` writes a brief per picture in `art/briefs/` (what the game does with it, the technical requirements, the prompt) and `art/CODEX.md`; `npm run art:guide` draws each room's layout image in `art/spec/`. Deliveries go in `art/inbox/`; `npm run art:import` fits them to size, reduces them to the grid, snaps them to the palette, keys out a magenta background, re-cuts walk-behind pieces, writes WebP copies and a before/after preview, and marks them final, so the placeholder generators (`npm run art`) never overwrite them.

The world is 640×360 logical units. The art and the canvas are 2× that (1280×720), and the stage scales to fit the window. Until Codex's pictures arrive, the art comes from Kiln Courier's illustrations; Mara's tent is the reference picture ([provenance](art/PROVENANCE.md)). Run `npm run art` to rebuild everything, or one script at a time:

- `npm run pixelate`: rooms, the ash sweeper, item icons and objects (crop, mask, area-average downscale, palette reduction).
- `node art/tent.mjs`: Mara's tent, painted from scratch as an SVG scene and rendered with sharp (also the stool walk-behind piece).
- `npm run rig`: animated characters and dialogue portraits. Legs are split at the hip and knee for a six-frame step; NPCs get a `fidget` frame. Each Kiln illustration is a single three-quarter pose, so `art/rig.mjs` cuts it into parts (upper body, near leg, far leg) and poses them per frame. That gives a walk sway, a crouch (legs folded), lying down (the figure rotated, eyes closed) and a blink (eyelids painted over). There are no back or side views, so every direction reuses the three-quarter pose, mirrored for left. Joints, eyes and portrait crops are set per character at the top of the script.
- `npm run rig` also builds the **background people** (`EXTRAS` in `art/rig.mjs`, `node art/rig.mjs extras` for just those). They are placeholder variants of the three bodies: clothes recoloured, pale armour turned to leather, skin tone and height changed, and a cap, hood or kerchief painted on. Each has 13 frames: stand, blink, a six-frame walk, work (two frames, crouched), carry, reach and sit. Replace any `characters/extra-<id>.png/.json` pair with real art using the same tags.
- `art/icons.mjs`: the drawn 24×24 action-ring icons.
- `npm run webp` (`art/webp.mjs`, sharp): WebP copies of the rooms, foreground cut-outs and background people's sheets, which are what the game loads.
- Outputs are palette-indexed PNGs (`art/png.mjs`), plus the WebP rooms. Rooms, Oren, Nell and the lit gauntlet load the first time they are needed, and the background people load in the background once play starts; `scripts/verify-build.mjs` enforces a size budget (3.6 MB total, 1.75 MB counted before the title screen), and `npm run e2e` measures the real first load (under 1 MB as GitHub Pages serves it).
- Background people live in `CROWDS` in `src/chapters/ch1/crowd.ts`, by room id: stations, exits, routines per mood (warm, alarm, cold), held things and line counts; the routine logic is `src/engine/crowd.ts` (pure, unit-tested) and the on-screen behaviour is `src/game/Crowd.ts`. Stations must stay clear of the spots Mara walks to (a test checks this).
- A room's `sign` (hook point, rope length, board size, `wood` or `iron`) hangs its name (`room.<id>` in `en.json`); the board is painted in code in `src/game/sign.ts`.
- Rooms can declare `foreground` cut-outs (drawn in front of characters standing behind them), `light` (character tint and depth dimming) and `ambient` (particles and flickering glows) in `src/chapters/ch1/rooms.ts`.

Character sheets follow the Aseprite/LibreSprite JSON-array format with the tags `stand_down`, `blink_down`, `stand_side`, `blink_side`, `stand_up`, `walk_down`, `walk_side`, `walk_up` (six frames each, plants on frames 0 and 3), `crouch`, `dead` and optionally `fidget`. Frames are 256×256, anchored bottom-centre at the feet, and side frames face right. Hand-made sheets with the same tags can replace any of them.

## Current limits

- Chapter 1 is one scene: five rooms, two neighbours, four workers and two kids in the background, and one machine. The background people are placeholder art (recoloured copies of Mara, Oren and Nell, with Nell's shield turned to wood; Bea carries hers as a toy shield), and their held things are drawn in code. Tobi is mentioned but not shown, since there is no child art.
- Rig animation is stiff compared with drawn animation, and the characters always show their three-quarter view.
- Nell uses Iven's illustration from Kiln Courier, shield included. In this game the shield is her old counter shutter.
- Sound is synthesized, so it is simple rather than recorded. No cloud sync. English only.
- Tested in desktop Chrome and with Playwright's phone emulation (Pixel 7), not yet on a real phone. Safari is untested.
- The portrait moods are painted brow warps on a single illustration, so they are subtle; Nell has none because her illustration smiles.
