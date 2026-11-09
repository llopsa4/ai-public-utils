# room-guardroom

Status: **final** · room · chapter intro · in the game as `art/src/intro/rooms/guardroom.png`

## What the game does with it

In the game as the room `guardroom` (intro). Mara (232 px tall) and the others walk in the floor band: x 0–1280, y 536–690.

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **Clerk's hood** (`hood`, x 220–288, y 236–360): look at, take. Only there at some points of the story.
- **Tally ledger** (`ledger`, x 392–472, y 392–428): look at, take, open. Only there at some points of the story.
- **Iron grate** (`grate`, x 1120–1272, y 220–524): look at, open, go through, use (an exit).
- **Stairs down** (`downStairs`, x 0–80, y 300–524): look at, go through (an exit).
- **Stove** (`stove`, x 600–720, y 360–524): look at, use.

Story characters stand at: Benn (764, 612); Kell (940, 608). Keep the wall behind them uncluttered at head height.


## Technical

- File: `art/inbox/room-guardroom.png`, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
- Layout to follow: `art/spec/guardroom.jpg`.

## Prompt for Codex

```text
Draw for the game The Rift: Ashlands: The guardroom at the top of the prison stairs: the stairs going down at the left edge, a peg with a grey clerk's hood, a shelf with a thick red tally ledger, a black iron stove with its door glowing in the middle, the guard's desk (right of centre), and an iron grate at the right edge opening onto the snowy night.
Light sources in this place: Warm orange light from the stove (centre); cold blue night through the grate (right).
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: the Ashlands, an industrial-fantasy land: kiln villages of fired clay and cream ceramic plates in the ash country, and Ironhaven, a hard city of iron, stone and snow; brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Staging: flat 2D, like a stage set: no perspective, no vanishing point, the camera straight at the back wall at eye level, no side walls. The back wall meets the floor at y 524; the floor band below it (y 536–690) is where people walk, always the same size. Furniture stands against the back wall on the floor line or hangs on the wall above it.
Light: paint the room evenly lit. Show the light sources named above as things in the room (lamps, fire, a lit doorway), with only soft ambient shading (darker under furniture, in the corners and high up). The game adds the glow, the flicker and the colour of the light.
File: art/inbox/room-guardroom.png, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
Layout to follow: art/spec/guardroom.jpg.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/spec/guardroom.jpg` (the layout to follow)

## Then

`npm run art:import`, look at `art/inbox/preview/room-guardroom.png`, `npm run art:check`.
