# portrait-warden

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `portrait-warden` · portrait · **visual** · placeholder

## Description

Kell, the guardroom guard of Ironhaven's prison. Head and shoulders: cut by the game from the character's drawing.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

Inventory, character or shared reference; no freestanding room instance.

## States, visibility and transitions

- **idle** — Kell, the guardroom guard of Ironhaven's prison. Head and shoulders: cut by the game from the character's drawing. When: Existing idle frame; placement flag conditions above determine when it is used..

Existing file: art/src/intro/portraits/warden.png. Status: placeholder. No new artwork is produced by reference generation.

## Technical

- Canvas: **1536×256 art px**. Image tile anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `art/inbox/portrait-warden.png`.

## Prompt for Codex

Kell, the guardroom guard of Ironhaven's prison. Head and shoulders: cut by the game from the character's drawing. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[art/manifest.mjs](../manifest.mjs) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Style attachments: [art/STYLE.md](../STYLE.md) · [art/style/palette.png](../style/palette.png) · [art/style/scale.png](../style/scale.png) · [tent-reference.png](../../tent-reference.png)
