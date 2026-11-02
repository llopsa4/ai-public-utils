# Adventure pilot

An original point-and-click adventure pilot. It runs entirely in the browser as static files on GitHub Pages: no server, no accounts, no tracking. It uses only free software: Phaser 3 (MIT), TypeScript, Vite and pngjs.

## Play

Live: <https://llopsa4.github.io/ai-public-utils/adventure/>

- **Walk:** click or tap the floor.
- **Act:** click or tap a person or object to open the action ring, then choose an action (Look at, Open, Close, Pick up, Use, Talk to, Go through). Hover an icon to read its name. Arrow keys move around the ring and Esc closes it.
- **Poses:** click the hero or the keeper for Crouch, Lie down and Stand up.
- **Inventory:** click an item in the bar to carry it, then click what to use it on. Right-click or Esc puts it back.
- **Talk:** choose a reply with the mouse or the number keys. Click anywhere to skip a line.
- **Language:** EN / CA / ES buttons. The choice is remembered on this browser.

The pilot puzzle: open the suitcase, pick up the key, use the key on the door, open the door and go through to the street. Then talk to the keeper.

### Saves

Progress is **not saved automatically**, so reloading starts a new game. Use **Menu → Export save** to download a `.json` file, and **Import save** to continue from one. Imports are fully validated. A damaged or foreign file is rejected and the current game is kept.

## Develop

Requires Node 22.12+.

```sh
npm ci
npm run dev        # http://127.0.0.1:5173 with live reload
npm test           # logic tests (pathfinding, puzzle, dialogue, saves, translations)
npm run build      # typecheck → Vite build → publish to index.html + build/ → verify
npm run preview    # serves the repo root like GitHub Pages: http://127.0.0.1:4173/adventure/
```

GitHub Pages serves the `main` branch as-is, so **commit the generated `index.html` and `build/`** together with the source changes. `dist/` and `node_modules/` are ignored.

Add `?debug` to the URL to expose `window.adventure = { game, session }` for inspecting animations and state.

## Layout

| Path | Contents |
| --- | --- |
| `src/engine/` | Pure, Phaser-free logic: types, geometry, pathfinding (visibility graph + A*), state, save files, dialogue runner, i18n |
| `src/content/` | Game data: rooms (walk polygons, hotspots, objects, entries), interactions, dialogue trees, `strings/{en,ca,es}.json` |
| `src/game/` | Phaser scenes, the `Actor` (pose/walk/blink state machine), asset list, session |
| `src/ui/` | DOM interface over the canvas: speech, action ring, dialogue choices, inventory, menu |
| `art/` | `generate-placeholders.mjs` and its output in `art/src/` |
| `tests/` | `node:test` suites run with tsx |

### Adding content

- **A room:** add a background to `art/src/rooms/`, register it in `src/game/assets.ts`, and add a `RoomDef` to `src/content/rooms.ts`. A room has a walkable outer polygon with obstacle holes, hotspot polygons with verbs and approach points, entries, and a depth-scale range. The tests check that every entry and approach point can be reached.
- **An interaction:** add a case to `interact()` in `src/content/interactions.ts`. It returns a list of commands (walk, say, pose, setFlag, addItem, room, dialogue, wait). New flags and items must also be listed in `src/engine/state.ts` so that saves accept them.
- **Text:** add the key to all three string tables. The tests fail if a language is missing a key or a placeholder.

## Art pipeline

The game runs at 640×360 logical pixels. It scales in whole-pixel steps (letterboxed) on screens at least that large, and scales down proportionally on smaller ones.

The placeholders come from `npm run art` (`art/generate-placeholders.mjs`). They are committed, so ordinary builds don't need to regenerate them. To replace them with real pixel art, overwrite the files one-for-one:

- **Sprite sheets** use the Aseprite / LibreSprite **JSON array** export format (`frames[]` + `meta.frameTags`). Character sheets need these tags: `stand_down`, `stand_side`, `stand_up`, `blink_down`, `blink_side`, `walk_down`, `walk_side`, `walk_up`, `crouch`, `dead`. Side frames face **right** and are mirrored for left. Every frame is anchored at the **bottom centre** (the feet). Frame size is free, but the placeholders use 128×128 with a figure about 112 px tall.
- **Per-frame durations** set the animation speed. Multi-frame tags loop.
- **Objects** use the same format, with one tag per state (`closed` / `open`).
- **Rooms** are 640×360 PNGs. If a new background moves things, update the hotspot and walk polygons in `rooms.ts`.

Animation code depends only on tag names and the foot anchor, so swapping art needs no code changes.

## Current limits

- Two rooms, one puzzle, one conversation: this is a pilot of the engine, not a game yet.
- There is no sound, no autosave and no cloud sync.
- Free walking and the action ring were tested in desktop Chrome. Touch input goes through the same Phaser pointer events, but it hasn't been tested on a real phone or tablet. Portrait phones get a "turn your device" screen.
- Phaser makes up most of the 1.3 MB download (about 1.25 MB of JavaScript, roughly 300 KB gzipped).
