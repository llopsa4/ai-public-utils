# ui-suspicion-eye

Status: **requested** · icon · chapter intro · in the game as `art/src/ui/suspicion-eye.png`

## What the game does with it

An action-ring icon (the verbs that appear around a clicked thing).

## Technical

- File: art/inbox/ui-suspicion-eye.png, a 192x48 strip of four 48x48 frames left to right (calm, narrowing, narrow, red), transparent (or flat magenta).

## Prompt for Codex

```text
Draw for the game Cinderfold: The suspicion eye: how close the person Silas is deceiving is to seeing through him, shown beside the satchel. Four states, left to right: calm (the eye wide open, a pale white, dark pupil); narrowing (the lids half down); narrow (a suspicious slit, the white turned warm); seeing through him (a red-rimmed slit, the white turned red). One eye, the same size and position in each state, drawn like an ink illustration on the game's dark wooden bar.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: an industrial-fantasy village inside an old kiln and the ash country around it: fired clay, cream ceramic plates, iron, brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Proportions: true to the cast (art/style/scale.png): Mara is 232 px, a doorway about 328, a table top 104, a chair seat 48.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match the room).
File: art/inbox/ui-suspicion-eye.png, a 192x48 strip of four 48x48 frames left to right (calm, narrowing, narrow, red), transparent (or flat magenta).
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`

## Then

`npm run art:import`, look at `art/inbox/preview/ui-suspicion-eye.png`, `npm run art:check`.
