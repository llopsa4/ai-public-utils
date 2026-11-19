# Dry gap beneath hearth stone

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `hearth-gap` · object · **target**

## Description

Dark narrow horizontal opening under outer stone edge, clean empty floor below.

## What the game does with it

Look; invite retrieval when arrow present

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (720,598) art px / (360,299) logical; ground; all hut phases.

## States, visibility and transitions

- **empty** — Opening with no shaft inside. When: Always behind arrow; arrow changes separately..

Gap never contains painted arrow or creature hands. Separate from firebox.

## Asset contract

- Canvas: **90×26 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-hearth-gap-empty.png`.

## Sources

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
