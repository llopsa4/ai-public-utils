# battle-backdrop-workshop

Status: **placeholder** · battle-backdrop · chapter ch2 · in the game as `art/src/kc/tempering-house.webp`

## What the game does with it

The fight screen's backdrop: the fighters stand on its lower third, the cards cover the bottom.

## Technical

- File: `art/inbox/battle-backdrop-workshop.png`, opaque, 1280×720 or larger at 16:9; the floor clear in the lower third.

## Prompt for Codex

```text
Draw for the game Cinderfold: Bryn's workshop as the sparring backdrop: the same place as the room, the floor clear in the lower third.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 4-pixel grid on import, so use big clear shapes and flat colour areas.
World: an industrial-fantasy village inside an old kiln and the ash country around it: fired clay, cream ceramic plates, iron, brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Staging: flat 2D, like a stage set: no perspective, no vanishing point, the camera straight at the back wall at eye level, no side walls. The back wall meets the floor at y 524; the floor band below it (y 536–690) is where people walk, always the same size. Furniture stands against the back wall on the floor line or hangs on the wall above it.
Light: paint the room evenly lit. Show the light sources named above as things in the room (lamps, fire, a lit doorway), with only soft ambient shading (darker under furniture, in the corners and high up). The game adds the glow, the flicker and the colour of the light.
File: art/inbox/battle-backdrop-workshop.png, opaque, 1280×720 or larger at 16:9; the floor clear in the lower third.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`

## Then

`npm run art:import`, look at `art/inbox/preview/battle-backdrop-workshop.png`, `npm run art:check`.
