# room-tunnel-mouth

Status: **placeholder** · room · chapter ch2

[Art procedure](../PIPELINE.md) · [Visual conventions](../STYLE.md) · [Rig contracts](../LAYERED-RIG.md) · [Assignments and approval](../../../process/WORKFLOW.md)

## Description

The mouth of the service tunnels at dawn, seen flat-on: left, the ash road running back towards Cinderfold under a pale pink-gold dawn sky; low ash dunes; centre, an old iron pipe lying half sunk along the ground, the right height to sit on; right, a brick arch (the entrance to service line 4) set in a low embankment, dark inside, with an iron name plate above it and a small oil lamp on a bracket beside it.

## Use and placement

In the game as the room `tunnelMouth` (ch2). Walkable region: x 0–1280, y 536–690.

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **iron plate** (`plate`, x 1016–1200, y 148–188): look at.
- **lamp** (`mouthLamp`, x 972–1000, y 260–296): look at.
- **tunnel arch** (`arch`, x 1024–1260, y 196–528): look at, go through (an exit).
- **pipe** (`pipeSeat`, x 360–700, y 476–528): look at, use.
- **dawn** (`dawn`, x 0–840, y 0–300): look at.
- **ash road** (`ashRoad`, x 0–72, y 300–528): look at, go through (an exit).

The game hangs the room's name board around (600, 92): keep that patch of wall plain.


## Asset contract

- Runtime path: `art/src/ch2/rooms/tunnel-mouth.png` (placeholder).
- Anchor: `top-left`.
- Canvas/frame: **1280×720 art px**.
- Light sources: soft dawn light from the left; the small lamp by the arch (right).

[Layout](../spec/tunnel-mouth.jpg)
