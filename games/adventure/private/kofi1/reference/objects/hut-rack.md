# Kofi’s travel rack

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `hut-rack` · object · **visual**

## Description

Simple wall pegs and a low shelf beside doorway, empty attachment sites.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (170,524) art px / (85,262) logical; rear; all hut phases.

## States, visibility and transitions

- **idle** — Plain wood and pegs. When: Always; bow, quiver, knife and carrier attached separately..

Rack itself does not disappear when travel kit is taken in future chapters.

## Asset contract

- Canvas: **110×220 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-hut-rack-idle.png`.

## Sources

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
