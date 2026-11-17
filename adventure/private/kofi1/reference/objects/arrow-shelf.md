# Low arrow shelf

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `arrow-shelf` · object · **target**

## Description

Narrow wood ledge with no arrows painted on it.

## What the game does with it

Look; return recovered arrow

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (660,450) art px / (330,225) logical; rear; all hut phases.

## States, visibility and transitions

- **idle** — Empty shelf and two small wall pegs. When: Always; remaining arrows overlaid individually..

Low enough for emerging robot to brush it in staged action. No wall lettering.

## Asset contract

- Canvas: **140×36 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-arrow-shelf-idle.png`.

## Sources

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
