# room-gallery

Status: **final** · room · chapter ch1

[Art procedure](../PIPELINE.md) · [Visual conventions](../STYLE.md) · [Rig contracts](../LAYERED-RIG.md) · [Assignments and approval](../../WORKFLOW.md)

## Description

The regulator gallery, high in the kiln, seen flat-on: an iron-plated walkway along great ceramic pipes. Left wall: an iron hook with a lantern hanging on it. Left: Oren's small writing desk with an open logbook and an inkpot. Centre-left: the regulator housing, a tall ceramic and iron machine where the great pipes meet, with a round ring socket in its middle (the ring itself is an object drawn separately: leave its round recess empty) and a large pressure gauge dial on top (the gauge face is a separate prop). Behind the walkway: an iron railing with names scratched into its top bar, and below it a glimpse of the drop into the dark kiln. Right edge: iron stairs going down to the firing house. Riveted iron floor plates, slightly wet.

## Use and placement

In the game as the room `gallery` (ch1). Walkable region: x 0–1280, y 536–690, around 1 obstacle(s).

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **scratched railing** (`railNames`, x 720–812, y 412–512): look at. A secret: a small, easy-to-miss detail, not highlighted.
- **pressure gauge** (`gauge`, x 432–520, y 42–130): look at, use.
- **regulator** (`regulator`, x 320–640, y 128–508): look at, use, take, open.
- **Oren's logbook** (`logbook`, x 116–264, y 416–524): look at, take.
- **lantern** (`lantern`, x 28–96, y 280–400): look at, take.
- **way to the firing house** (`galleryStairs`, x 1172–1280, y 208–528): look at, go through (an exit).

Drawn separately as objects (leave their spot plain in the painting, they stand there):
- `socket` standing on (480, 460).
- The prop `prop-gauge-face` is drawn by the game at (476, 86); paint only what holds it.

Story characters stand at: Oren (960, 592). Keep the wall behind them uncluttered at head height.

The game hangs the room's name board around (1040, 120): keep that patch of wall plain.

Later in the story the game cools this room's colours (the kiln dies): do not paint that, paint it warm.


## Asset contract

- Runtime path: `art/src/rooms/gallery.png` (final).
- Anchor: `top-left`.
- Canvas/frame: **1280×720 art px**.
- Light sources: the lantern on the left wall and the regulator ring's faint glow (centre left); the right side darker.

[Layout](../spec/gallery.jpg)
