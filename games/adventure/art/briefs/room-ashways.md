# Room: The Ashways

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter ch1. -->

Reference for the implemented chapter; existing artwork is preserved.

## Description

The ashways, outside the kiln, seen flat-on: an open stone causeway under great overhead pipes at dusk, grey ash everywhere. Left edge: the arched way back into the kiln. Top left: a tangle of great pipes overhead. Left: a pressure valve on a standpipe (drawn separately as an object; leave its spot plain). In the background: an old stone bridge spanning the view on arches, and under its right end the dark passage out of Cinderfold country (right side, the way on). Drifts of ash, a few cracked flagstones, distant chimneys in the haze. The ash sweeper machine is drawn separately.

## What the game does with it

- **reference** — All implemented conditional placements; each target and sprite lists its own flag conditions.

Source: [src/chapters/ch1/rooms.ts · L287](../../src/chapters/ch1/rooms.ts#L287)

## Fixed background

The ashways, outside the kiln, seen flat-on: an open stone causeway under great overhead pipes at dusk, grey ash everywhere. Left edge: the arched way back into the kiln. Top left: a tangle of great pipes overhead. Left: a pressure valve on a standpipe (drawn separately as an object; leave its spot plain). In the background: an old stone bridge spanning the view on arches, and under its right end the dark passage out of Cinderfold country (right side, the way on). Drifts of ash, a few cracked flagstones, distant chimneys in the haze. The ash sweeper machine is drawn separately.

## Interactive targets — puzzle order

- **brass pressure cell** (pressureCell): look, use. Bounds (240,340), 56×72 art px. When: Always.
- **ash sweeper** (sweeperDisabled): look. Bounds (580,470), 280×140 art px. When: [{"flag":"ashwaysWon"}].
- **ash sweeper** (sweeper): look, talk, use. Bounds (940,456), 260×140 art px. When: [{"notFlag":"valveVented"}]. [sweeper](sweeper.md).
- **ash sweeper** (sweeperAtPipe): look, talk, use. Bounds (260,456), 260×140 art px. When: [{"flag":"valveVented"},{"notFlag":"ashwaysExploded"}]. [sweeper](sweeper.md).
- **steam valve** (valve): look, open, close, use. Bounds (180,320), 112×204 art px. When: Always. [valve](valve.md).
- **passage under the bridge** (passage): look, go. Bounds (1120,200), 160×328 art px. When: Always.
- **old pipes** (pipes): look, use. Bounds (0,0), 600×200 art px. When: Always.
- **way back to Cinderfold** (wayBack): look, go. Bounds (0,240), 60×288 art px. When: Always.

## Sprites used by targets

- [sweeper](sweeper.md) — 260×140 art px. Anchor (1070,596), world; Always.
- [valve](valve.md) — 112×204 art px. Anchor (236,524), world; Always; valveVented: closed -> venting.

## Separate visual-only objects and changing scenery

None.

## Foreground layers

None.

## Walking space, exits and staging

Primary background: room-ashways. Existing painting: art/src/rooms/ashways.png.

Sprite dimensions are read from each existing atlas sourceSize, preserving transparent frame registration. The room diagram uses those dimensions rather than old manifest guesses.

- **passage under the bridge** at (1216,584): Target passage; Always.
- **way back to Cinderfold** at (48,584): Target wayBack; Always.

- speaker.mara: fromFiringHouse: feet (120,600) art px; reference only.

## Asset contract

1280×720 room frame. [Annotated layout](../spec/ashways.svg). Preserve the scoped exceptions in this room's description.

## Sources

[src/chapters/ch1/rooms.ts · L287](../../src/chapters/ch1/rooms.ts#L287) · [Chapter index](INDEX-ch1.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [../WORKFLOW.md](../../../WORKFLOW.md) · [Chapter rules](RULES-ch1.md)
