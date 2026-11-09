# room-tunnel-steam

Status: **placeholder** · room · chapter ch2 · in the game as `art/src/ch2/rooms/tunnel-steam.png`

## What the game does with it

In the game as the room `tunnelSteam` (ch2). Mara (232 px tall) and the others walk in the floor band: x 0–1280, y 536–690.

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **gauge** (`gauge2`, x 576–624, y 280–328): look at, use.
- **copper valve** (`copperValve`, x 500–564, y 372–436): look at, use, open.
- **iron valve** (`ironValve`, x 640–704, y 372–436): look at, use, open.
- **steam** (`steamJet`, x 1000–1140, y 320–600): look at, use, go through (an exit).
- **leaking pipe** (`leakPipe`, x 760–1160, y 240–312): look at, use.
- **passage** (`passage`, x 1192–1280, y 240–528): look at, go through (an exit).
- **way back** (`steamBack`, x 0–60, y 240–528): look at, go through (an exit).

Drawn separately as objects (leave their spot plain in the painting, they stand there):
- `steam` standing on (1070, 600).

The game hangs the room's name board around (880, 88): keep that patch of wall plain.


## Technical

- File: `art/inbox/room-tunnel-steam.png`, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
- Layout to follow: `art/spec/tunnel-steam.jpg`.

## Prompt for Codex

```text
Draw for the game The Rift: Ashlands: A steam junction in the tunnels, seen flat-on: a brick wall with a long pipe along it wrapped in a copper band (right of centre), a copper line running from that pipe down to a copper valve wheel; an iron valve wheel beside it on its own iron pipe; a round pressure gauge above the two wheels; one failing lamp (left). Right edge: the passage on, a dark opening. Left edge: the way back. The jet of steam is drawn separately.
Light sources in this place: one failing lamp (left top); the steam pale.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: the Ashlands, an industrial-fantasy land: kiln villages of fired clay and cream ceramic plates in the ash country, and Ironhaven, a hard city of iron, stone and snow; brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Staging: flat 2D, like a stage set: no perspective, no vanishing point, the camera straight at the back wall at eye level, no side walls. The back wall meets the floor at y 524; the floor band below it (y 536–690) is where people walk, always the same size. Furniture stands against the back wall on the floor line or hangs on the wall above it.
Light: paint the room evenly lit. Show the light sources named above as things in the room (lamps, fire, a lit doorway), with only soft ambient shading (darker under furniture, in the corners and high up). The game adds the glow, the flicker and the colour of the light.
File: art/inbox/room-tunnel-steam.png, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
Layout to follow: art/spec/tunnel-steam.jpg.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/spec/tunnel-steam.jpg` (the layout to follow)

## Then

`npm run art:import`, look at `art/inbox/preview/room-tunnel-steam.png`, `npm run art:check`.
