# Smooth river offering stone

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `rite-stone` · object · **target**

## Description

Round water-smoothed grey stone, distinct from flat shim and upright markers.

## What the game does with it

Take; Use on river offering space

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (130,570) art px / (65,285) logical; world; rite shore source.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (620,578) art px / (310,289) logical; world; rite river space. Attached to rite-circle-riverbank-0, offset (-80,-22).

## States, visibility and transitions

- **idle** — One round shore stone. When: Take one renewable shore stone; hide pickup while carried; show in circle once placed. Retire to memorial storage at months jump..



## Asset contract

- Canvas: **40×30 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-rite-stone-idle.png`.

## Sources

[STORY.md · kofi1-scene-06](../../../../STORY.md#kofi1-scene-06) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
