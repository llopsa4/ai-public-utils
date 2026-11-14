# Coiled bark load rope

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `load-rope` · object · **target**

## Description

Thick twisted bark fibre with broad irregular strands.

## What the game does with it

Twist; Take; Use on hanging light line

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (490,470) art px / (245,235) logical; world; made on work board.

## States, visibility and transitions

- **coiled** — Short dense coil. When: After Twist rope; take/use into rig-line. Hide coil after installing rope..

One identity becomes hanging rig-line haul variant; not retained as duplicate inventory rope.

## Technical

- Canvas: **100×50 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-load-rope-coiled.png`.

## Prompt for Codex

Thick twisted bark fibre with broad irregular strands. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
