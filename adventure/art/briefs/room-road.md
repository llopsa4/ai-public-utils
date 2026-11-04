# room-road

Status: **placeholder** · room · chapter ch2 · in the game as `art/src/ch2/rooms/road.png`

## What the game does with it

In the game as the room `road` (ch2). Mara (232 px tall) and the others walk in the floor band: x 0–1280, y 536–690.

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **Doorframe** (`doorframe`, x 776–800, y 220–524): look at. A secret: a small, easy-to-miss detail, not highlighted.
- **Bell** (`bell`, x 956–1000, y 240–308): look at, use.
- **Heavy door** (`door`, x 800–944, y 204–524): look at, open, use, go through (an exit).
- **Lit window** (`window`, x 1024–1176, y 280–392): look at.
- **Signpost** (`signpost`, x 160–300, y 320–524): look at.
- **Pipes in the haze** (`farPipes`, x 0–720, y 100–260): look at.
- **Road back** (`roadBack`, x 0–60, y 300–528): look at, go through (an exit).

The game hangs the room's name board around (1080, 112): keep that patch of wall plain.


## Technical

- File: `art/inbox/room-road.png`, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 4-pixel grid and snapped to the palette.
- Layout to follow: `art/spec/road.jpg`.

## Prompt for Codex

```text
Draw for the game Cinderfold: The road to Bryn's tempering house at dusk, seen flat-on: left, the ash road back towards Cinderfold with a leaning wooden signpost; great pipes and chimneys in the blue-grey haze behind; right, the stone front of the tempering house with a heavy wooden door (its frame scratched with marks), a brass bell on an iron bracket beside the door, a lit window with small panes, a chimney breathing steam, a lantern on the wall.
Light sources in this place: the lit window and the lantern by the door (right); blue-grey dusk from the sky (left).
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 4-pixel grid on import, so use big clear shapes and flat colour areas.
World: an industrial-fantasy village inside an old kiln and the ash country around it: fired clay, cream ceramic plates, iron, brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Staging: flat 2D, like a stage set: no perspective, no vanishing point, the camera straight at the back wall at eye level, no side walls. The back wall meets the floor at y 524; the floor band below it (y 536–690) is where people walk, always the same size. Furniture stands against the back wall on the floor line or hangs on the wall above it.
Light: paint the room evenly lit. Show the light sources named above as things in the room (lamps, fire, a lit doorway), with only soft ambient shading (darker under furniture, in the corners and high up). The game adds the glow, the flicker and the colour of the light.
File: art/inbox/room-road.png, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 4-pixel grid and snapped to the palette.
Layout to follow: art/spec/road.jpg.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/spec/road.jpg` (the layout to follow)

## Then

`npm run art:import`, look at `art/inbox/preview/room-road.png`, `npm run art:check`.
