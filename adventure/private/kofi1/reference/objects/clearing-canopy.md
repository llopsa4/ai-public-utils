# Tall-tree foreground canopy cut

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `clearing-canopy` · foreground · **foreground**

## Description

Near hanging leaf clusters from tall tree, crisp silhouettes with transparent gaps.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (1050,140) art px / (525,70) logical; foreground; all clearing phases.

## States, visibility and transitions

- **idle** — Edge of crown only. When: Always; keep target fork, huts and ladder tops readable..

Trunk/root structural shape is background. No duplicate canopy painted under this cut.

## Asset contract

- Canvas: **260×140 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-clearing-canopy-idle.png`.

## Sources

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [STORY.md · kofi1-scene-06](../../../../STORY.md#kofi1-scene-06) · [STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
