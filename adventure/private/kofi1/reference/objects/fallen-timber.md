# Storm-fallen timber stock

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `fallen-timber` · object · **target**

## Description

Naturally fallen dry trunk sections with loose bark and a clear broken end.

## What the game does with it

Look; select sound pieces

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (200,560) art px / (100,280) logical; rear; building onwards.

## States, visibility and transitions

- **stock** — Several sound lengths available. When: Building entry..
- **used** — A shorter residual pile and scattered shavings. When: After preparing beam lift; no total bare disappearance of large natural trunk..

Timber body is separate from removable bark and prepared beam. No living tree felling puzzle.

## Technical

- Canvas: **260×130 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-fallen-timber-stock.png`, `kofi1-fallen-timber-used.png`.

## Prompt for Codex

Naturally fallen dry trunk sections with loose bark and a clear broken end. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
