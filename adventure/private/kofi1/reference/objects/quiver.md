# Kofi’s flat quiver

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `quiver` · object · **visual**

## Description

Flat hide quiver with ordinary wooden arrow ends, tight to the back in travel references.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (950,480) art px / (475,240) logical; world; on town rack.
- [Kofi’s hut](../rooms/kofi-hut.md): anchor (195,480) art px / (97.5,240) logical; world; on hut rack.

## States, visibility and transitions

- **idle** — Flat quiver with arrows. When: On rack until collected; hidden while attached to actor; stowed again at hut entry..

One carried quiver, never visible on rack and actor simultaneously. Ordinary arrows only.

## Asset contract

- Canvas: **46×120 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-quiver-idle.png`.

## Sources

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [STORY.md · kofi1-scene-08](../../../../STORY.md#kofi1-scene-08) · [STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
