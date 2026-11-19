# Robot hiding stool

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `hut-stool` · object · **target**

## Description

Low three-legged wooden stool with open space beneath and broad stable feet.

## What the game does with it

Look

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (1090,610) art px / (545,305) logical; world; all hut phases.

## States, visibility and transitions

- **idle** — Empty stool, no creature. When: Always; actor may hide underneath after approach..

Draw rear legs in world layer and thin front legs as foreground cut named stool-front. Actor goes between them; same frame/anchor for both pieces.

## Asset contract

- Canvas: **100×100 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-hut-stool-idle.png`.

## Sources

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
