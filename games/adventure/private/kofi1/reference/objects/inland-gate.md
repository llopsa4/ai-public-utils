# Inland town gate

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `inland-gate` · object · **target**

## Description

Simple open timber arch, rough stone jamb at inland edge.

## What the game does with it

Look; exit when story permits

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (1196,620) art px / (598,310) logical; rear; evening through departure.

## States, visibility and transitions

- **open** — Unobstructed path inland. When: Visible throughout town sequence; remains stable until escape fade..

Stage gateway, distinct from goat gate and coop. Do not obscure right-edge exit with collapse masks.

## Asset contract

- Canvas: **130×330 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-inland-gate-open.png`.

## Sources

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
