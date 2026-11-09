# room-cell

Status: **placeholder** · room · chapter intro · in the game as `art/src/intro/rooms/cell.png`

## What the game does with it

In the game as the room `cell` (intro). Mara (232 px tall) and the others walk in the floor band: x 48–720, y 536–690.

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **Tin plate** (`plate`, x 316–376, y 596–624): look at, take. Only there at some points of the story.
- **Mask frame** (`frame`, x 968–1016, y 464–488): look at, take. Only there at some points of the story.
- **Duty roster** (`roster`, x 1080–1156, y 272–368): look at. Only there at some points of the story.
- **Candle** (`candle`, x 924–956, y 412–460): look at, take.
- **Guard's table** (`table`, x 872–1056, y 460–548): look at, take.
- **Barred window** (`window`, x 292–412, y 124–224): look at, use.
- **Straw cot** (`cot`, x 68–308, y 472–580): look at, use, take.
- **Weeping wall** (`wall`, x 428–580, y 236–468): look at, take, use. Only there at some points of the story.
- **Bucket** (`bucket`, x 596–660, y 532–596): look at, use, take. Only there at some points of the story.
- **Cell door** (`cellDoor`, x 732–800, y 224–684): look at, open, go through, use (an exit).
- **Stairs up** (`corridorStairs`, x 1180–1280, y 180–524): look at, go through (an exit). Only there at some points of the story.

Drawn separately as objects (leave their spot plain in the painting, they stand there):
- `floor-plate` standing on (346, 624).
- `window-plate` standing on (352, 228).

Story characters stand at: name.guard (1132, 600). Keep the wall behind them uncluttered at head height.


## Technical

- File: `art/inbox/room-cell.png`, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
- Layout to follow: `art/spec/cell.jpg`.

## Prompt for Codex

```text
Draw for the game Cinderfold: A cell in Ironhaven's prison at night, seen side-on: on Silas's side (left two thirds), a straw cot with a ragged blanket (left), a dented tin plate with a crust on the floor beside it, a small barred window high in the wall with a thread of moonlight, a weeping patch of wall where plaster flakes away, a bucket; then the iron bars with their door (centre right, at x 732-812). Beyond the bars, a stone corridor: the guard's table with a stub of candle and a cup (the mask frame lies on it, drawn separately), the duty roster pinned on the wall with a sketch of Sergeant Harrow, the guard's chair, and stone stairs going up at the far right.
Light sources in this place: Cold blue moonlight from the window (left); one warm candle pool on the table beyond the bars (right). The game darkens the room until Silas throws the moonlight across it, so paint it as seen lit.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: an industrial-fantasy village inside an old kiln and the ash country around it: fired clay, cream ceramic plates, iron, brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Staging: flat 2D, like a stage set: no perspective, no vanishing point, the camera straight at the back wall at eye level, no side walls. The back wall meets the floor at y 524; the floor band below it (y 536–690) is where people walk, always the same size. Furniture stands against the back wall on the floor line or hangs on the wall above it.
Light: paint the room evenly lit. Show the light sources named above as things in the room (lamps, fire, a lit doorway), with only soft ambient shading (darker under furniture, in the corners and high up). The game adds the glow, the flicker and the colour of the light.
File: art/inbox/room-cell.png, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
Layout to follow: art/spec/cell.jpg.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/spec/cell.jpg` (the layout to follow)

## Then

`npm run art:import`, look at `art/inbox/preview/room-cell.png`, `npm run art:check`.
