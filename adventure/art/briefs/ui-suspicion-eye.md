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

## Technical

- Canvas: **192×48 art px**. Image tile anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `art/inbox/ui-suspicion-eye.png`.

## Prompt for Codex

The suspicion eye: how close the person Silas is deceiving is to seeing through him, shown beside the satchel. Four states, left to right: calm (the eye wide open, a pale white, dark pupil); narrowing (the lids half down); narrow (a suspicious slit, the white turned warm); seeing through him (a red-rimmed slit, the white turned red). One eye, the same size and position in each state, drawn like an ink illustration on the game's dark wooden bar. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[art/manifest.mjs · L660](../manifest.mjs#L660) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Style attachments: [art/STYLE.md](../STYLE.md) · [art/style/palette.png](../style/palette.png) · [art/style/scale.png](../style/scale.png) · [tent-reference.png](../../tent-reference.png)
