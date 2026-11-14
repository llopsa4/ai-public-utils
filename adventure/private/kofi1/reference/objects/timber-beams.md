# Prepared lift beams

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `timber-beams` · object · **target**

## Description

Squared rough timber prepared from fallen stock, pale cut ends.

## What the game does with it

Look; load cradle; lift with helpers

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (930,565) art px / (465,282.5) logical; world; building stock.
- [Woodland clearing](../rooms/woodland-clearing.md): anchor (870,520) art px / (435,260) logical; world; loaded cradle.
- [Woodland clearing](../rooms/woodland-clearing.md): anchor (870,335) art px / (435,167.5) logical; world; raised test beam.

## States, visibility and transitions

- **idle** — One timber design. When: Two stock instances before lift; selected test beam moves into cradle and rises. Hide lifted beam after secured platform composite replaces it at montage..

Stock count remains consistent; helper actions move one beam. No beam duplicated at ground and in air.

## Asset contract

- Canvas: **160×36 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-timber-beams-idle.png`.

## Sources

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
