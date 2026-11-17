# pantry-door

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter ch1. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `pantry-door` · object · **target** · final

## Description

Nell's pantry door, set in the firing house wall: a full-height plank door (taller than Mara) with iron strap hinges and an iron latch. stuck: the latch bent and jammed, a sliver of dark gap; fixed: the latch straight, the door shut properly.

## What the game does with it

look; open; use

## Placement and layers

- [The Firing House](room-firing-house.md): anchor (668,524) art px / (334,262) logical; world; Always; latchFixed: stuck -> fixed.

## States, visibility and transitions

- **stuck** — Nell's pantry door, set in the firing house wall: a full-height plank door (taller than Mara) with iron strap hinges and an iron latch. stuck: the latch bent and jammed, a sliver of dark gap; fixed: the latch straight, the door shut properly. When: Existing stuck frame; placement flag conditions above determine when it is used..
- **fixed** — Nell's pantry door, set in the firing house wall: a full-height plank door (taller than Mara) with iron strap hinges and an iron latch. stuck: the latch bent and jammed, a sliver of dark gap; fixed: the latch straight, the door shut properly. When: Existing fixed frame; placement flag conditions above determine when it is used..

Existing file: art/src/objects/pantry-door.png. Status: final. No new artwork is produced by reference generation.

## Asset contract

- Canvas: **120×304 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `art/inbox/pantry-door-stuck.png`, `art/inbox/pantry-door-fixed.png`.

## Sources

[art/manifest.mjs · L282](../manifest.mjs#L282) · [src/chapters/ch1/rooms.ts](../../src/chapters/ch1/rooms.ts) · [src/chapters/ch1/interactions.ts](../../src/chapters/ch1/interactions.ts) · [Chapter index](INDEX-ch1.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../process/WORKFLOW.md) · [Chapter rules](RULES-ch1.md)
