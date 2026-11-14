# window-plate

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `window-plate` · object · **visual** · final

## Description

The dented tin plate wedged at the bottom of the cell's barred window, tilted to throw the moonlight into the cell, its dent shining.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Cell](room-cell.md): anchor (340,246) art px / (170,123) logical; world; [{"flag":"cellLit"}].

## States, visibility and transitions

- **idle** — The dented tin plate wedged at the bottom of the cell's barred window, tilted to throw the moonlight into the cell, its dent shining. When: Existing idle frame; placement flag conditions above determine when it is used..

Existing file: art/src/intro/objects/window-plate.png. Status: final. No new artwork is produced by reference generation.

## Technical

- Canvas: **44×28 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `art/inbox/window-plate-idle.png`.

## Prompt for Codex

The dented tin plate wedged at the bottom of the cell's barred window, tilted to throw the moonlight into the cell, its dent shining. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[art/manifest.mjs · L407](../manifest.mjs#L407) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Style attachments: [art/STYLE.md](../STYLE.md) · [art/style/palette.png](../style/palette.png) · [art/style/scale.png](../style/scale.png) · [tent-reference.png](../../tent-reference.png)
