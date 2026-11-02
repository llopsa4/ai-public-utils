# Cinderfold: A delivery he does not want

A point-and-click adventure built from the first scene of **Kiln Courier**'s story. Mara, a courier and kiln-minder in Cinderfold (a village built inside an old industrial kiln), must shut down the cracked regulator and carry it away for assessment. He doesn't want to go. The game runs entirely in the browser as static files on GitHub Pages: no server, no accounts, no tracking. It uses only free software: Phaser 3 (MIT), TypeScript, Vite and pngjs.

## Play

Live: <https://llopsa4.github.io/ai-public-utils/adventure/>

- **Walk:** click or tap the floor.
- **Act:** click or tap a person or object to open the action ring, then choose an action (Look at, Open, Close, Pick up, Use, Talk to, Go to). Arrow keys move around the ring and Esc closes it.
- **Satchel:** click an item for Look at / Use. Use carries it, so you then click what to use it on. Right-click or Esc puts it back.
- **Poses:** click Mara, Oren or Nell for Crouch, Lie down and Stand up.
- **Talk:** choose a reply with the mouse or the number keys. Lines appear in the panel at the bottom with the speaker's portrait. Click to skip a line.
- **Hints:** hold **Space** (or press the eye button) to label everything you can interact with. **Notebook** lists what Mara has done and what he is doing now.
- **Exits:** double-click a doorway to go straight through.
- **Menu:** saves, **History** (everything said so far) and **Settings** (text speed, volume, mute, auto-advance, reduced motion). Settings are remembered in this browser; progress is not.

The scene covers: Mara's tent → the kiln hall → the firing house (Nell's latch, then the alarm) → the regulator gallery (the failed patch, the conversation with Oren, his mother's notebook, the shutdown) → the cold firing house (goodbyes) → the ashways (the ash sweeper and the steam valve) → "To be continued".

Text is **English only** for now. Languages can be added back by dropping a `strings/<code>.json` beside `en.json` and listing it in `src/engine/i18n.ts`. The switcher reappears once there are two.

### Saves

Progress is **not saved automatically**, so reloading starts a new game. Use **Menu → Export save** to download a `.json` file and **Import save** to continue. Imports are fully validated: a damaged, foreign or older-version file is rejected and the current game is kept.

## Develop

Requires Node 22.12+.

```sh
npm ci
npm run dev        # http://127.0.0.1:5173 with live reload
npm test           # logic tests (full scene chain, argument paths, pathfinding, saves, strings)
npm run build      # typecheck → Vite build → publish to index.html + build/ → verify
npm run preview    # serves the repo root like GitHub Pages: http://127.0.0.1:4173/adventure/
```

GitHub Pages serves the `main` branch as-is, so **commit the generated `index.html` and `build/`** together with the source changes. `dist/` and `node_modules/` are ignored.

Add `?debug` to the URL to draw the walk areas (green), obstacles (red), hotspots (yellow), approach points (blue) and entries (pink), and to expose `window.adventure = { game, session }`.

## Layout

| Path | Contents |
| --- | --- |
| `src/engine/` | Pure, Phaser-free logic: types, geometry, pathfinding (visibility graph + A*), state, save files, dialogue runner, i18n |
| `src/content/` | Rooms (walk polygons, hotspots, objects, entries), interactions, dialogue trees, `strings/en.json` |
| `src/game/` | Phaser scenes, the `Actor` (pose/walk/blink), asset list, session |
| `src/ui/` | DOM interface over the canvas: dialogue panel, action ring, choices, hotspot labels, satchel, menu, notebook, history, settings, end card |
| `src/audio/` | Web Audio synthesizer for ambience and effects (no sound files) |
| `art/` | Art scripts and their output in `art/src/` (see [PROVENANCE](art/PROVENANCE.md)) |
| `tests/` | `node:test` suites run with tsx |

## Art pipeline

The world is 640×360 logical units. The art and the canvas are 2× that (1280×720), and the stage scales to fit the window. All art comes from Kiln Courier's illustrations ([provenance](art/PROVENANCE.md)). Run `npm run art` to rebuild everything, or one script at a time:

- `npm run pixelate`: rooms, the ash sweeper, item icons and objects (crop, mask, area-average downscale, palette reduction).
- `npm run rig`: animated characters and dialogue portraits. Legs are split at the hip and knee for a six-frame step; NPCs get a `fidget` frame. Each Kiln illustration is a single three-quarter pose, so `art/rig.mjs` cuts it into parts (upper body, near leg, far leg) and poses them per frame. That gives a walk sway, a crouch (legs folded), lying down (the figure rotated, eyes closed) and a blink (eyelids painted over). There are no back or side views, so every direction reuses the three-quarter pose, mirrored for left. Joints, eyes and portrait crops are set per character at the top of the script.
- `art/icons.mjs`: the drawn 24×24 action-ring icons.
- Outputs are palette-indexed PNGs (`art/png.mjs`). Rooms load the first time they are entered; `scripts/verify-build.mjs` enforces a size budget (4.5 MB total, 3 MB before the first room).
- Rooms can declare `foreground` cut-outs (drawn in front of characters standing behind them), `light` (character tint and depth dimming) and `ambient` (particles and flickering glows) in `src/content/rooms.ts`.

Character sheets follow the Aseprite/LibreSprite JSON-array format with the tags `stand_down`, `blink_down`, `stand_side`, `blink_side`, `stand_up`, `walk_down`, `walk_side`, `walk_up` (six frames each, plants on frames 0 and 3), `crouch`, `dead` and optionally `fidget`. Frames are 256×256, anchored bottom-centre at the feet, and side frames face right. Hand-made sheets with the same tags can replace any of them.

## Current limits

- One scene: four rooms, two neighbours and one machine. Tobi is mentioned but not shown, since there is no child art.
- Rig animation is stiff compared with drawn animation, and the characters always show their three-quarter view.
- Nell uses Iven's illustration from Kiln Courier, shield included. In this game the shield is her old counter shutter.
- Sound is synthesized, so it is simple rather than recorded. No autosave and no cloud sync. English only.
- Tested in desktop Chrome. Touch input uses the same pointer events but hasn't been tested on a phone.
