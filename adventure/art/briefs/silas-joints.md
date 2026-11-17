# silas-joints

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `silas-joints` · pack · **visual** · requested

## Description

The joint map: master.png with a small solid dot of a fixed colour at the centre of each joint: near and far shoulder, elbow, hip, knee and ankle.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

Inventory, character or shared reference; no freestanding room instance.

## States, visibility and transitions

- **idle** — The joint map: master.png with a small solid dot of a fixed colour at the centre of each joint: near and far shoulder, elbow, hip, knee and ankle. When: Existing idle frame; placement flag conditions above determine when it is used..

Existing file: art/src/../sources/characters/silas-layered/joints.png. Status: requested. No new artwork is produced by reference generation.

On a 1024x1536 transparent canvas (or flat magenta #FF00FF), exactly the canvas, scale and position of the approved master.png (soles on y 1500).

Use exactly the colours of art/sources/characters/mara-casual-layered/joint-colours.json (copy the file beside it, renamed for Silas). Each dot about 12 px across, exactly on the joint's pivot.

## Asset contract

- Canvas: **1024×1536 art px**. Image tile anchor; preserve dimensions and registration across states.
- Files: `art/inbox/silas-joints.png`.

## Sources

[art/manifest.mjs](../manifest.mjs) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../process/WORKFLOW.md) · [Chapter rules](RULES-intro.md)
