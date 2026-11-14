# cell-gate

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `cell-gate` · object · **target** · final

## Description

The cage's human-sized iron door in the middle of its front face, closed and swung outward to the left.

## What the game does with it

look; open; use

## Placement and layers

- [Cell](room-cell.md): anchor (366,676) art px / (183,338) logical; world; Always; cellOpen: closed -> open.

## States, visibility and transitions

- **closed** — The cage's human-sized iron door in the middle of its front face, closed and swung outward to the left. When: Existing closed frame; placement flag conditions above determine when it is used..
- **open** — The cage's human-sized iron door in the middle of its front face, closed and swung outward to the left. When: Existing open frame; placement flag conditions above determine when it is used..

Existing file: art/src/intro/objects/cell-gate.png. Status: final. No new artwork is produced by reference generation.

## Technical

- Canvas: **176×324 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `art/inbox/cell-gate-closed.png`, `art/inbox/cell-gate-open.png`.

## Prompt for Codex

The cage's human-sized iron door in the middle of its front face, closed and swung outward to the left. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[art/manifest.mjs · L436](../manifest.mjs#L436) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Style attachments: [art/STYLE.md](../STYLE.md) · [art/style/palette.png](../style/palette.png) · [art/style/scale.png](../style/scale.png) · [tent-reference.png](../../tent-reference.png)
