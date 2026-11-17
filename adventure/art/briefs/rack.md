# rack

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter ch1. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `rack` · object · **target** · final

## Description

C7 r2 charging cradle built from an old rusty iron street-lantern frame, without panes: full has an upright red-glass capsule with brass caps held by copper clips; empty has sprung clips and loose wires. Identical 40×52 frames, 36×48 ink, bottom at art (330,416), capsule centre (330,394).

## What the game does with it

look; take; use

## Placement and layers

- [Mara's Tent](room-tent.md): anchor (330,416) art px / (165,208) logical; world; Always; hasGauntlet: full -> empty.

## States, visibility and transitions

- **full** — C7 r2 charging cradle built from an old rusty iron street-lantern frame, without panes: full has an upright red-glass capsule with brass caps held by copper clips; empty has sprung clips and loose wires. Identical 40×52 frames, 36×48 ink, bottom at art (330,416), capsule centre (330,394). When: Existing full frame; placement flag conditions above determine when it is used..
- **empty** — C7 r2 charging cradle built from an old rusty iron street-lantern frame, without panes: full has an upright red-glass capsule with brass caps held by copper clips; empty has sprung clips and loose wires. Identical 40×52 frames, 36×48 ink, bottom at art (330,416), capsule centre (330,394). When: Existing empty frame; placement flag conditions above determine when it is used..

Existing file: art/src/objects/rack.png. Status: final. No new artwork is produced by reference generation.

## Asset contract

- Canvas: **40×52 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `art/inbox/rack-full.png`, `art/inbox/rack-empty.png`.

## Sources

[art/manifest.mjs · L280](../manifest.mjs#L280) · [src/chapters/ch1/rooms.ts](../../src/chapters/ch1/rooms.ts) · [src/chapters/ch1/interactions.ts](../../src/chapters/ch1/interactions.ts) · [Chapter index](INDEX-ch1.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../process/WORKFLOW.md) · [Chapter rules](RULES-ch1.md)
