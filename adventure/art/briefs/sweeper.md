# sweeper

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter ch1. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `sweeper` · object · **target** · final

## Description

The ash sweeper, a squat old maintenance machine (chest-high to Mara): an iron body on short legs, two round brush drums at the front, a funnel chimney, one round glass eye. idle: standing, brushes still; scurry: leaning forward, brushes spinning (motion lines as pixels).

## What the game does with it

look; talk; use

## Placement and layers

- [The Ashways](room-ashways.md): anchor (1070,596) art px / (535,298) logical; world; Always.

## States, visibility and transitions

- **idle** — The ash sweeper, a squat old maintenance machine (chest-high to Mara): an iron body on short legs, two round brush drums at the front, a funnel chimney, one round glass eye. idle: standing, brushes still; scurry: leaning forward, brushes spinning (motion lines as pixels). When: Existing idle frame; placement flag conditions above determine when it is used..
- **scurry** — The ash sweeper, a squat old maintenance machine (chest-high to Mara): an iron body on short legs, two round brush drums at the front, a funnel chimney, one round glass eye. idle: standing, brushes still; scurry: leaning forward, brushes spinning (motion lines as pixels). When: Existing scurry frame; placement flag conditions above determine when it is used..

Existing file: art/src/objects/sweeper.png. Status: final. No new artwork is produced by reference generation.

## Asset contract

- Canvas: **260×140 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `art/inbox/sweeper-idle.png`, `art/inbox/sweeper-scurry.png`.

## Sources

[art/manifest.mjs · L288](../manifest.mjs#L288) · [src/chapters/ch1/rooms.ts](../../src/chapters/ch1/rooms.ts) · [src/chapters/ch1/interactions.ts](../../src/chapters/ch1/interactions.ts) · [Chapter index](INDEX-ch1.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [WORKFLOW.md](../../WORKFLOW.md) · [Chapter rules](RULES-ch1.md)
