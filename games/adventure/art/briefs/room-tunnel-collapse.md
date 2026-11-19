# room-tunnel-collapse

Status: **placeholder** · room · chapter ch2

[Art procedure](../PIPELINE.md) · [Visual conventions](../STYLE.md) · [Rig contracts](../LAYERED-RIG.md) · [Assignments and approval](../../../WORKFLOW.md)

## Description

A collapsed service tunnel, seen flat-on: a brick vault with pipes running along the ceiling, one failing lamp hanging in the middle. Left: the roof has fallen, a slope of broken bricks and rubble filling the way back. The floor is wet stone with puddles. Right edge: the tunnel's end opening, where a rusted grate stands (drawn separately as an object; paint the dark opening behind it).

## Use and placement

In the game as the room `tunnelCollapse` (ch2). Walkable region: x 240–1280, y 536–690.

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **rag** (`rag`, x 248–308, y 540–572): look at, take. Only there at some points of the story.
- **rusted grate** (`grate`, x 1120–1268, y 300–524): look at, open, use, go through (an exit).
- **rubble** (`rubble`, x 0–240, y 220–690): look at, use, go through (an exit).
- **lamp** (`lamp1`, x 612–668, y 80–128): look at.
- **pipes** (`pipes1`, x 0–1280, y 12–80): look at, use.
- **puddles** (`puddles`, x 320–1080, y 632–690): look at.

Drawn separately as objects (leave their spot plain in the painting, they stand there):
- `rag` standing on (278, 572).
- `grate` standing on (1194, 524).

The game hangs the room's name board around (520, 88): keep that patch of wall plain.


## Asset contract

- Runtime path: `art/src/ch2/rooms/tunnel-collapse.png` (placeholder).
- Anchor: `top-left`.
- Canvas/frame: **1280×720 art px**.
- Light sources: one failing lamp (centre top); Mara carries the warm glow of his gauntlet.

[Layout](../spec/tunnel-collapse.jpg)
