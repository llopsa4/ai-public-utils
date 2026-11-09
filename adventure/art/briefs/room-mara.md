# room-mara

Status: **final** · room · chapter ch1 · in the game as `art/src/rooms/mara-room.png`

## What the game does with it

In the game as the room `maraRoom` (ch1). Mara (232 px tall) and the others walk in the floor band: x 0–1280, y 536–690.

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **scratches on the pillar** (`tally`, x 16–96, y 300–440): look at. A secret: a small, easy-to-miss detail, not highlighted.
- **Mara's tent** (`toTent`, x 408–592, y 300–524): look at, go through (an exit).
- **kiln mouths** (`niche`, x 640–1000, y 240–480): look at, use.
- **pulley hoist** (`pulleys`, x 148–252, y 40–380): look at, use.
- **storage jars** (`jars`, x 280–380, y 428–524): look at, take.
- **ash cart** (`cart`, x 1008–1128, y 436–524): look at, use.
- **way to the firing house** (`roomCurtain`, x 1184–1280, y 208–528): look at, go through (an exit).

Drawn separately as objects (leave their spot plain in the painting, they stand there):
- `tent` standing on (500, 528).
- The prop `prop-pulley` is drawn by the game at (200, 120); paint only what holds it.

Background people walk about the floor band here (the crowd); keep the band open.

Walk-behind pieces are cut from this painting: `hall-left` (from (0, 616)), `hall-right` (from (1114, 628)), `hall-crate` (from (196, 622)): paint those things in front of the floor there.

The game hangs the room's name board around (300, 96): keep that patch of wall plain.

Later in the story the game cools this room's colours (the kiln dies): do not paint that, paint it warm.


## Technical

- File: `art/inbox/room-mara.png`, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
- Layout to follow: `art/spec/mara-room.jpg`.

## Prompt for Codex

```text
Draw for the game The Rift: Ashlands: The kiln hall, the heart of Cinderfold: a vast hall built inside an old brick kiln, seen flat-on. The back wall is the kiln's curved inner brickwork, soot-blackened above and warm-coloured below, rising into a vault that fades to darkness at the top. Across the middle of the back wall, a row of three great arched kiln mouths with heavy iron doors standing open, coals visible inside (the clickable 'niche'). Far left: a section of plastered wall covered in rows of tally scratches and chalk marks. Left: a pulley hoist hanging from a beam in the vault, chains and a big clay pot (the hoist itself is drawn separately as a prop; paint only the beam it hangs from). Left of centre on the floor: a cluster of tall storage jars, and Mara's canvas tent pitched on the stone floor (the tent is drawn separately as an object; leave that floor spot plain). Right: an iron ash cart on small wheels with a shovel in it. Right edge: a heavy patched curtain hung in a brick archway, the way to the firing house. Stone flags on the floor, scattered clinker and ash; in the front corners of the floor a little rubble and broken pots (they are cut out to walk behind).
Light sources in this place: the three kiln mouths across the back wall (centre), coals glowing inside; the vault dark above.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: the Ashlands, an industrial-fantasy land: kiln villages of fired clay and cream ceramic plates in the ash country, and Ironhaven, a hard city of iron, stone and snow; brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Staging: flat 2D, like a stage set: no perspective, no vanishing point, the camera straight at the back wall at eye level, no side walls. The back wall meets the floor at y 524; the floor band below it (y 536–690) is where people walk, always the same size. Furniture stands against the back wall on the floor line or hangs on the wall above it.
Light: paint the room evenly lit. Show the light sources named above as things in the room (lamps, fire, a lit doorway), with only soft ambient shading (darker under furniture, in the corners and high up). The game adds the glow, the flicker and the colour of the light.
File: art/inbox/room-mara.png, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.
Layout to follow: art/spec/mara-room.jpg.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/spec/mara-room.jpg` (the layout to follow)

## Then

`npm run art:import`, look at `art/inbox/preview/room-mara.png`, `npm run art:check`.
