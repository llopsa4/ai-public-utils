# room-mara

Status: **final** · room · chapter ch1

[Art procedure](../PIPELINE.md) · [Visual conventions](../STYLE.md) · [Rig contracts](../LAYERED-RIG.md) · [Assignments and approval](../../WORKFLOW.md)

## Description

The kiln hall, the heart of Cinderfold: a vast hall built inside an old brick kiln, seen flat-on. The back wall is the kiln's curved inner brickwork, soot-blackened above and warm-coloured below, rising into a vault that fades to darkness at the top. Across the middle of the back wall, a row of three great arched kiln mouths with heavy iron doors standing open, coals visible inside (the clickable 'niche'). Far left: a section of plastered wall covered in rows of tally scratches and chalk marks. Left: a pulley hoist hanging from a beam in the vault, chains and a big clay pot (the hoist itself is drawn separately as a prop; paint only the beam it hangs from). Left of centre on the floor: a cluster of tall storage jars, and Mara's canvas tent pitched on the stone floor (the tent is drawn separately as an object; leave that floor spot plain). Right: an iron ash cart on small wheels with a shovel in it. Right edge: a heavy patched curtain hung in a brick archway, the way to the firing house. Stone flags on the floor, scattered clinker and ash; in the front corners of the floor a little rubble and broken pots (they are cut out to walk behind).

## Use and placement

In the game as the room `maraRoom` (ch1). Walkable region: x 0–1280, y 536–690.

Everything the player can click, at these places (art pixels), each must be painted there and recognisable:
- **scratches on the pillar** (`tally`, x 16–96, y 300–440): look at. A secret: a small, easy-to-miss detail, not highlighted.
- **Mara's tent** (`toTent`, x 408–592, y 300–524): look at, go through (an exit).
- **kiln mouths** (`niche`, x 640–1000, y 240–480): look at, use.
- **pulley hoist** (`pulleys`, x 148–252, y 40–380): look at, use.
- **storage jars** (`jars`, x 280–380, y 428–524): look at, take.
- **ash cart** (`cart`, x 1008–1128, y 436–524): look at, use.
- **way to the firing house** (`roomCurtain`, x 1184–1280, y 208–528): look at, go through (an exit).

Drawn separately as objects (leave their spot plain in the painting, they stand there):
- `tent` standing on (500, 528).
- The prop `prop-pulley` is drawn by the game at (200, 120); paint only what holds it.

Background people walk about the floor band here (the crowd); keep the band open.

Walk-behind pieces are cut from this painting: `hall-left` (from (0, 616)), `hall-right` (from (1114, 628)), `hall-crate` (from (196, 622)): paint those things in front of the floor there.

The game hangs the room's name board around (300, 96): keep that patch of wall plain.

Later in the story the game cools this room's colours (the kiln dies): do not paint that, paint it warm.


## Asset contract

- Runtime path: `art/src/rooms/mara-room.png` (final).
- Anchor: `top-left`.
- Canvas/frame: **1280×720 art px**.
- Light sources: the three kiln mouths across the back wall (centre), coals glowing inside; the vault dark above.

[Layout](../spec/mara-room.jpg)
