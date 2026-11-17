# Clearing work board

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `work-board` · object · **target**

## Description

Rough work surface on low supports, plain and portable-looking.

## What the game does with it

Look; Twist rope

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (490,570) art px / (245,285) logical; world; building onwards.

## States, visibility and transitions

- **idle** — Bare scored worktop. When: Always after clearing unlock; rope/cups separate overlays..

Top at art y=460, consistent with table height. Two grief cups placed on top in one brief beat, never as painted permanent decoration.

## Asset contract

- Canvas: **180×110 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-work-board-idle.png`.

## Sources

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
