# bridge

Status: **placeholder** · object · chapter ch2 · in the game as `art/src/ch2/objects/bridge.png`

## What the game does with it

Stands in the room `tunnelCistern` on its foot point (816, 600) (bottom centre of the picture); it shows "down" or "up" as the story moves on.
States: up, down: one picture each, identical framing; only what changes between states differs.

## Technical

- Files: `art/inbox/bridge-up.png`, `art/inbox/bridge-down.png`: transparent (or on flat magenta #FF00FF), the thing standing on the bottom edge.
- Fitted into a 320×220 art-pixel frame (true proportion to Mara at 232), reduced to the 2-pixel grid, outlined.

## Prompt for Codex

```text
Draw for the game The Rift: Ashlands: The cistern drawbridge: a wooden plank bridge with iron bands, hinged on the far ledge. up: raised on its end against the far wall; down: lying flat across the pit.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: the Ashlands, an industrial-fantasy land: kiln villages of fired clay and cream ceramic plates in the ash country, and Ironhaven, a hard city of iron, stone and snow; brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Proportions: true to the cast (art/style/scale.png): Mara is 232 px, a doorway about 328, a table top 104, a chair seat 48.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match the room).
Files: art/inbox/bridge-up.png, art/inbox/bridge-down.png: transparent (or on flat magenta #FF00FF), the thing standing on the bottom edge.
Fitted into a 320×220 art-pixel frame (true proportion to Mara at 232), reduced to the 2-pixel grid, outlined.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`

## Then

`npm run art:import`, look at `art/inbox/preview/bridge.png`, `npm run art:check`.
