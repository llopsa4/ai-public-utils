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

## Asset contract

- Canvas: **240×90 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-rite-circle-prepared.png`, `kofi1-rite-circle-settled.png`.

## Sources

[STORY.md · kofi1-scene-06](../../../../STORY.md#kofi1-scene-06) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
