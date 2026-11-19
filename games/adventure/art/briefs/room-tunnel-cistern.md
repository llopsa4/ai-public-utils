# room-tunnel-cistern

Status: **placeholder** · room · chapter ch2

[Art procedure](../PIPELINE.md) · [Visual conventions](../STYLE.md) · [Rig contracts](../LAYERED-RIG.md) · [Assignments and approval](../../../WORKFLOW.md)

## Description

An ash cistern in the tunnels, seen flat-on: near side (left) a stone floor; in the middle a dark square pit cutting across the floor, ash rising from it; far side (right) a stone ledge with grey daylight from the road beyond. Above the pit, a pulley wheel on a bracket; a counterweight chain running from it down to an iron cleat on the floor at the pit's near edge, lying against a hot steam pipe so its lower links glow dull red. The drawbridge and the nest basket are drawn separately. One lamp on the left wall. Left edge: the way back.

## Use and placement

In the game as the room `tunnelCistern` (ch2). Walkable region: x 0–652, y 536–690.

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **cleat** (`cleat`, x 536–604, y 488–532): look at, use, open.
- **chain** (`chain`, x 556–584, y 120–488): look at, use, take.
- **basket** (`basket`, x 760–844, y 152–244): look at, use, take.
- **drawbridge** (`bridge`, x 896–948, y 380–600): look at, use.
- **pit** (`pit`, x 660–960, y 524–690): look at, go through (an exit).
- **far ledge** (`farLedge`, x 964–1280, y 240–690): look at, go through (an exit).
- **way back** (`cisternBack`, x 0–60, y 240–528): look at, go through (an exit).

Drawn separately as objects (leave their spot plain in the painting, they stand there):
- `bridge` standing on (816, 600).
- `basket` standing on (800, 244).

The game hangs the room's name board around (320, 208): keep that patch of wall plain.


## Asset contract

- Runtime path: `art/src/ch2/rooms/tunnel-cistern.png` (placeholder).
- Anchor: `top-left`.
- Canvas/frame: **1280×720 art px**.
- Light sources: one lamp on the left wall; pale daylight on the far ledge (right).

[Layout](../spec/tunnel-cistern.jpg)
