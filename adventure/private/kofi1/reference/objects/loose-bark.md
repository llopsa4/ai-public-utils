# Loose bark strips

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `loose-bark` · object · **target**

## Description

Long curled dry bark strips lying off the fallen tree.

## What the game does with it

Use axe; Take; Twist rope

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (220,535) art px / (110,267.5) logical; world; building.

## States, visibility and transitions

- **loose** — Several intact long strips. When: Before axe preparation..
- **stripped** — Small residual flakes at stock. When: Strips taken; bulk is hidden and carried material becomes inventory resource..

Do not remove bark from living tall tree. Rope-making consumes carried strips once.

## Asset contract

- Canvas: **120×52 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-loose-bark-loose.png`, `kofi1-loose-bark-stripped.png`.

## Sources

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
