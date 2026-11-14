# guardroom-ledger

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `guardroom-ledger` · object · **target** · final

## Description

The red-brown tally ledger lying on the guardroom shelf.

## What the game does with it

look; take; open

## Placement and layers

- [Guardroom](room-guardroom.md): anchor (432,426) art px / (216,213) logical; world; [{"notFlag":"tookLedger"}].

## States, visibility and transitions

- **idle** — The red-brown tally ledger lying on the guardroom shelf. When: Existing idle frame; placement flag conditions above determine when it is used..

Existing file: art/src/intro/objects/guardroom-ledger.png. Status: final. No new artwork is produced by reference generation.

## Technical

- Canvas: **88×40 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `art/inbox/guardroom-ledger-idle.png`.

## Prompt for Codex

The red-brown tally ledger lying on the guardroom shelf. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[art/manifest.mjs · L413](../manifest.mjs#L413) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Style attachments: [art/STYLE.md](../STYLE.md) · [art/style/palette.png](../style/palette.png) · [art/style/scale.png](../style/scale.png) · [tent-reference.png](../../tent-reference.png)
