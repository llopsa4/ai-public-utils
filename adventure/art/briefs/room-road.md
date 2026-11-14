# room-road

Status: **placeholder** · room · chapter ch2

[Art procedure](../PIPELINE.md) · [Visual conventions](../STYLE.md) · [Rig contracts](../LAYERED-RIG.md) · [Assignments and approval](../../WORKFLOW.md)

## Description

The road to Bryn's tempering house at dusk, seen flat-on: left, the ash road back towards Cinderfold with a leaning wooden signpost; great pipes and chimneys in the blue-grey haze behind; right, the stone front of the tempering house with a heavy wooden door (its frame scratched with marks), a brass bell on an iron bracket beside the door, a lit window with small panes, a chimney breathing steam, a lantern on the wall.

## Use and placement

In the game as the room `road` (ch2). Walkable region: x 0–1280, y 536–690.

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **Doorframe** (`doorframe`, x 776–800, y 220–524): look at. A secret: a small, easy-to-miss detail, not highlighted.
- **Bell** (`bell`, x 956–1000, y 240–308): look at, use.
- **Heavy door** (`door`, x 800–944, y 204–524): look at, open, use, go through (an exit).
- **Lit window** (`window`, x 1024–1176, y 280–392): look at.
- **Signpost** (`signpost`, x 160–300, y 320–524): look at.
- **Pipes in the haze** (`farPipes`, x 0–720, y 100–260): look at.
- **Road back** (`roadBack`, x 0–60, y 300–528): look at, go through (an exit).

The game hangs the room's name board around (1080, 112): keep that patch of wall plain.


## Asset contract

- Runtime path: `art/src/ch2/rooms/road.png` (placeholder).
- Anchor: `top-left`.
- Canvas/frame: **1280×720 art px**.
- Light sources: the lit window and the lantern by the door (right); blue-grey dusk from the sky (left).

[Layout](../spec/road.jpg)
