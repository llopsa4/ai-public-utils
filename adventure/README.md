# Cinderfold: A delivery he does not want

A point-and-click adventure built from the first scene of **Kiln Courier**'s story. Mara, a courier and kiln-minder in Cinderfold (a village built inside an old industrial kiln), must shut down the cracked regulator and carry it away for assessment. He doesn't want to go. The game runs entirely in the browser as static files on GitHub Pages: no server, no accounts, no tracking. It uses only free software: Phaser 3 (MIT), TypeScript and Vite; the art and test tools (pngjs, upng-js, sharp, Playwright) are development-only.

## Play

Live: <https://llopsa4.github.io/ai-public-utils/adventure/>

- **Walk:** click or tap the floor.
- **Act:** click or tap a person or object to open the action ring, then choose an action (Look at, Open, Close, Pick up, Use, Talk to, Go to). Arrow keys move around the ring and Esc closes it.
- **Satchel:** click an item for Look at / Use. Use carries it, so you then click what to use it on. Right-click or Esc puts it back.
- **Poses:** click Mara, Oren or Nell for Crouch, Lie down and Stand up.
- **Talk:** choose a reply with the mouse or the number keys. Lines appear in the panel at the bottom with the speaker's portrait, which talks and shows a mood (worried, angry) on some lines. Click to skip a line.
- **Explore:** looking at something again often gets a different line, and four small secrets are hidden around Cinderfold (the notebook counts the ones you've found).
- **Labels:** hold **Space** (or press the eye button) to label everything you can interact with. **Notebook** lists what Mara has done and what he is doing now.
- **Exits:** double-click a doorway to go straight through.
- **Keyboard:** Tab moves between the things in the room (then on to the bar), Enter opens the action ring, arrow keys move around it, number keys pick replies.
- **Touch:** press and hold on the scene to label everything. The ⛶ button switches to full screen where the browser allows it.
- **Menu:** saves, **History** (everything said so far), **Settings** (text speed, effects and music volume, mute, auto-advance, reduced motion, text size, high contrast) and **Title screen**.
- **Hints:** the notebook's **Hint** button gives a nudge for the current goal, then the plain answer.
- **Cursor:** the pointer shows the name of what it is over and what a click will do (look, handle, talk, leave).

The scene covers: Mara's tent → the kiln hall → the firing house (Nell's latch, then the alarm) → the regulator gallery (the failed patch, the conversation with Oren, his mother's notebook, the shutdown) → the cold firing house (goodbyes) → the ashways (the ash sweeper and the steam valve) → "To be continued".

Text is **English only** for now. Languages can be added back by dropping a `strings/<code>.json` beside `en.json` and listing it in `src/engine/i18n.ts`. The switcher reappears once there are two.

### Saves

Progress is **autosaved in this browser** (localStorage, one slot) after each walk, action and room change; the title screen offers **Continue**. Use **Menu → Export save** to download a `.json` copy and **Import save** to load one. Autosaves and imports go through the same validation: a damaged, foreign or older-version save is rejected and never loaded.

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

Add `?debug` to the URL to draw the walk areas (green), obstacles (red), hotspots (yellow), approach points (blue) and entries (pink), and to expose `window.adventure = { game, session, sound, interact }` (the e2e tests use it).

Production builds bundle a reduced Phaser (`src/phaser-custom.cjs`: no physics, tilemaps, text or Phaser sound) built from Phaser's own sources; `vite.config.ts` sets Phaser's compile-time flags. The dev server uses the full prebuilt Phaser. If new code needs a Phaser module that is not in the custom entry, add it there; `npm run e2e` catches what's missing.

## Layout

| Path | Contents |
| --- | --- |
| `src/engine/` | Pure, Phaser-free logic: types, geometry, pathfinding (visibility graph + A*), state, save files, dialogue runner, i18n |
| `src/content/` | Rooms (walk polygons, hotspots, objects, entries), interactions, dialogue trees, `strings/en.json` |
| `src/game/` | Phaser scenes, the `Actor` (pose/walk/blink), asset list, session |
| `src/ui/` | DOM interface over the canvas: dialogue panel, action ring, choices, hotspot labels, satchel, menu, notebook, history, settings, end card |
| `src/audio/` | Web Audio synthesizer for ambience, effects, footsteps per floor surface, and a generative score per room mood (no sound files) |
| `art/` | Art scripts and their output in `art/src/` (see [PROVENANCE](art/PROVENANCE.md)) |
| `tests/` | `node:test` suites run with tsx |

## Art pipeline

The world is 640×360 logical units. The art and the canvas are 2× that (1280×720), and the stage scales to fit the window. All art comes from Kiln Courier's illustrations ([provenance](art/PROVENANCE.md)). Run `npm run art` to rebuild everything, or one script at a time:

- `npm run pixelate`: rooms, the ash sweeper, item icons and objects (crop, mask, area-average downscale, palette reduction).
- `npm run rig`: animated characters and dialogue portraits. Legs are split at the hip and knee for a six-frame step; NPCs get a `fidget` frame. Each Kiln illustration is a single three-quarter pose, so `art/rig.mjs` cuts it into parts (upper body, near leg, far leg) and poses them per frame. That gives a walk sway, a crouch (legs folded), lying down (the figure rotated, eyes closed) and a blink (eyelids painted over). There are no back or side views, so every direction reuses the three-quarter pose, mirrored for left. Joints, eyes and portrait crops are set per character at the top of the script.
- `art/icons.mjs`: the drawn 24×24 action-ring icons.
- `npm run webp` (`art/webp.mjs`, sharp): WebP copies of the rooms and foreground cut-outs, which are what the game loads.
- Outputs are palette-indexed PNGs (`art/png.mjs`), plus the WebP rooms. Rooms, Oren, Nell and the lit gauntlet load the first time they are needed; `scripts/verify-build.mjs` enforces a size budget (3 MB total, 1.65 MB counted before the title screen), and `npm run e2e` measures the real first load (under 1 MB as GitHub Pages serves it).
- Rooms can declare `foreground` cut-outs (drawn in front of characters standing behind them), `light` (character tint and depth dimming) and `ambient` (particles and flickering glows) in `src/content/rooms.ts`.

Character sheets follow the Aseprite/LibreSprite JSON-array format with the tags `stand_down`, `blink_down`, `stand_side`, `blink_side`, `stand_up`, `walk_down`, `walk_side`, `walk_up` (six frames each, plants on frames 0 and 3), `crouch`, `dead` and optionally `fidget`. Frames are 256×256, anchored bottom-centre at the feet, and side frames face right. Hand-made sheets with the same tags can replace any of them.

## Current limits

- One scene: four rooms, two neighbours and one machine. Tobi is mentioned but not shown, since there is no child art.
- Rig animation is stiff compared with drawn animation, and the characters always show their three-quarter view.
- Nell uses Iven's illustration from Kiln Courier, shield included. In this game the shield is her old counter shutter.
- Sound is synthesized, so it is simple rather than recorded. No cloud sync. English only.
- Tested in desktop Chrome and with Playwright's phone emulation (Pixel 7), not yet on a real phone. Safari is untested.
- The portrait moods are painted brow warps on a single illustration, so they are subtle; Nell has none because her illustration smiles.
