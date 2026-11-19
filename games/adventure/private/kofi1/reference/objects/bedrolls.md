# Camp sleeping mats

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `bedrolls` · object · **visual**

## Description

Rolled-out woven mats, patched hides, no sleeping figures.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Trail camp at night](../rooms/trail-camp.md): anchor (420,568) art px / (210,284) logical; world; camp.
- [Trail camp at night](../rooms/trail-camp.md): anchor (670,568) art px / (335,284) logical; world; camp.

## States, visibility and transitions

- **laid** — Two separately instantiated mats. When: Camp occupied; hide as each is rolled/packed at transition..

Same drawable reused for two mats; people and blankets covering bodies require separate excluded actor art.

## Asset contract

- Canvas: **180×48 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-bedrolls-laid.png`.

## Sources

[STORY.md · kofi1-scene-03](../../../../STORY.md#kofi1-scene-03) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
