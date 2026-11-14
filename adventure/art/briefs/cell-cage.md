# cell-cage

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `cell-cage` · foreground · **foreground** · final

## Description

The cell's iron cage in a gentle three-quarter view: thin close bars, a shallow roof above the window and a narrow right side; a doorway in the middle of the front (the door itself is cell-gate).

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Cell](room-cell.md): anchor (0,0) art px / (0,0) logical; foreground; Always.

## States, visibility and transitions

- **idle** — The cell's iron cage in a gentle three-quarter view: thin close bars, a shallow roof above the window and a narrow right side; a doorway in the middle of the front (the door itself is cell-gate). When: Existing idle frame; placement flag conditions above determine when it is used..

Existing file: art/src/foreground/cell-cage.png. Status: final. No new artwork is produced by reference generation.

This is a separately delivered/registered foreground overlay, not an instruction to cut a new image from the room painting.

## Asset contract

- Canvas: **1280×720 art px**. Top-left anchor; preserve dimensions and registration across states.
- Files: `art/inbox/cell-cage.png`.

## Sources

[art/manifest.mjs · L445](../manifest.mjs#L445) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [WORKFLOW.md](../../WORKFLOW.md) · [Chapter rules](RULES-intro.md)
