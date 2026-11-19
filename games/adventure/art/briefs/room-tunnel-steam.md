# room-tunnel-steam

Status: **placeholder** · room · chapter ch2

[Art procedure](../PIPELINE.md) · [Visual conventions](../STYLE.md) · [Rig contracts](../LAYERED-RIG.md) · [Assignments and approval](../../../WORKFLOW.md)

## Description

A steam junction in the tunnels, seen flat-on: a brick wall with a long pipe along it wrapped in a copper band (right of centre), a copper line running from that pipe down to a copper valve wheel; an iron valve wheel beside it on its own iron pipe; a round pressure gauge above the two wheels; one failing lamp (left). Right edge: the passage on, a dark opening. Left edge: the way back. The jet of steam is drawn separately.

## Use and placement

In the game as the room `tunnelSteam` (ch2). Walkable region: x 0–1280, y 536–690.

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **gauge** (`gauge2`, x 576–624, y 280–328): look at, use.
- **copper valve** (`copperValve`, x 500–564, y 372–436): look at, use, open.
- **iron valve** (`ironValve`, x 640–704, y 372–436): look at, use, open.
- **steam** (`steamJet`, x 1000–1140, y 320–600): look at, use, go through (an exit).
- **leaking pipe** (`leakPipe`, x 760–1160, y 240–312): look at, use.
- **passage** (`passage`, x 1192–1280, y 240–528): look at, go through (an exit).
- **way back** (`steamBack`, x 0–60, y 240–528): look at, go through (an exit).

Drawn separately as objects (leave their spot plain in the painting, they stand there):
- `steam` standing on (1070, 600).

The game hangs the room's name board around (880, 88): keep that patch of wall plain.


## Asset contract

- Runtime path: `art/src/ch2/rooms/tunnel-steam.png` (placeholder).
- Anchor: `top-left`.
- Canvas/frame: **1280×720 art px**.
- Light sources: one failing lamp (left top); the steam pale.

[Layout](../spec/tunnel-steam.jpg)
