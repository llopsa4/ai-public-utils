# Room: Outer Door

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

## Description

User-approved C7 r1 outer prison wall at Silas's 1px detail: city skyline, snowy crenellations, fixed heavy door and frame, clean stone backing and trampled snow. Both wall lanterns are separate overlays; no painted lanterns, brackets or glow.

## What the game does with it

- **reference** — All implemented conditional placements; each target and sprite lists its own flag conditions.

Source: [src/chapters/intro/rooms.ts · L182](../../src/chapters/intro/rooms.ts#L182)

## Fixed background

User-approved C7 r1 outer prison wall at Silas's 1px detail: city skyline, snowy crenellations, fixed heavy door and frame, clean stone backing and trampled snow. Both wall lanterns are separate overlays; no painted lanterns, brackets or glow.

## Interactive targets — puzzle order

- **Ironhaven's walls** (walls): look. Bounds (0,0), 1280×400 art px. When: Always.

## Sprites used by targets

None.

## Separate visual-only objects and changing scenery

- [outer-lantern](outer-lantern.md) — 40×44 art px. Anchor (284,260), world; Always. Anchor (660,260), world; Always.

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

[src/chapters/intro/rooms.ts · L182](../../src/chapters/intro/rooms.ts#L182) · [Chapter index](INDEX-intro.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../process/WORKFLOW.md) · [Chapter rules](RULES-intro.md)
