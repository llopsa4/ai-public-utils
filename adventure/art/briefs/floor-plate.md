# floor-plate

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `floor-plate` · object · **target** · final

## Description

A dented tin plate with a stale crust on it, lying on the cell floor by the cot.

## What the game does with it

look; take

## Placement and layers

- [Cell](room-cell.md): anchor (346,624) art px / (173,312) logical; world; [{"notFlag":"tookPlate"}].

## States, visibility and transitions

- **idle** — A dented tin plate with a stale crust on it, lying on the cell floor by the cot. When: Existing idle frame; placement flag conditions above determine when it is used..

Existing file: art/src/intro/objects/floor-plate.png. Status: final. No new artwork is produced by reference generation.

## Technical

- Canvas: **60×24 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `art/inbox/floor-plate-idle.png`.

## Prompt for Codex

A dented tin plate with a stale crust on it, lying on the cell floor by the cot. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[art/manifest.mjs · L409](../manifest.mjs#L409) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Style attachments: [art/STYLE.md](../STYLE.md) · [art/style/palette.png](../style/palette.png) · [art/style/scale.png](../style/scale.png) · [tent-reference.png](../../tent-reference.png)
