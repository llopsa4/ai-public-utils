# room-ashways

Status: **final** · room · chapter ch1

[Art procedure](../PIPELINE.md) · [Visual conventions](../STYLE.md) · [Rig contracts](../LAYERED-RIG.md) · [Assignments and approval](../../WORKFLOW.md)

## Description

The ashways, outside the kiln, seen flat-on: an open stone causeway under great overhead pipes at dusk, grey ash everywhere. Left edge: the arched way back into the kiln. Top left: a tangle of great pipes overhead. Left: a pressure valve on a standpipe (drawn separately as an object; leave its spot plain). In the background: an old stone bridge spanning the view on arches, and under its right end the dark passage out of Cinderfold country (right side, the way on). Drifts of ash, a few cracked flagstones, distant chimneys in the haze. The ash sweeper machine is drawn separately.

## Use and placement

In the game as the room `ashways` (ch1). Walkable region: x 0–1280, y 536–690.

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **brass pressure cell** (`pressureCell`, x 352–408, y 404–476): look at, use.
- **ash sweeper** (`sweeperDisabled`, x 580–860, y 470–610): look at. Only there at some points of the story.
- **ash sweeper** (`sweeper`, x 940–1200, y 456–596): look at, talk to, use. Only there at some points of the story.
- **ash sweeper** (`sweeperAtPipe`, x 260–520, y 456–596): look at, talk to, use. Only there at some points of the story.
- **steam valve** (`valve`, x 180–292, y 320–524): look at, open, close, use.
- **passage under the bridge** (`passage`, x 1120–1280, y 200–528): look at, go through (an exit).
- **old pipes** (`pipes`, x 0–600, y 0–200): look at, use.
- **way back to Cinderfold** (`wayBack`, x 0–60, y 240–528): look at, go through (an exit).

Drawn separately as objects (leave their spot plain in the painting, they stand there):
- `valve` standing on (236, 524).
- `sweeper` standing on (1070, 596), later moved to (390, 596).

Background people walk about the floor band here (the crowd); keep the band open.

The game hangs the room's name board around (660, 120): keep that patch of wall plain.


## Asset contract

- Runtime path: `art/src/rooms/ashways.png` (final).
- Anchor: `top-left`.
- Canvas/frame: **1280×720 art px**.
- Light sources: dusk daylight through the bridge arches; no fire.

[Layout](../spec/ashways.jpg)
