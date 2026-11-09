# creature-rat-pack

Status: **placeholder** · prop · chapter ch2 · in the game as `art/src/ch2/creatures/rat-pack.png`

## What the game does with it

The creature's small sprite in the room: it comes out of the grate, the pipe or the pit, hops towards Mara, then the fight starts.

## Technical

- File: `art/inbox/creature-rat-pack.png`, transparent (or flat magenta), anchored at its bottom edge, 120 px tall. Reduced to the 2-pixel grid.

## Prompt for Codex

```text
Draw for the game The Rift: Ashlands: Rat Pack: three or four cinder rats moving together, one in front, the others behind and on top. Small, for its entrance in the room (same pose as the fight picture).
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: the Ashlands, an industrial-fantasy land: kiln villages of fired clay and cream ceramic plates in the ash country, and Ironhaven, a hard city of iron, stone and snow; brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Proportions: true to the cast (art/style/scale.png): Mara is 232 px, a doorway about 328, a table top 104, a chair seat 48.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match the room).
File: art/inbox/creature-rat-pack.png, transparent (or flat magenta), anchored at its bottom edge, 120 px tall. Reduced to the 2-pixel grid.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`

## Then

`npm run art:import`, look at `art/inbox/preview/creature-rat-pack.png`, `npm run art:check`.
