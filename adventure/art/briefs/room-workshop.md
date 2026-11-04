# room-workshop

Status: **placeholder** · room · chapter ch2 · in the game as `art/src/ch2/rooms/workshop.png`

## What the game does with it

In the game as the room `workshop` (ch2). Mara (232 px tall) and the others walk in the floor band: x 0–1280, y 536–690, around 1 obstacle(s).

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **Old crucible** (`crucible`, x 140–200, y 336–388): look at. A secret: a small, easy-to-miss detail, not highlighted.
- **Reading valve** (`readingValve`, x 800–852, y 160–232): look at, use, open.
- **Stool** (`stool2`, x 368–436, y 464–536): look at, use.
- **Bryn's bench** (`bench`, x 72–352, y 380–524): look at, use.
- **Training cage** (`cage`, x 480–760, y 300–524): look at, use, open.
- **Coal crate** (`coal`, x 880–972, y 444–524): look at, take.
- **Curtain to the back room** (`toBackroom`, x 0–60, y 220–528): look at, go through (an exit).
- **Open side** (`view`, x 980–1200, y 80–380): look at.
- **Return pipe** (`returnPipe`, x 200–1080, y 16–136): look at, use.
- **Out to the road** (`toRoad`, x 1220–1280, y 220–528): look at, go through (an exit).

Story characters stand at: Bryn (1040, 592). Keep the wall behind them uncluttered at head height.

The game hangs the room's name board around (660, 240): keep that patch of wall plain.


## Technical

- File: `art/inbox/room-workshop.png`, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
- Layout to follow: `art/spec/workshop.jpg`.

## Prompt for Codex

```text
Draw for the game Cinderfold: Bryn's workshop inside the tempering house, seen flat-on: across the top, a great ceramic return pipe with a glowing flange and a small brass reading valve on it (right of centre). Left edge: a curtain to the back room. Left: her long workbench with tongs, files, a glove and a small crucible on it, a stool in front. Centre: a training rig in an iron cage, a brush drum on a sprung frame. Right of centre: a crate of coal. Right: the open side of the house, looking out over a valley at dusk. Right edge: the door out to the road. Stone floor with soot.
Light sources in this place: daylight from the open side (right); the pipe flange glowing orange.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: an industrial-fantasy village inside an old kiln and the ash country around it: fired clay, cream ceramic plates, iron, brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Staging: flat 2D, like a stage set: no perspective, no vanishing point, the camera straight at the back wall at eye level, no side walls. The back wall meets the floor at y 524; the floor band below it (y 536–690) is where people walk, always the same size. Furniture stands against the back wall on the floor line or hangs on the wall above it.
Light: paint the room evenly lit. Show the light sources named above as things in the room (lamps, fire, a lit doorway), with only soft ambient shading (darker under furniture, in the corners and high up). The game adds the glow, the flicker and the colour of the light.
File: art/inbox/room-workshop.png, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
Layout to follow: art/spec/workshop.jpg.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/spec/workshop.jpg` (the layout to follow)

## Then

`npm run art:import`, look at `art/inbox/preview/room-workshop.png`, `npm run art:check`.
