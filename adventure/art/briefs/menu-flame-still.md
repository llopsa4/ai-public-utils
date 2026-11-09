# menu-flame-still

Status: **final** · prop · chapter game · in the game as `art/src/ui/menu-flame-still.png`

## What the game does with it

A moving part the game draws over the room (it swings or turns it).

## Technical

- File: `art/inbox/menu-flame-still.png`, transparent (or flat magenta), anchored at its centre edge. Reduced to the 2-pixel grid.

## Prompt for Codex

```text
Draw for the game Cinderfold: Static flame for reduced-motion title selection.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: an industrial-fantasy village inside an old kiln and the ash country around it: fired clay, cream ceramic plates, iron, brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Proportions: true to the cast (art/style/scale.png): Mara is 232 px, a doorway about 328, a table top 104, a chair seat 48.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match the room).
File: art/inbox/menu-flame-still.png, transparent (or flat magenta), anchored at its centre edge. Reduced to the 2-pixel grid.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`

## Then

`npm run art:import`, look at `art/inbox/preview/menu-flame-still.png`, `npm run art:check`.
