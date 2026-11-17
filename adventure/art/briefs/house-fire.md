# house-fire

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter ch1. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `house-fire` · object · **target** · final

## Description

C7 separate firing-house fire, clean transparent backing.

## What the game does with it

look; use

## Placement and layers

- [The Firing House](room-firing-house.md): anchor (226,502) art px / (113,251) logical; world; Always; kilnCold: lit -> cold.

## States, visibility and transitions

- **lit** — C7 separate firing-house fire, clean transparent backing. When: Existing lit frame; placement flag conditions above determine when it is used..
- **cold** — C7 separate firing-house fire, clean transparent backing. When: Existing cold frame; placement flag conditions above determine when it is used..

Existing file: art/src/objects/house-fire.png. Status: final. No new artwork is produced by reference generation.

## Asset contract

- Canvas: **136×52 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `art/inbox/house-fire-lit.png`, `art/inbox/house-fire-cold.png`.

## Sources

[art/manifest.mjs · L267](../manifest.mjs#L267) · [src/chapters/ch1/rooms.ts](../../src/chapters/ch1/rooms.ts) · [src/chapters/ch1/interactions.ts](../../src/chapters/ch1/interactions.ts) · [Chapter index](INDEX-ch1.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../process/WORKFLOW.md) · [Chapter rules](RULES-ch1.md)
