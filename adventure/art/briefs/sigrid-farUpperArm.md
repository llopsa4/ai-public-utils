# sigrid-farUpperArm

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `sigrid-farUpperArm` · pack · **visual** · requested

## Description

Captain Sigrid of Ironhaven's the far upper arm, shoulder to elbow, cut from the approved master.png.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

Inventory, character or shared reference; no freestanding room instance.

## States, visibility and transitions

- **idle** — Captain Sigrid of Ironhaven's the far upper arm, shoulder to elbow, cut from the approved master.png. When: Existing idle frame; placement flag conditions above determine when it is used..

Existing file: art/src/../sources/characters/sigrid-layered/farUpperArm.png. Status: requested. No new artwork is produced by reference generation.

On a 1024x1536 transparent canvas (or flat magenta #FF00FF), exactly the canvas, scale and position of the approved master.png (soles on y 1500).

Exactly where it sits in master.png (same coordinates). Layer order, back to front: farUpperArm, farForearm, farThigh, farShin, farBoot, nearThigh, nearShin, nearBoot, torso, nearUpperArm, nearForearm. Stacked in that order on a neutral background the eleven layers must reproduce master.png pixel for pixel.

Extend the piece about 25 px past each joint with a rounded end drawn as the hidden part would look (cloth folding round an elbow or knee), lying under the neighbouring layer so the stack still matches master.png exactly, and the joint never shows a gap when it bends.

The sword: its scabbard hangs from her belt at the left hip, hilt forward, and belongs to the torso layer: keep it clear of the legs below mid-thigh, so the legs can swing behind and in front of it. Her coat ends at mid-thigh, split at the sides: draw the legs fully separate below it.

Match Mara's layers: art/sources/characters/mara-casual-layered/farUpperArm.png.

## Technical

- Canvas: **1024×1536 art px**. Image tile anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `art/inbox/sigrid-farUpperArm.png`.

## Prompt for Codex

Captain Sigrid of Ironhaven's the far upper arm, shoulder to elbow, cut from the approved master.png. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[art/manifest.mjs](../manifest.mjs) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Style attachments: [art/STYLE.md](../STYLE.md) · [art/style/palette.png](../style/palette.png) · [art/style/scale.png](../style/scale.png) · [tent-reference.png](../../tent-reference.png)
