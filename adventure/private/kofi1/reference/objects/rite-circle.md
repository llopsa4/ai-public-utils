# Founding rite circle

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `rite-circle` · object · **target**

## Description

Simple low arrangement of plain river pebbles with four clear empty spaces.

## What the game does with it

Look; place offerings

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (700,600) art px / (350,300) logical; ground; rite then months as memorial.

## States, visibility and transitions

- **prepared** — Four empty spaces at front. When: Rite begins; offerings overlaid separately..
- **settled** — Same unlit ring, slightly worn earth around it. When: After rite; stone/branch/feather remain until later storage, bell returns to belt..

No real-world ritual symbols, lettering or fixed offerings baked in. Four spaces are named by runtime labels. At months stage the old circle remains a small memory detail; offerings are stored by villagers, not duplicate satchel items.

## Technical

- Canvas: **240×90 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-rite-circle-prepared.png`, `kofi1-rite-circle-settled.png`.

## Prompt for Codex

Simple low arrangement of plain river pebbles with four clear empty spaces. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-06](../../../../STORY.md#kofi1-scene-06) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
