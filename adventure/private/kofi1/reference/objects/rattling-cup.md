# Tsalohi warning cup

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `rattling-cup` · object · **visual**

## Description

Small plain clay cup with one chipped rim.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (860,452) art px / (430,226) logical; world; evening and warning.

## States, visibility and transitions

- **idle** — Upright cup. When: Evening, then translated slightly by runtime on warning; hides with trestle..

Rattle is movement of one sprite, not painted blur or additional motion frame.

## Asset contract

- Canvas: **28×32 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-rattling-cup-idle.png`.

## Sources

[STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
