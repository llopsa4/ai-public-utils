# silas-cloak-farUpperArm

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `silas-cloak-farUpperArm` · pack · **visual** · final

## Description

Silas's the far upper arm, shoulder to elbow, cut from the approved master.png.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

Inventory, character or shared reference; no freestanding room instance.

## States, visibility and transitions

- **idle** — Silas's the far upper arm, shoulder to elbow, cut from the approved master.png. When: Existing idle frame; placement flag conditions above determine when it is used..

Existing file: art/src/../sources/characters/silas-cloak-layered/farUpperArm.png. Status: final. No new artwork is produced by reference generation.

On a 1024x1536 transparent canvas (or flat magenta #FF00FF), exactly the canvas, scale and position of the approved master.png (soles on y 1500).

Exactly where it sits in master.png (same coordinates). Layer order, back to front: farUpperArm, farForearm, farThigh, farShin, farBoot, nearThigh, nearShin, nearBoot, torso, nearUpperArm, nearForearm. Stacked in that order on a neutral background the eleven layers must reproduce master.png pixel for pixel.

Extend the piece about 25 px past each joint with a rounded end drawn as the hidden part would look (cloth folding round an elbow or knee), lying under the neighbouring layer so the stack still matches master.png exactly, and the joint never shows a gap when it bends.

The cloak belongs to the torso layer down to mid-thigh; below that, draw its lower part as separate back and front panels on the far and near thigh layers, so it swings with the stride and never hides a leg completely.

Also deliver, in the same folder, the clerk guise as mask layers over this pack (like silas-layered/mask-clerk-*): mask-clerk-hood-stand.png, mask-clerk-hood-kneel.png, mask-clerk-hood-lie.png (the hood pulled lower over the brow, the face still visible from the eyes down) and mask-clerk-ledger.png (the ledger held to the chest by the near forearm).

Match Mara's layers: art/sources/characters/mara-casual-layered/farUpperArm.png.

## Asset contract

- Canvas: **1024×1536 art px**. Image tile anchor; preserve dimensions and registration across states.
- Files: `art/inbox/silas-cloak-farUpperArm.png`.

## Sources

[art/manifest.mjs](../manifest.mjs) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [WORKFLOW.md](../../WORKFLOW.md) · [Chapter rules](RULES-intro.md)
