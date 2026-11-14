# Tohani’s faulty gate

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `pen-gate` · object · **target**

## Description

Narrow hinged slat gate, worn pin hole visible.

## What the game does with it

Look; use cross-pin; Open by story

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (250,600) art px / (125,300) logical; world; evening and escape.

## States, visibility and transitions

- **loose** — Closed but sagging slightly. When: Before cross-pin fitted..
- **latched** — Straight closed gate. When: Cross-pin installed..
- **open** — Gate swung clear to rear, same frame extent. When: Tohani leads herd out; hides with pen at collapse..

Cross-pin is a separate overlay. Keep repaired and open positions inside one frame.

## Asset contract

- Canvas: **110×140 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-pen-gate-loose.png`, `kofi1-pen-gate-latched.png`, `kofi1-pen-gate-open.png`.

## Sources

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
