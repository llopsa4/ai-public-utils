# Stool front-leg cut

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `stool-front` · foreground · **foreground**

## Description

Only near stool legs and near seat lip, matching hut-stool registration exactly.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (1090,610) art px / (545,305) logical; foreground; all hut phases. Attached to hut-stool-kofi-hut-0, offset (0,0).

## States, visibility and transitions

- **idle** — Transparent near-leg cut. When: Always when stool present; depth over robot hiding actor..

Counterpart hut-stool omits these exact pixels; no double outline. Not a separately movable stool.

## Asset contract

- Canvas: **100×100 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-stool-front-idle.png`.

## Sources

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
