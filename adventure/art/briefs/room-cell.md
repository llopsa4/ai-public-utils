# room-cell

Status: **final** · room · chapter intro · in the game as `art/src/intro/rooms/cell.png`

## What the game does with it

In the game as the room `cell` (intro). Mara (232 px tall) and the others walk in the floor band: x 32–692, y 540–660.

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **Tin plate** (`plate`, x 316–376, y 600–628): look at, take. Only there at some points of the story.
- **Mask frame** (`frame`, x 968–1012, y 532–556): look at, take. Only there at some points of the story.
- **Harrow's portrait** (`roster`, x 1054–1130, y 230–330): look at. Only there at some points of the story.
- **Hooded cloak** (`cloak`, x 914–1006, y 190–414): look at, take. Only there at some points of the story.
- **Candle** (`candle`, x 932–960, y 492–560): look at, take.
- **Guard's table** (`table`, x 874–1086, y 544–654): look at, take.
- **Barred window** (`window`, x 280–400, y 124–248): look at, use.
- **Candle stub** (`stub`, x 352–384, y 224–256): look at, take. Only there at some points of the story.
- **Grey blanket** (`blanket`, x 96–304, y 472–564): look at, take, use.
- **Straw cot** (`cot`, x 50–330, y 470–584): look at, use, take.
- **Bucket** (`bucket`, x 594–662, y 510–586): look at, use, take. Only there at some points of the story.
- **Cell door** (`cellDoor`, x 720–816, y 324–668): look at, open, use. Only there at some points of the story.
- **Stairs up** (`cellStairs`, x 1108–1280, y 644–692): look at, go through (an exit).

Drawn separately as objects (leave their spot plain in the painting, they stand there):
- `floor-plate` standing on (346, 624).
- `window-plate` standing on (340, 246).
- `stairs-light` standing on (1180, 694).
- `window-stub` standing on (372, 254).
- `table-frame` standing on (990, 556).
- `cell-cloak` standing on (965, 402).
- `cell-gate` standing on (736, 668).

Story characters stand at: Benn (1140, 652). Keep the wall behind them uncluttered at head height.

Walk-behind pieces are cut from this painting: `cell-bars` (from (4, 4)), `cell-door` (from (728, 4)): paint those things in front of the floor there.


## Technical

- File: `art/inbox/room-cell.png`, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
- Layout to follow: `art/spec/cell.jpg`.

## Prompt for Codex

```text
Draw for the game The Rift: Ashlands: A cell in Ironhaven's prison at night, seen side-on: on Silas's side (left two thirds), a straw cot with a ragged blanket (left), a dented tin plate with a crust on the floor beside it, a small barred window high in the wall with a thread of moonlight, a weeping patch of wall where plaster flakes away, a bucket; then the iron bars with their door (centre right, at x 732-812). Beyond the bars, a stone corridor: the guard's table with a stub of candle and a cup (the mask frame lies on it, drawn separately), the duty roster pinned on the wall with a sketch of Sergeant Harrow, the guard's chair, and stone stairs going up at the far right.
Light sources in this place: Cold blue moonlight from the window (left); one warm candle pool on the table beyond the bars (right). The game darkens the room until Silas throws the moonlight across it, so paint it as seen lit.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: the Ashlands, an industrial-fantasy land: kiln villages of fired clay and cream ceramic plates in the ash country, and Ironhaven, a hard city of iron, stone and snow; brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
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
