# Room: Outer Door

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

## Description

Outside Ironhaven's prison at night: a small heavy door with a lantern (left) in a black stone wall with crenellations, snow on the ground and falling, the city's iron roofs faint in the distance.

## What the game does with it

- **reference** — All implemented conditional placements; each target and sprite lists its own flag conditions.

Source: [src/chapters/intro/rooms.ts · L174](../../src/chapters/intro/rooms.ts#L174)

## Fixed background

Outside Ironhaven's prison at night: a small heavy door with a lantern (left) in a black stone wall with crenellations, snow on the ground and falling, the city's iron roofs faint in the distance.

## Interactive targets — puzzle order

- **Ironhaven's walls** (walls): look. Bounds (0,0), 1280×400 art px. When: Always.

## Sprites used by targets

None.

## Separate visual-only objects and changing scenery

- [outer-lantern](outer-lantern.md) — 38×64 art px. Anchor (660,262), world; Always.

## Foreground layers

None.

## Walking space, exits and staging

Primary background: room-prison-door. Existing painting: art/src/intro/rooms/prison-door.png.

Actor target sigrid: look, read; visibility Always. Actor scale and placement are listed separately; no new actor artwork is requested.

Sprite dimensions are read from each existing atlas sourceSize, preserving transparent frame registration. The room diagram uses those dimensions rather than old manifest guesses.



- Silas: fromGuardroom: feet (180,600) art px; reference only.
- Captain Sigrid: feet (760,604) art px; reference only.

## Asset contract

1280×720 room frame. [Annotated layout](../spec/outerDoor.svg). Preserve the scoped exceptions in this room's description.

## Sources

[src/chapters/intro/rooms.ts · L174](../../src/chapters/intro/rooms.ts#L174) · [Chapter index](INDEX-intro.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [WORKFLOW.md](../../WORKFLOW.md) · [Chapter rules](RULES-intro.md)
