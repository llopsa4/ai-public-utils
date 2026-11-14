# Loose hut cord

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `hut-loose-cord` · object · **visual**

## Description

Small ordinary cord coil beside net tools, no special knot.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (515,600) art px / (257.5,300) logical; world; arrival through settled.

## States, visibility and transitions

- **idle** — Loose coil. When: Always; Look only, no added crafting solution..

Script mentions loose binding cord; this is spare set dressing. Net-drawcord is the actual Loosen target. Do not allow a duplicate unsupported beam solution.

## Asset contract

- Canvas: **50×28 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-hut-loose-cord-idle.png`.

## Sources

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
