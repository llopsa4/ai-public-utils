# ui-suspicion-eye

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `ui-suspicion-eye` · icon · **visual** · final

## Description

The suspicion eye: how close the person Silas is deceiving is to seeing through him, shown beside the satchel. Four states, left to right: calm (the eye wide open, a pale white, dark pupil); narrowing (the lids half down); narrow (a suspicious slit, the white turned warm); seeing through him (a red-rimmed slit, the white turned red). One eye, the same size and position in each state, drawn like an ink illustration on the game's dark wooden bar.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

Inventory, character or shared reference; no freestanding room instance.

## States, visibility and transitions

- **idle** — The suspicion eye: how close the person Silas is deceiving is to seeing through him, shown beside the satchel. Four states, left to right: calm (the eye wide open, a pale white, dark pupil); narrowing (the lids half down); narrow (a suspicious slit, the white turned warm); seeing through him (a red-rimmed slit, the white turned red). One eye, the same size and position in each state, drawn like an ink illustration on the game's dark wooden bar. When: Existing idle frame; placement flag conditions above determine when it is used..

Existing file: art/src/ui/suspicion-eye.png. Status: final. No new artwork is produced by reference generation.

File: art/inbox/ui-suspicion-eye.png, a 192x48 strip of four 48x48 frames left to right (calm, narrowing, narrow, red), transparent (or flat magenta).

## Asset contract

- Canvas: **192×48 art px**. Image tile anchor; preserve dimensions and registration across states.
- Files: `art/inbox/ui-suspicion-eye.png`.

## Sources

[art/manifest.mjs · L677](../manifest.mjs#L677) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [WORKFLOW.md](../../WORKFLOW.md) · [Chapter rules](RULES-intro.md)
