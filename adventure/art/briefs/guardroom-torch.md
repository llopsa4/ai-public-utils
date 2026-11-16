# guardroom-torch

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `guardroom-torch` · object · **visual** · placeholder

## Description

A wall torch: a pitch-wrapped head on a wooden haft, for the iron brackets on the guardroom walls (unlit: the game adds the flame).

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Guardroom](room-guardroom.md): anchor (82,104) art px / (41,52) logical; world; Always.
- [Guardroom](room-guardroom.md): anchor (958,102) art px / (479,51) logical; world; Always.
- [Guardroom](room-guardroom.md): anchor (821,262) art px / (410.5,131) logical; world; Always.

## States, visibility and transitions

- **idle** — A wall torch: a pitch-wrapped head on a wooden haft, for the iron brackets on the guardroom walls (unlit: the game adds the flame). When: Existing idle frame; placement flag conditions above determine when it is used..

Existing file: art/src/intro/objects/guardroom-torch.png. Status: placeholder. No new artwork is produced by reference generation.

## Asset contract

- Canvas: **14×90 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `art/inbox/guardroom-torch-idle.png`.

## Sources

[art/manifest.mjs · L443](../manifest.mjs#L443) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [WORKFLOW.md](../../WORKFLOW.md) · [Chapter rules](RULES-intro.md)
