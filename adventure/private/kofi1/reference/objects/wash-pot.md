# Clay washing-water pot

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `wash-pot` · object · **target**

## Description

Broad ochre water pot with open top and loop handles, visually distinct from lidded drinking pot.

## What the game does with it

Take; Fill; Use on mixing hollow

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (100,550) art px / (50,275) logical; world; building at washing point.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (675,520) art px / (337.5,260) logical; world; mixing hollow during use.

## States, visibility and transitions

- **empty** — Plain empty open mouth. When: Before refill or after mixing..
- **filled** — Dark water surface inside. When: Refilled at washing point; carried/used without cost..

Repeated refills allowed. One instance moves, never both source and carried simultaneously. Retires to wash station after hut work.

## Asset contract

- Canvas: **58×56 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-wash-pot-empty.png`, `kofi1-wash-pot-filled.png`.

## Sources

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
