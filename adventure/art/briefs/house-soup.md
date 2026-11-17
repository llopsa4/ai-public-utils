# house-soup

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter ch1. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `house-soup` · object · **target** · final

## Description

C7 separate firing-house soup, clean transparent backing.

## What the game does with it

look; take; use

## Placement and layers

- [The Firing House](room-firing-house.md): anchor (230,446) art px / (115,223) logical; world; Always; kilnCold: warm -> cold.

## States, visibility and transitions

- **warm** — C7 separate firing-house soup, clean transparent backing. When: Existing warm frame; placement flag conditions above determine when it is used..
- **cold** — C7 separate firing-house soup, clean transparent backing. When: Existing cold frame; placement flag conditions above determine when it is used..

Existing file: art/src/objects/house-soup.png. Status: final. No new artwork is produced by reference generation.

## Asset contract

- Canvas: **104×84 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `art/inbox/house-soup-warm.png`, `art/inbox/house-soup-cold.png`.

## Sources

[art/manifest.mjs · L268](../manifest.mjs#L268) · [src/chapters/ch1/rooms.ts](../../src/chapters/ch1/rooms.ts) · [src/chapters/ch1/interactions.ts](../../src/chapters/ch1/interactions.ts) · [Chapter index](INDEX-ch1.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [WORKFLOW.md](../../WORKFLOW.md) · [Chapter rules](RULES-ch1.md)
