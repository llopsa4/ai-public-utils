# room-backroom

Status: **placeholder** · room · chapter ch2 · in the game as `art/src/ch2/rooms/backroom.png`

## What the game does with it

In the game as the room `backroom` (ch2). Mara (232 px tall) and the others walk in the floor band: x 0–1280, y 536–690, around 1 obstacle(s).

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **Courier's pouch** (`pouch`, x 1120–1164, y 300–360): look at, open, take.
- **Map on the wall** (`map`, x 540–760, y 180–324): look at, take.
- **Far door** (`farDoor`, x 1180–1280, y 208–528): look at, open, go through (an exit).
- **Supply shelf** (`shelf`, x 360–480, y 208–460): look at, take.
- **Hearth** (`hearth2`, x 92–316, y 280–524): look at, use.
- **Table** (`table`, x 520–820, y 424–524): look at, use, take.
- **Cot** (`cot`, x 880–1160, y 444–528): look at, use.
- **Curtain to the workshop** (`toWorkshop`, x 0–60, y 208–528): look at, go through (an exit).

Story characters stand at: Bryn (800, 600). Keep the wall behind them uncluttered at head height.

Later in the story the game cools this room's colours (the kiln dies): do not paint that, paint it warm.


## Technical

- File: `art/inbox/room-backroom.png`, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
- Layout to follow: `art/spec/backroom.jpg`.

## Prompt for Codex

```text
Draw for the game The Rift: Ashlands: Bryn's back room, seen flat-on: left edge, the curtain back to the workshop; left, a stone hearth with a pot on the fire; a shelf of supply crates, jars and rope; centre, a wooden table with a bowl and bread, and a large hand-drawn map pinned on the wall above it (a valley marked with a cross); right, a low cot under a heavy blanket; a courier's pouch on a peg by the far door; right edge, the far door to the road ahead. Warm, plain and tidy.
Light sources in this place: the hearth (left) and a lamp over the table.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: the Ashlands, an industrial-fantasy land: kiln villages of fired clay and cream ceramic plates in the ash country, and Ironhaven, a hard city of iron, stone and snow; brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Staging: flat 2D, like a stage set: no perspective, no vanishing point, the camera straight at the back wall at eye level, no side walls. The back wall meets the floor at y 524; the floor band below it (y 536–690) is where people walk, always the same size. Furniture stands against the back wall on the floor line or hangs on the wall above it.
Light: paint the room evenly lit. Show the light sources named above as things in the room (lamps, fire, a lit doorway), with only soft ambient shading (darker under furniture, in the corners and high up). The game adds the glow, the flicker and the colour of the light.
File: art/inbox/room-backroom.png, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
Layout to follow: art/spec/backroom.jpg.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/spec/backroom.jpg` (the layout to follow)

## Then

`npm run art:import`, look at `art/inbox/preview/room-backroom.png`, `npm run art:check`.
