# silas-cloak-joints

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `silas-cloak-joints` · pack · **visual** · final

## Description

The joint map: master.png with a small solid dot of a fixed colour at the centre of each joint: near and far shoulder, elbow, hip, knee and ankle.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

Inventory, character or shared reference; no freestanding room instance.

## States, visibility and transitions

- **idle** — The joint map: master.png with a small solid dot of a fixed colour at the centre of each joint: near and far shoulder, elbow, hip, knee and ankle. When: Existing idle frame; placement flag conditions above determine when it is used..

Existing file: art/src/../sources/characters/silas-cloak-layered/joints.png. Status: final. No new artwork is produced by reference generation.

On a 1024x1536 transparent canvas (or flat magenta #FF00FF), exactly the canvas, scale and position of the approved master.png (soles on y 1500).

Use exactly the colours of art/sources/characters/mara-casual-layered/joint-colours.json (copy the file beside it). Each dot about 12 px across, exactly on the joint's pivot.

## Technical

- Canvas: **1024×1536 art px**. Image tile anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `art/inbox/silas-cloak-joints.png`.

## Prompt for Codex

The joint map: master.png with a small solid dot of a fixed colour at the centre of each joint: near and far shoulder, elbow, hip, knee and ankle. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[art/manifest.mjs](../manifest.mjs) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Style attachments: [art/STYLE.md](../STYLE.md) · [art/style/palette.png](../style/palette.png) · [art/style/scale.png](../style/scale.png) · [tent-reference.png](../../tent-reference.png)
