# Ordinary recoverable arrows

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `arrows` · object · **target**

## Description

Plain wooden shaft, small ordinary hunting point and feather fletching.

## What the game does with it

Look; Take; return to shelf; combine light cord

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (660,434) art px / (330,217) logical; world; shelf before drop and after return. Attached to arrow-shelf-kofi-hut-0, offset (0,-16).
- [Kofi’s hut](../rooms/kofi-hut.md): anchor (720,596) art px / (360,298) logical; world; under hearth edge. Attached to hearth-gap-kofi-hut-0, offset (0,-2).
- [Kofi’s hut](../rooms/kofi-hut.md): anchor (735,625) art px / (367.5,312.5) logical; world; retrieved onto floor.
- [Woodland clearing](../rooms/woodland-clearing.md): anchor (1010,610) art px / (505,305) logical; world; Bare arrow only after recovering the tied arrow; never display beside the same line-arrow instance..

## States, visibility and transitions

- **idle** — One horizontal arrow. When: Two background shelf arrows remain as separate instances; the task arrow alone moves shelf → gap → floor → inventory → shelf. Clearing arrow returns from line-arrow composition..

Define task-arrow identity separately from two reserve shelf arrows. Scene frame remains 100x16; no giant arrow. Combat arrows are abstract inventory counts, not a pile to draw per damage point.

## Asset contract

- Canvas: **100×16 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-arrows-idle.png`.

## Sources

[STORY.md · kofi1-scene-03](../../../../STORY.md#kofi1-scene-03) · [STORY.md · kofi1-scene-08](../../../../STORY.md#kofi1-scene-08) · [STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
