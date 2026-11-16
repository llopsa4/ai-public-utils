# room-firing-house

Status: **final** · room · chapter ch1

[Art procedure](../PIPELINE.md) · [Visual conventions](../STYLE.md) · [Rig contracts](../LAYERED-RIG.md) · [Assignments and approval](../../WORKFLOW.md)

## Description

The firing house: a communal kitchen and workshop on a lower level of the kiln, seen flat-on. Left edge: an archway back to the kiln hall. High on the left wall: a long wooden rack of shoes and boots hung by their laces, dozens of pairs. Left: a big stone hearth with a fire and an iron soup pot hanging over it. A plastered stretch of wall with children's chalk drawings. High up: a small brass bell on an iron bracket; its visible clapper can be rung. In the back wall at the centre: Nell's pantry door (drawn separately as an object; leave a plain wall there). Right of centre: a wooden staircase climbing along the back wall up and to the right to a landing that leads to the regulator gallery (the stairs rise from the floor line to near the top). Right edge: the iron kiln gate in a brick arch, the way out to the ashways. Long benches and a scrubbed table along the back, crocks and baskets, warm and busy.

## Use and placement

In the game as the room `firingHouse` (ch1). Walkable region: x 0–1280, y 536–690, around 2 obstacle(s).

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **chalk marks** (`chalk`, x 320–384, y 290–338): look at. A secret: a small, easy-to-miss detail, not highlighted.
- **firing-house bell** (`sign`, x 452–520, y 88–164): look at, use. A secret: a small, easy-to-miss detail, not highlighted.
- **Nell's pantry door** (`pantryDoor`, x 608–728, y 220–524): look at, open, use.
- **soup pot** (`soup`, x 164–252, y 352–404): look at, take, use.
- **shoe racks** (`shoes`, x 68–308, y 60–280): look at, take.
- **hearth** (`hearth`, x 112–296, y 340–524): look at, use.
- **stairs to the gallery** (`stairs`, x 732–1036, y 192–524): look at, go through (an exit).
- **bread basket** (`breadBasket`, x 1032–1108, y 384–440): look at, take.
- **kiln gate** (`kilnGate`, x 1172–1280, y 192–528): look at, open, go through (an exit).
- **way to Mara's room** (`toRoom`, x 0–60, y 208–528): look at, go through (an exit).

Drawn separately as objects (leave their spot plain in the painting, they stand there):
- `pantry-door` standing on (668, 524).

Story characters stand at: Nell (500, 600); Tobi (310, 600). Keep the wall behind them uncluttered at head height.

Background people walk about the floor band here (the crowd); keep the band open.

The game hangs the room's name board around (960, 100): keep that patch of wall plain.

Later in the story the game cools this room's colours (the kiln dies): do not paint that, paint it warm.


## Asset contract

- Runtime path: `art/src/rooms/firing-house.png` (final).
- Anchor: `top-left`.
- Canvas/frame: **1280×720 art px**.
- Light sources: the hearth fire (left); the kiln gate's glow through its bars (right edge); the stair well dimmer.

[Layout](../spec/firing-house.jpg)
