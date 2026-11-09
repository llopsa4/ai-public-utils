# room-ashways

Status: **final** · room · chapter ch1 · in the game as `art/src/rooms/ashways.png`

## What the game does with it

In the game as the room `ashways` (ch1). Mara (232 px tall) and the others walk in the floor band: x 0–1280, y 536–690.

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **brass pressure cell** (`pressureCell`, x 352–408, y 404–476): look at, use.
- **ash sweeper** (`sweeperDisabled`, x 580–860, y 470–610): look at. Only there at some points of the story.
- **ash sweeper** (`sweeper`, x 940–1200, y 456–596): look at, talk to, use. Only there at some points of the story.
- **ash sweeper** (`sweeperAtPipe`, x 260–520, y 456–596): look at, talk to, use. Only there at some points of the story.
- **steam valve** (`valve`, x 180–292, y 320–524): look at, open, close, use.
- **passage under the bridge** (`passage`, x 1120–1280, y 200–528): look at, go through (an exit).
- **old pipes** (`pipes`, x 0–600, y 0–200): look at, use.
- **way back to Cinderfold** (`wayBack`, x 0–60, y 240–528): look at, go through (an exit).

Drawn separately as objects (leave their spot plain in the painting, they stand there):
- `valve` standing on (236, 524).
- `sweeper` standing on (1070, 596), later moved to (390, 596).

Background people walk about the floor band here (the crowd); keep the band open.

The game hangs the room's name board around (660, 120): keep that patch of wall plain.


## Technical

- File: `art/inbox/room-ashways.png`, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
- Layout to follow: `art/spec/ashways.jpg`.

## Prompt for Codex

```text
Draw for the game The Rift: Ashlands: The ashways, outside the kiln, seen flat-on: an open stone causeway under great overhead pipes at dusk, grey ash everywhere. Left edge: the arched way back into the kiln. Top left: a tangle of great pipes overhead. Left: a pressure valve on a standpipe (drawn separately as an object; leave its spot plain). In the background: an old stone bridge spanning the view on arches, and under its right end the dark passage out of Cinderfold country (right side, the way on). Drifts of ash, a few cracked flagstones, distant chimneys in the haze. The ash sweeper machine is drawn separately.
Light sources in this place: dusk daylight through the bridge arches; no fire.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: the Ashlands, an industrial-fantasy land: kiln villages of fired clay and cream ceramic plates in the ash country, and Ironhaven, a hard city of iron, stone and snow; brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Staging: flat 2D, like a stage set: no perspective, no vanishing point, the camera straight at the back wall at eye level, no side walls. The back wall meets the floor at y 524; the floor band below it (y 536–690) is where people walk, always the same size. Furniture stands against the back wall on the floor line or hangs on the wall above it.
Light: paint the room evenly lit. Show the light sources named above as things in the room (lamps, fire, a lit doorway), with only soft ambient shading (darker under furniture, in the corners and high up). The game adds the glow, the flicker and the colour of the light.
File: art/inbox/room-ashways.png, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
Layout to follow: art/spec/ashways.jpg.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/spec/ashways.jpg` (the layout to follow)

## Then

`npm run art:import`, look at `art/inbox/preview/room-ashways.png`, `npm run art:check`.
