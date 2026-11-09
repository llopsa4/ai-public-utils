# room-tunnel-mouth

Status: **placeholder** · room · chapter ch2 · in the game as `art/src/ch2/rooms/tunnel-mouth.png`

## What the game does with it

In the game as the room `tunnelMouth` (ch2). Mara (232 px tall) and the others walk in the floor band: x 0–1280, y 536–690.

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **iron plate** (`plate`, x 1016–1200, y 148–188): look at.
- **lamp** (`mouthLamp`, x 972–1000, y 260–296): look at.
- **tunnel arch** (`arch`, x 1024–1260, y 196–528): look at, go through (an exit).
- **pipe** (`pipeSeat`, x 360–700, y 476–528): look at, use.
- **dawn** (`dawn`, x 0–840, y 0–300): look at.
- **ash road** (`ashRoad`, x 0–72, y 300–528): look at, go through (an exit).

The game hangs the room's name board around (600, 92): keep that patch of wall plain.


## Technical

- File: `art/inbox/room-tunnel-mouth.png`, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
- Layout to follow: `art/spec/tunnel-mouth.jpg`.

## Prompt for Codex

```text
Draw for the game The Rift: Ashlands: The mouth of the service tunnels at dawn, seen flat-on: left, the ash road running back towards Cinderfold under a pale pink-gold dawn sky; low ash dunes; centre, an old iron pipe lying half sunk along the ground, the right height to sit on; right, a brick arch (the entrance to service line 4) set in a low embankment, dark inside, with an iron name plate above it and a small oil lamp on a bracket beside it.
Light sources in this place: soft dawn light from the left; the small lamp by the arch (right).
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: the Ashlands, an industrial-fantasy land: kiln villages of fired clay and cream ceramic plates in the ash country, and Ironhaven, a hard city of iron, stone and snow; brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Staging: flat 2D, like a stage set: no perspective, no vanishing point, the camera straight at the back wall at eye level, no side walls. The back wall meets the floor at y 524; the floor band below it (y 536–690) is where people walk, always the same size. Furniture stands against the back wall on the floor line or hangs on the wall above it.
Light: paint the room evenly lit. Show the light sources named above as things in the room (lamps, fire, a lit doorway), with only soft ambient shading (darker under furniture, in the corners and high up). The game adds the glow, the flicker and the colour of the light.
File: art/inbox/room-tunnel-mouth.png, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
Layout to follow: art/spec/tunnel-mouth.jpg.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/spec/tunnel-mouth.jpg` (the layout to follow)

## Then

`npm run art:import`, look at `art/inbox/preview/room-tunnel-mouth.png`, `npm run art:check`.
