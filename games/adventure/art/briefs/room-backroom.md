# room-backroom

Status: **placeholder** · room · chapter ch2

[Art procedure](../PIPELINE.md) · [Visual conventions](../STYLE.md) · [Rig contracts](../LAYERED-RIG.md) · [Assignments and approval](../../../WORKFLOW.md)

## Description

Bryn's back room, seen flat-on: left edge, the curtain back to the workshop; left, a stone hearth with a pot on the fire; a shelf of supply crates, jars and rope; centre, a wooden table with a bowl and bread, and a large hand-drawn map pinned on the wall above it (a valley marked with a cross); right, a low cot under a heavy blanket; a courier's pouch on a peg by the far door; right edge, the far door to the road ahead. Warm, plain and tidy.

## Use and placement

In the game as the room `backroom` (ch2). Walkable region: x 0–1280, y 536–690, around 1 obstacle(s).

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


## Asset contract

- Runtime path: `art/src/ch2/rooms/backroom.png` (placeholder).
- Anchor: `top-left`.
- Canvas/frame: **1280×720 art px**.
- Light sources: the hearth (left) and a lamp over the table.

[Layout](../spec/backroom.jpg)
