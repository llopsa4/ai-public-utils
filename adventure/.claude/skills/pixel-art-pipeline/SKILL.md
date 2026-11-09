---
name: pixel-art-pipeline
description: Create, edit, replace or review art for the Cinderfold adventure (adventure/art): rigged character sheets, portraits, rooms, objects, item and verb icons. Use for any request about sprites, animations, poses, backgrounds, portraits or art quality in the adventure game.
---

# Cinderfold art pipeline

All art comes from **Kiln Courier's illustrations** (`FFCardGame/assets`) through scripts. Only outputs in `art/src` are committed, and every output is listed in `art/PROVENANCE.md`. The game loads art only through `src/game/assets.ts`.

## Resolution

The world (all content coordinates) is 640×360. Art and the canvas are **2×** that: rooms are 1280×720, and sprites are drawn at half scale under a 2× camera. Author everything at 2×.

## Scripts (`npm run art` runs all four)

- **`art/pixelate.mjs`**: rooms, the ash sweeper, item icons (64×64) and objects. Helpers: `shrink(src, crop, w, h, {colors, alphaCut, line, grading})`, the masks `masked()` / `circle()` / `ellipseMask()` / `polygonMask()`, `writeSheet()`, and the drawing helpers `fillRect` / `fillEllipse` / `line` for procedural touches. Find crop coordinates by gridding the source (lines every 50 px) and reading the image.
- **`art/rig.mjs`**: characters and portraits. Per character it sets `hipY`, `splitX` (near and far leg), hip and knee joints, optional `arm`, `eyes` (blink patches with a `skinAt` sample), `portrait` crop, target `height`, `walks`, and `nearIsUpper` / `crouchSquash` for props such as Nell's shield. The parts overlap by `OVERLAP` px so joints never open a gap; pinholes are filled before the outline. `unpowered` dims the gauntlet glow (the `mara` sheet versus `mara-gauntlet`).
- **`art/icons.mjs`**: the 24×24 action-ring icons.
- **`art/webp.mjs`**: WebP copies of `rooms/*.png` and `foreground/*.png`; the game loads those (`src/game/assets.ts`). Re-run it after changing a room.
- **Portraits** are strips of 256×256 frames: per mood (`MOODS` in `rig.mjs`, overridable per character with `moods`), mouth closed then open. `face.mouth` and `face.brows` (with the `inner` end) place the edits. Keep `PORTRAIT_MOODS` in `src/game/assets.ts` in sync; a unit test checks the strip widths. Make an enlarged preview of the six frames before shipping a change.

- **Foreground cut-outs** (`foregroundPiece` in `pixelate.mjs`) and room `light` / `ambient` settings live in `src/content/rooms.ts`. All outputs go through `encodeIndexed` (`art/png.mjs`); keep images at 128 colours or fewer.

## Contract with the code

- **Character sheets** are Aseprite JSON-array with 256×256 frames in a 5-column grid. Required tags: `stand_down`, `blink_down`, `stand_side`, `blink_side`, `stand_up`, `walk_down`, `walk_side`, `walk_up` (six frames each; foot plants on frames 0 and 3, which trigger footstep sounds), `crouch`, `dead`. Optional `fidget` (idle gesture). Walk frames advance by distance (`STRIDE` in `Actor.ts`), not time. Frames sit feet-down on the bottom row, centred on the hips, facing right (mirrored for left).
- **Objects:** one tag per state, matching `whenTrue`/`whenFalse` in `src/content/rooms.ts`. `anim` loops a tag (for example the sweeper's `idle`).
- **Hit boxes** and speech placement use `BODY` in `src/game/Actor.ts`, in world units. Update it if character proportions change a lot.
- If a background changes, refit that room's walk polygon, holes and hotspots. Check them with `?debug`.

## Review before finishing

1. Make enlarged previews of the new sheets and props in the session scratchpad (pngjs composite) and look at them. Check seams at the hips, outline artifacts, eyes closing on blink frames, clipping at frame edges and halo leftovers.
2. Run `npm test` and `npm run test:feature -- art`. Unit tests only: inspect changed rendering, placement or animation with screenshots instead of browser suites, and use `npm run test:all` for shared runtime/build changes and before publishing; see `adventure/TESTING.md`.
3. Playtest changed visuals at `http://127.0.0.1:4173/adventure/?debug` (`npm run preview`). Check scale against the furniture, depth sorting, the cold tint and the portraits. Focused checks and visual inspection do not require full story journeys for ordinary art changes.
4. Update `art/PROVENANCE.md`. Use only Kiln Courier art, original art, or art with a free licence that is recorded there.
