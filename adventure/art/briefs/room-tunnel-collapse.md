# room-tunnel-collapse

Status: **placeholder** · room · chapter ch2 · in the game as `art/src/ch2/rooms/tunnel-collapse.png`

## What the game does with it

In the game as the room `tunnelCollapse` (ch2). Mara (232 px tall) and the others walk in the floor band: x 240–1280, y 536–690.

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **rag** (`rag`, x 248–308, y 540–572): look at, take. Only there at some points of the story.
- **rusted grate** (`grate`, x 1120–1268, y 300–524): look at, open, use, go through (an exit).
- **rubble** (`rubble`, x 0–240, y 220–690): look at, use, go through (an exit).
- **lamp** (`lamp1`, x 612–668, y 80–128): look at.
- **pipes** (`pipes1`, x 0–1280, y 12–80): look at, use.
- **puddles** (`puddles`, x 320–1080, y 632–690): look at.

Drawn separately as objects (leave their spot plain in the painting, they stand there):
- `rag` standing on (278, 572).
- `grate` standing on (1194, 524).

The game hangs the room's name board around (520, 88): keep that patch of wall plain.


## Technical

- File: `art/inbox/room-tunnel-collapse.png`, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
- Layout to follow: `art/spec/tunnel-collapse.jpg`.

## Prompt for Codex

```text
Draw for the game Cinderfold: A collapsed service tunnel, seen flat-on: a brick vault with pipes running along the ceiling, one failing lamp hanging in the middle. Left: the roof has fallen, a slope of broken bricks and rubble filling the way back. The floor is wet stone with puddles. Right edge: the tunnel's end opening, where a rusted grate stands (drawn separately as an object; paint the dark opening behind it).
Light sources in this place: one failing lamp (centre top); Mara carries the warm glow of his gauntlet.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: an industrial-fantasy village inside an old kiln and the ash country around it: fired clay, cream ceramic plates, iron, brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Staging: flat 2D, like a stage set: no perspective, no vanishing point, the camera straight at the back wall at eye level, no side walls. The back wall meets the floor at y 524; the floor band below it (y 536–690) is where people walk, always the same size. Furniture stands against the back wall on the floor line or hangs on the wall above it.
Light: paint the room evenly lit. Show the light sources named above as things in the room (lamps, fire, a lit doorway), with only soft ambient shading (darker under furniture, in the corners and high up). The game adds the glow, the flicker and the colour of the light.
File: art/inbox/room-tunnel-collapse.png, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
Layout to follow: art/spec/tunnel-collapse.jpg.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/spec/tunnel-collapse.jpg` (the layout to follow)

## Then

`npm run art:import`, look at `art/inbox/preview/room-tunnel-collapse.png`, `npm run art:check`.
