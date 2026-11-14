# item-frame

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `item-frame` · item · **visual** · final

## Description

Nessa's mask frame, the artifact that lets Silas be anyone: a thin articulated frame of polished brass ribs shaped like the outline of a face (brow band, cheek ribs, a hinged jaw piece), tiny riveted hinges at the temples and jaw, a few fine adjusting screws, a worn leather strap at the back. Fine craftsmanship, a little theatrical; it should look precious next to everything else in a prison satchel.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

Inventory, character or shared reference; no freestanding room instance.

## States, visibility and transitions

- **idle** — Nessa's mask frame, the artifact that lets Silas be anyone: a thin articulated frame of polished brass ribs shaped like the outline of a face (brow band, cheek ribs, a hinged jaw piece), tiny riveted hinges at the temples and jaw, a few fine adjusting screws, a worn leather strap at the back. Fine craftsmanship, a little theatrical; it should look precious next to everything else in a prison satchel. When: Existing idle frame; placement flag conditions above determine when it is used..

Existing file: art/src/intro/items/frame.png. Status: final. No new artwork is produced by reference generation.

## Technical

- Canvas: **64×64 art px**. Image tile anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `art/inbox/item-frame.png`.

## Prompt for Codex

Nessa's mask frame, the artifact that lets Silas be anyone: a thin articulated frame of polished brass ribs shaped like the outline of a face (brow band, cheek ribs, a hinged jaw piece), tiny riveted hinges at the temples and jaw, a few fine adjusting screws, a worn leather strap at the back. Fine craftsmanship, a little theatrical; it should look precious next to everything else in a prison satchel. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[art/manifest.mjs · L663](../manifest.mjs#L663) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Style attachments: [art/STYLE.md](../STYLE.md) · [art/style/palette.png](../style/palette.png) · [art/style/scale.png](../style/scale.png) · [tent-reference.png](../../tent-reference.png)
