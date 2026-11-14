# silas-kneel-reach

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `silas-kneel-reach` · object · **visual** · final

## Description

Silas kneeling, his near arm through the cage bars and his hand open at the floor: the body layer and the forearm layer.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

Inventory, character or shared reference; no freestanding room instance.

## States, visibility and transitions

- **behind** — Silas kneeling, his near arm through the cage bars and his hand open at the floor: the body layer and the forearm layer. When: Existing behind frame; placement flag conditions above determine when it is used..
- **arm** — Silas kneeling, his near arm through the cage bars and his hand open at the floor: the body layer and the forearm layer. When: Existing arm frame; placement flag conditions above determine when it is used..

Existing file: art/src/intro/objects/silas-kneel-reach.png. Status: final. No new artwork is produced by reference generation.

## Technical

- Canvas: **256×256 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `art/inbox/silas-kneel-reach-behind.png`, `art/inbox/silas-kneel-reach-arm.png`.

## Prompt for Codex

Silas kneeling, his near arm through the cage bars and his hand open at the floor: the body layer and the forearm layer. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[art/manifest.mjs · L423](../manifest.mjs#L423) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Style attachments: [art/STYLE.md](../STYLE.md) · [art/style/palette.png](../style/palette.png) · [art/style/scale.png](../style/scale.png) · [tent-reference.png](../../tent-reference.png)
