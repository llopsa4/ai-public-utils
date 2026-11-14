# char-silas-harrow

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `char-silas-harrow` · character · **visual** · placeholder

## Description

Silas wearing the Harrow mask: the same body, but his face is covered by a crude moulded mask of wax-and-bread, Sergeant Harrow's face (heavy jaw, pouched eyes, a bristling broom moustache made of Silas's own hair), with brass frame rivets showing at the temples. A borrowed dark sergeant's air in the posture.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

Inventory, character or shared reference; no freestanding room instance.

## States, visibility and transitions

- **idle** — Silas wearing the Harrow mask: the same body, but his face is covered by a crude moulded mask of wax-and-bread, Sergeant Harrow's face (heavy jaw, pouched eyes, a bristling broom moustache made of Silas's own hair), with brass frame rivets showing at the temples. A borrowed dark sergeant's air in the posture. When: Existing idle frame; placement flag conditions above determine when it is used..

Existing file: art/src/intro/characters/silas-harrow.png. Status: placeholder. No new artwork is produced by reference generation.

Derived from silas-layered; do not draw this derived sheet separately.

## Technical

- Canvas: **256×256 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `art/inbox/char-silas-harrow.png`.

## Prompt for Codex

Silas wearing the Harrow mask: the same body, but his face is covered by a crude moulded mask of wax-and-bread, Sergeant Harrow's face (heavy jaw, pouched eyes, a bristling broom moustache made of Silas's own hair), with brass frame rivets showing at the temples. A borrowed dark sergeant's air in the posture. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[art/manifest.mjs · L470](../manifest.mjs#L470) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Style attachments: [art/STYLE.md](../STYLE.md) · [art/style/palette.png](../style/palette.png) · [art/style/scale.png](../style/scale.png) · [tent-reference.png](../../tent-reference.png)
