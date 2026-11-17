# Room: The Firing House

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter ch1. -->

Reference for the implemented chapter; existing artwork is preserved.

## Description

The firing house: a communal kitchen and workshop on a lower level of the kiln, seen flat-on. Left edge: an archway back to the kiln hall. High on the left wall: a long wooden rack of shoes and boots hung by their laces, dozens of pairs. Left: a big stone hearth with a fire and an iron soup pot hanging over it. A plastered stretch of wall with children's chalk drawings. High up: a small brass bell on an iron bracket; its visible clapper can be rung. In the back wall at the centre: Nell's pantry door (drawn separately as an object; leave a plain wall there). Right of centre: a wooden staircase climbing along the back wall up and to the right to a landing that leads to the regulator gallery (the stairs rise from the floor line to near the top). Right edge: the iron kiln gate in a brick arch, the way out to the ashways. Long benches and a scrubbed table along the back, crocks and baskets, warm and busy.

## What the game does with it

- **reference** — All implemented conditional placements; each target and sprite lists its own flag conditions.

Source: [src/chapters/ch1/rooms.ts · L189](../../src/chapters/ch1/rooms.ts#L189)

## Fixed background

The firing house: a communal kitchen and workshop on a lower level of the kiln, seen flat-on. Left edge: an archway back to the kiln hall. High on the left wall: a long wooden rack of shoes and boots hung by their laces, dozens of pairs. Left: a big stone hearth with a fire and an iron soup pot hanging over it. A plastered stretch of wall with children's chalk drawings. High up: a small brass bell on an iron bracket; its visible clapper can be rung. In the back wall at the centre: Nell's pantry door (drawn separately as an object; leave a plain wall there). Right of centre: a wooden staircase climbing along the back wall up and to the right to a landing that leads to the regulator gallery (the stairs rise from the floor line to near the top). Right edge: the iron kiln gate in a brick arch, the way out to the ashways. Long benches and a scrubbed table along the back, crocks and baskets, warm and busy.

## Interactive targets — puzzle order

- **chalk marks** (chalk): look. Bounds (342,406), 36×56 art px. When: Always. [house-chalk](house-chalk.md).
- **firing-house bell** (sign): look, use. Bounds (482,104), 40×48 art px. When: Always. [house-bell](house-bell.md).
- **Nell's pantry door** (pantryDoor): look, open, use. Bounds (608,220), 120×304 art px. When: Always. [pantry-door](pantry-door.md).
- **soup pot** (soup): look, take, use. Bounds (178,362), 104×84 art px. When: Always. [house-soup](house-soup.md).
- **shoe racks** (shoes): look, take. Bounds (76,96), 296×176 art px. When: Always. [house-shoes](house-shoes.md).
- **hearth** (hearth): look, use. Bounds (104,324), 240×200 art px. When: Always. [house-fire](house-fire.md).
- **stairs to the gallery** (stairs): look, go. Bounds (732,192), 304×332 art px. When: Always.
- **bread basket** (breadBasket): look, take. Bounds (1036,390), 72×52 art px. When: Always. [house-bread](house-bread.md).
- **kiln gate** (kilnGate): look, open, go. Bounds (1172,192), 108×336 art px. When: Always.
- **way to Mara's room** (toRoom): look, go. Bounds (0,208), 60×320 art px. When: Always.

## Sprites used by targets

- [house-chalk](house-chalk.md) — 36×56 art px. Anchor (360,462), world; Always.
- [house-bell](house-bell.md) — 40×48 art px. Anchor (502,152), world; Always.
- [pantry-door](pantry-door.md) — 120×304 art px. Anchor (668,524), world; Always; latchFixed: stuck -> fixed.
- [house-soup](house-soup.md) — 104×84 art px. Anchor (230,446), world; Always; kilnCold: warm -> cold.
- [house-shoes](house-shoes.md) — 296×176 art px. Anchor (224,272), world; Always; kilnCold: warm -> cold.
- [house-fire](house-fire.md) — 136×52 art px. Anchor (226,502), world; Always; kilnCold: lit -> cold.
- [house-bread](house-bread.md) — 72×52 art px. Anchor (1072,442), world; Always.

## Separate visual-only objects and changing scenery

None.

## Foreground layers

None.

## Walking space, exits and staging

Primary background: room-firing-house. Existing painting: art/src/rooms/firing-house.png.

Actor target nell: look, talk, crouch, lie, stand; visibility Always. Actor scale and placement are listed separately; no new actor artwork is requested.

Actor target tobi: look, talk; visibility Always. Actor scale and placement are listed separately; no new actor artwork is requested.

Sprite dimensions are read from each existing atlas sourceSize, preserving transparent frame registration. The room diagram uses those dimensions rather than old manifest guesses.

- **stairs to the gallery** at (780,568): Target stairs; Always.
- **kiln gate** at (1232,580): Target kilnGate; Always.
- **way to Mara's room** at (48,580): Target toRoom; Always.

- speaker.mara: fromMaraRoom: feet (80,592) art px; reference only.
- speaker.mara: fromGallery: feet (900,584) art px; reference only.
- speaker.mara: fromAshways: feet (1200,592) art px; reference only.
- Nell: feet (500,600) art px; reference only.
- Tobi: feet (310,600) art px; reference only.

## Asset contract

1280×720 room frame. [Annotated layout](../spec/firingHouse.svg). Preserve the scoped exceptions in this room's description.

## Sources

[src/chapters/ch1/rooms.ts · L189](../../src/chapters/ch1/rooms.ts#L189) · [Chapter index](INDEX-ch1.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [WORKFLOW.md](../../WORKFLOW.md) · [Chapter rules](RULES-ch1.md)
