# Cut leafy browse

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `browse` · object · **target**

## Description

Fresh leafy bank stems, hand-sized bundle.

## What the game does with it

Take; Use on bowl; later scripted restock

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (550,550) art px / (275,275) logical; world; building source.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1050,598) art px / (525,299) logical; world; bowl.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (990,530) art px / (495,265) logical; world; months pen supply.

## States, visibility and transitions

- **idle** — Leafy bundle. When: Available from bank stems for haul; moved into bowl. Months later Tohani supplies new browse on agreed herd round..

Building browse and later new browse are separate resource instances of same design; never consume the future gate stock.

## Asset contract

- Canvas: **60×48 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-browse-idle.png`.

## Sources

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
