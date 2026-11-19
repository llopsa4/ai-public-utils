# valve

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter ch1. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `valve` · object · **target** · final

## Description

The steam valve in the ashways: an iron standpipe rising from the ground with a big red-painted valve wheel on top and a pressure plate. closed: wheel tight; venting: wheel turned, a plume of steam bursting from the side vent.

## What the game does with it

look; open; close; use

## Placement and layers

- [The Ashways](room-ashways.md): anchor (236,524) art px / (118,262) logical; world; Always; valveVented: closed -> venting.

## States, visibility and transitions

- **closed** — The steam valve in the ashways: an iron standpipe rising from the ground with a big red-painted valve wheel on top and a pressure plate. closed: wheel tight; venting: wheel turned, a plume of steam bursting from the side vent. When: Existing closed frame; placement flag conditions above determine when it is used..
- **venting** — The steam valve in the ashways: an iron standpipe rising from the ground with a big red-painted valve wheel on top and a pressure plate. closed: wheel tight; venting: wheel turned, a plume of steam bursting from the side vent. When: Existing venting frame; placement flag conditions above determine when it is used..

Existing file: art/src/objects/valve.png. Status: final. No new artwork is produced by reference generation.

## Asset contract

- Canvas: **112×204 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `art/inbox/valve-closed.png`, `art/inbox/valve-venting.png`.

## Sources

[art/manifest.mjs · L289](../manifest.mjs#L289) · [src/chapters/ch1/rooms.ts](../../src/chapters/ch1/rooms.ts) · [src/chapters/ch1/interactions.ts](../../src/chapters/ch1/interactions.ts) · [Chapter index](INDEX-ch1.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [../WORKFLOW.md](../../../WORKFLOW.md) · [Chapter rules](RULES-ch1.md)
