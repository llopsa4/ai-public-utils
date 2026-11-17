# Enali’s left ledge

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `enali-ledge` · object · **visual**

## Description

Broken slab of timber floor and packed earth beneath the trestle.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (340,650) art px / (170,325) logical; ground; rescue.

## States, visibility and transitions

- **hanging** — Cracked edge with trestle supported above it. When: Both candidates present before confirmation..
- **falling** — Small separation from supporting wall. When: Deyu chosen; animate down/hide with Enali and trestle. If Enali chosen, hold until she escapes, then hide..

Never bake Enali into ledge. No corpse or injury image. Equal visual emphasis to Deyu’s ledge.

## Asset contract

- Canvas: **390×170 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-enali-ledge-hanging.png`, `kofi1-enali-ledge-falling.png`.

## Sources

[STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
