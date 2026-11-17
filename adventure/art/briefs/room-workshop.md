# room-workshop

Status: **placeholder** · room · chapter ch2

[Art procedure](../PIPELINE.md) · [Visual conventions](../STYLE.md) · [Rig contracts](../LAYERED-RIG.md) · [Assignments and approval](../../../process/WORKFLOW.md)

## Description

Bryn's workshop inside the tempering house, seen flat-on: across the top, a great ceramic return pipe with a glowing flange and a small brass reading valve on it (right of centre). Left edge: a curtain to the back room. Left: her long workbench with tongs, files, a glove and a small crucible on it, a stool in front. Centre: a training rig in an iron cage, a brush drum on a sprung frame. Right of centre: a crate of coal. Right: the open side of the house, looking out over a valley at dusk. Right edge: the door out to the road. Stone floor with soot.

## Use and placement

In the game as the room `workshop` (ch2). Walkable region: x 0–1280, y 536–690, around 1 obstacle(s).

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **Old crucible** (`crucible`, x 140–200, y 336–388): look at. A secret: a small, easy-to-miss detail, not highlighted.
- **Reading valve** (`readingValve`, x 800–852, y 160–232): look at, use, open.
- **Stool** (`stool2`, x 368–436, y 464–536): look at, use.
- **Bryn's bench** (`bench`, x 72–352, y 380–524): look at, use.
- **Training cage** (`cage`, x 480–760, y 300–524): look at, use, open.
- **Coal crate** (`coal`, x 880–972, y 444–524): look at, take.
- **Curtain to the back room** (`toBackroom`, x 0–60, y 220–528): look at, go through (an exit).
- **Open side** (`view`, x 980–1200, y 80–380): look at.
- **Return pipe** (`returnPipe`, x 200–1080, y 16–136): look at, use.
- **Out to the road** (`toRoad`, x 1220–1280, y 220–528): look at, go through (an exit).

Story characters stand at: Bryn (1040, 592). Keep the wall behind them uncluttered at head height.

The game hangs the room's name board around (660, 240): keep that patch of wall plain.


## Asset contract

- Runtime path: `art/src/ch2/rooms/workshop.png` (placeholder).
- Anchor: `top-left`.
- Canvas/frame: **1280×720 art px**.
- Light sources: daylight from the open side (right); the pipe flange glowing orange.

[Layout](../spec/workshop.jpg)
