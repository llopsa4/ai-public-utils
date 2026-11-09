# room-tunnel-cistern

Status: **placeholder** · room · chapter ch2 · in the game as `art/src/ch2/rooms/tunnel-cistern.png`

## What the game does with it

In the game as the room `tunnelCistern` (ch2). Mara (232 px tall) and the others walk in the floor band: x 0–652, y 536–690.

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **cleat** (`cleat`, x 536–604, y 488–532): look at, use, open.
- **chain** (`chain`, x 556–584, y 120–488): look at, use, take.
- **basket** (`basket`, x 760–844, y 152–244): look at, use, take.
- **drawbridge** (`bridge`, x 896–948, y 380–600): look at, use.
- **pit** (`pit`, x 660–960, y 524–690): look at, go through (an exit).
- **far ledge** (`farLedge`, x 964–1280, y 240–690): look at, go through (an exit).
- **way back** (`cisternBack`, x 0–60, y 240–528): look at, go through (an exit).

Drawn separately as objects (leave their spot plain in the painting, they stand there):
- `bridge` standing on (816, 600).
- `basket` standing on (800, 244).

The game hangs the room's name board around (320, 208): keep that patch of wall plain.


## Technical

- File: `art/inbox/room-tunnel-cistern.png`, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
- Layout to follow: `art/spec/tunnel-cistern.jpg`.

## Prompt for Codex

```text
Draw for the game The Rift: Ashlands: An ash cistern in the tunnels, seen flat-on: near side (left) a stone floor; in the middle a dark square pit cutting across the floor, ash rising from it; far side (right) a stone ledge with grey daylight from the road beyond. Above the pit, a pulley wheel on a bracket; a counterweight chain running from it down to an iron cleat on the floor at the pit's near edge, lying against a hot steam pipe so its lower links glow dull red. The drawbridge and the nest basket are drawn separately. One lamp on the left wall. Left edge: the way back.
Light sources in this place: one lamp on the left wall; pale daylight on the far ledge (right).
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: the Ashlands, an industrial-fantasy land: kiln villages of fired clay and cream ceramic plates in the ash country, and Ironhaven, a hard city of iron, stone and snow; brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Staging: flat 2D, like a stage set: no perspective, no vanishing point, the camera straight at the back wall at eye level, no side walls. The back wall meets the floor at y 524; the floor band below it (y 536–690) is where people walk, always the same size. Furniture stands against the back wall on the floor line or hangs on the wall above it.
Light: paint the room evenly lit. Show the light sources named above as things in the room (lamps, fire, a lit doorway), with only soft ambient shading (darker under furniture, in the corners and high up). The game adds the glow, the flicker and the colour of the light.
File: art/inbox/room-tunnel-cistern.png, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
Layout to follow: art/spec/tunnel-cistern.jpg.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/spec/tunnel-cistern.jpg` (the layout to follow)

## Then

`npm run art:import`, look at `art/inbox/preview/room-tunnel-cistern.png`, `npm run art:check`.
