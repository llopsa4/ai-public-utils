# silas-mask-harrow-lie

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `silas-mask-harrow-lie` · pack · **visual** · requested

## Description

Silas wearing the Harrow mask: the same body, but his face is covered by a crude moulded mask of wax-and-bread, Sergeant Harrow's face (heavy jaw, pouched eyes, a bristling broom moustache made of Silas's own hair), with brass frame rivets showing at the temples. A borrowed dark sergeant's air in the posture. Only the mask itself, on its own layer: the wax-and-bread face with Harrow's heavy jaw, pouched eyes and broom moustache of Silas's hair, the brass frame's rivets at the temples; nothing else of Silas.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

Inventory, character or shared reference; no freestanding room instance.

## States, visibility and transitions

- **idle** — Silas wearing the Harrow mask: the same body, but his face is covered by a crude moulded mask of wax-and-bread, Sergeant Harrow's face (heavy jaw, pouched eyes, a bristling broom moustache made of Silas's own hair), with brass frame rivets showing at the temples. A borrowed dark sergeant's air in the posture. Only the mask itself, on its own layer: the wax-and-bread face with Harrow's heavy jaw, pouched eyes and broom moustache of Silas's hair, the brass frame's rivets at the temples; nothing else of Silas. When: Existing idle frame; placement flag conditions above determine when it is used..

Existing file: art/src/../sources/characters/silas-layered/mask-harrow-lie.png. Status: requested. No new artwork is produced by reference generation.

On the 1536x1024 canvas of lie.png, exactly over his face there.

Transparent everywhere else: the game draws it on top of Silas in this pose.

## Technical

- Canvas: **1536×1024 art px**. Image tile anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `art/inbox/silas-mask-harrow-lie.png`.

## Prompt for Codex

Silas wearing the Harrow mask: the same body, but his face is covered by a crude moulded mask of wax-and-bread, Sergeant Harrow's face (heavy jaw, pouched eyes, a bristling broom moustache made of Silas's own hair), with brass frame rivets showing at the temples. A borrowed dark sergeant's air in the posture. Only the mask itself, on its own layer: the wax-and-bread face with Harrow's heavy jaw, pouched eyes and broom moustache of Silas's hair, the brass frame's rivets at the temples; nothing else of Silas. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[art/manifest.mjs](../manifest.mjs) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Style attachments: [art/STYLE.md](../STYLE.md) · [art/style/palette.png](../style/palette.png) · [art/style/scale.png](../style/scale.png) · [tent-reference.png](../../tent-reference.png)
