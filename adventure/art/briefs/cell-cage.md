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

## Technical

- Canvas: **1280×720 art px**. Top-left anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `art/inbox/cell-cage.png`.

## Prompt for Codex

The cell's iron cage in a gentle three-quarter view: thin close bars, a shallow roof above the window and a narrow right side; a doorway in the middle of the front (the door itself is cell-gate). Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[art/manifest.mjs · L439](../manifest.mjs#L439) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Style attachments: [art/STYLE.md](../STYLE.md) · [art/style/palette.png](../style/palette.png) · [art/style/scale.png](../style/scale.png) · [tent-reference.png](../../tent-reference.png)
