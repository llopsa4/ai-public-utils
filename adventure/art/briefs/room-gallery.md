# room-gallery

Status: **placeholder** · room · chapter ch1 · in the game as `art/src/rooms/gallery.png`

## What the game does with it

In the game as the room `gallery` (ch1). Mara (232 px tall) and the others walk in the floor band: x 0–1280, y 536–690, around 1 obstacle(s).

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **scratched railing** (`railNames`, x 720–812, y 412–512): look at. A secret: a small, easy-to-miss detail, not highlighted.
- **pressure gauge** (`gauge`, x 424–512, y 32–120): look at, use.
- **regulator** (`regulator`, x 320–640, y 128–508): look at, use, take, open.
- **Oren's logbook** (`logbook`, x 116–264, y 416–524): look at, take.
- **lantern** (`lantern`, x 28–96, y 280–400): look at, take.
- **way to the firing house** (`galleryStairs`, x 1172–1280, y 208–528): look at, go through (an exit).

Drawn separately as objects (leave their spot plain in the painting, they stand there):
- `socket` standing on (480, 460).
- The prop `prop-gauge-face` is drawn by the game at (468, 76); paint only what holds it.

Story characters stand at: Oren (960, 592). Keep the wall behind them uncluttered at head height.

The game hangs the room's name board around (1040, 120): keep that patch of wall plain.

Later in the story the game cools this room's colours (the kiln dies): do not paint that, paint it warm.


## Technical

- File: `art/inbox/room-gallery.png`, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 4-pixel grid and snapped to the palette.
- Layout to follow: `art/spec/gallery.jpg`.

## Prompt for Codex

```text
Draw for the game Cinderfold: The regulator gallery, high in the kiln, seen flat-on: an iron-plated walkway along great ceramic pipes. Left wall: an iron hook with a lantern hanging on it. Left: Oren's small writing desk with an open logbook and an inkpot. Centre-left: the regulator housing, a tall ceramic and iron machine where the great pipes meet, with a round ring socket in its middle (the ring itself is an object drawn separately: leave its round recess empty) and a large pressure gauge dial on top (the gauge face is a separate prop). Behind the walkway: an iron railing with names scratched into its top bar, and below it a glimpse of the drop into the dark kiln. Right edge: iron stairs going down to the firing house. Riveted iron floor plates, slightly wet.
Light sources in this place: the lantern on the left wall and the regulator ring's faint glow (centre left); the right side darker.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 4-pixel grid on import, so use big clear shapes and flat colour areas.
World: an industrial-fantasy village inside an old kiln and the ash country around it: fired clay, cream ceramic plates, iron, brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Staging: flat 2D, like a stage set: no perspective, no vanishing point, the camera straight at the back wall at eye level, no side walls. The back wall meets the floor at y 524; the floor band below it (y 536–690) is where people walk, always the same size. Furniture stands against the back wall on the floor line or hangs on the wall above it.
Light: paint the room evenly lit. Show the light sources named above as things in the room (lamps, fire, a lit doorway), with only soft ambient shading (darker under furniture, in the corners and high up). The game adds the glow, the flicker and the colour of the light.
File: art/inbox/room-gallery.png, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 4-pixel grid and snapped to the palette.
Layout to follow: art/spec/gallery.jpg.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/spec/gallery.jpg` (the layout to follow)

## Then

`npm run art:import`, look at `art/inbox/preview/room-gallery.png`, `npm run art:check`.
