# room-firing-house

Status: **final** · room · chapter ch1 · in the game as `art/src/rooms/firing-house.png`

## What the game does with it

In the game as the room `firingHouse` (ch1). Mara (232 px tall) and the others walk in the floor band: x 0–1280, y 536–690, around 2 obstacle(s).

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **chalk marks** (`chalk`, x 320–384, y 290–338): look at. A secret: a small, easy-to-miss detail, not highlighted.
- **old wooden sign** (`sign`, x 452–520, y 88–164): look at. A secret: a small, easy-to-miss detail, not highlighted.
- **Nell's pantry door** (`pantryDoor`, x 608–728, y 220–524): look at, open, use.
- **soup pot** (`soup`, x 164–252, y 352–404): look at, take, use.
- **shoe racks** (`shoes`, x 68–308, y 60–280): look at, take.
- **hearth** (`hearth`, x 112–296, y 340–524): look at, use.
- **stairs to the gallery** (`stairs`, x 820–1132, y 192–524): look at, go through (an exit).
- **bread basket** (`breadBasket`, x 1032–1108, y 384–440): look at, take.
- **kiln gate** (`kilnGate`, x 1172–1280, y 192–528): look at, open, go through (an exit).
- **way to Mara's room** (`toRoom`, x 0–60, y 208–528): look at, go through (an exit).

Drawn separately as objects (leave their spot plain in the painting, they stand there):
- `pantry-door` standing on (668, 524).

Story characters stand at: Nell (500, 600); Tobi (310, 600). Keep the wall behind them uncluttered at head height.

Background people walk about the floor band here (the crowd); keep the band open.

The game hangs the room's name board around (960, 100): keep that patch of wall plain.

Later in the story the game cools this room's colours (the kiln dies): do not paint that, paint it warm.


## Technical

- File: `art/inbox/room-firing-house.png`, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
- Layout to follow: `art/spec/firing-house.jpg`.

## Prompt for Codex

```text
Draw for the game Cinderfold: The firing house: a communal kitchen and workshop on a lower level of the kiln, seen flat-on. Left edge: an archway back to the kiln hall. High on the left wall: a long wooden rack of shoes and boots hung by their laces, dozens of pairs. Left: a big stone hearth with a fire and an iron soup pot hanging over it. A plastered stretch of wall with children's chalk drawings. High up: a small iron sign on a bracket. In the back wall at the centre: Nell's pantry door (drawn separately as an object; leave a plain wall there). Right of centre: a wooden staircase climbing along the back wall up and to the right to a landing that leads to the regulator gallery (the stairs rise from the floor line to near the top). Right edge: the iron kiln gate in a brick arch, the way out to the ashways. Long benches and a scrubbed table along the back, crocks and baskets, warm and busy.
Light sources in this place: the hearth fire (left); the kiln gate's glow through its bars (right edge); the stair well dimmer.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: an industrial-fantasy village inside an old kiln and the ash country around it: fired clay, cream ceramic plates, iron, brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Staging: flat 2D, like a stage set: no perspective, no vanishing point, the camera straight at the back wall at eye level, no side walls. The back wall meets the floor at y 524; the floor band below it (y 536–690) is where people walk, always the same size. Furniture stands against the back wall on the floor line or hangs on the wall above it.
Light: paint the room evenly lit. Show the light sources named above as things in the room (lamps, fire, a lit doorway), with only soft ambient shading (darker under furniture, in the corners and high up). The game adds the glow, the flicker and the colour of the light.
File: art/inbox/room-firing-house.png, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
Layout to follow: art/spec/firing-house.jpg.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/spec/firing-house.jpg` (the layout to follow)

## Then

`npm run art:import`, look at `art/inbox/preview/room-firing-house.png`, `npm run art:check`.
