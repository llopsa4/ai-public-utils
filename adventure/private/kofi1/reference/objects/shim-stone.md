# Flat shimming stone

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `shim-stone` · object · **target**

## Description

A thin flat grey shore stone, distinct from rounded offering stone.

## What the game does with it

Take; Use under short foot

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (100,590) art px / (50,295) logical; world; water-a resource.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (405,500) art px / (202.5,250) logical; world; installed under trough.

## States, visibility and transitions

- **idle** — One flat stone. When: Renewable shore supply until stand level; hide loose pickup while carried and show under short foot after placement..

After installation the visible shim stays, even when trough changes state. Separate instance from marker stones and rite stone.

## Asset contract

- Canvas: **38×16 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-shim-stone-idle.png`.

## Sources

[STORY.md · kofi1-scene-04](../../../../STORY.md#kofi1-scene-04) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
