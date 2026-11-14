# Kanu’s unfinished boat

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `toy-boat` · object · **visual**

## Description

Small rough carved hull, pale wood with incomplete bow.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (710,450) art px / (355,225) logical; world; evening.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1080,485) art px / (540,242.5) logical; world; months, Deyu survives only.

## States, visibility and transitions

- **unfinished** — Half-carved hull. When: Deyu shows it before collapse; lost in town..
- **finished** — A newly made replacement hull, patched seam. When: Months later only if Deyu survives; not recovered original..

The later boat is explicitly a replacement built offscreen by Deyu, not an inventory reward or resurrection cue. No later boat when Deyu dies.

## Asset contract

- Canvas: **70×32 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-toy-boat-unfinished.png`, `kofi1-toy-boat-finished.png`.

## Sources

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
