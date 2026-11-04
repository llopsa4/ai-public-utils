# battle-enemy-cinder-rat

Status: **placeholder** · battle-portrait · chapter ch2 · in the game as `art/src/ch2/creatures/cinder-rat.webp`

## What the game does with it

Shown on the fight screen on the right, facing left towards Mara.

## Technical

- File: `art/inbox/battle-enemy-cinder-rat.png`, transparent (or flat magenta), standing on the bottom edge, 768 px tall (the figure about 60% of that, standing 4% above the bottom). Reduced to the 2-pixel grid.

## Prompt for Codex

```text
Draw for the game Cinderfold: Cinder Rat: a tunnel rat the size of a dog, fur singed to grey wire, glowing ember eyes, a long tail. For the fight screen: facing left, a picture 768 tall with the creature exactly 60% of that height, standing 4% above the bottom edge, as wide as it needs, transparent background.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: an industrial-fantasy village inside an old kiln and the ash country around it: fired clay, cream ceramic plates, iron, brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Proportions: true to the cast (art/style/scale.png): Mara is 232 px, a doorway about 328, a table top 104, a chair seat 48.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match the room).
Facing left (it stands on the right of the fight).
File: art/inbox/battle-enemy-cinder-rat.png, transparent (or flat magenta), standing on the bottom edge, 768 px tall (the figure about 60% of that, standing 4% above the bottom). Reduced to the 2-pixel grid.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`

## Then

`npm run art:import`, look at `art/inbox/preview/battle-enemy-cinder-rat.png`, `npm run art:check`.
