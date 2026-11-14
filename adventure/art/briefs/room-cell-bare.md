# room-cell-bare

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `room-cell-bare` · room · **visual** · final

## Description

The same cell painting with the cloak gone from its nail (shown once Silas takes it back); identical everywhere else.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

Inventory, character or shared reference; no freestanding room instance.

## States, visibility and transitions

- **idle** — The same cell painting with the cloak gone from its nail (shown once Silas takes it back); identical everywhere else. When: Existing idle frame; placement flag conditions above determine when it is used..

Existing file: art/src/intro/rooms/cell-bare.png. Status: final. No new artwork is produced by reference generation.

Room context: cell. This is a conditional background variant of that same room.

## Technical

- Canvas: **1280×720 art px**. Top-left anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `art/inbox/room-cell-bare.png`.

## Prompt for Codex

The same cell painting with the cloak gone from its nail (shown once Silas takes it back); identical everywhere else. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[art/manifest.mjs · L380](../manifest.mjs#L380) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Style attachments: [art/STYLE.md](../STYLE.md) · [art/style/palette.png](../style/palette.png) · [art/style/scale.png](../style/scale.png) · [tent-reference.png](../../tent-reference.png)
