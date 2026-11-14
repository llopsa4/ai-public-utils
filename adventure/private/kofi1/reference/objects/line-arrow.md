# Arrow with light cord

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `line-arrow` · object · **target**

## Description

Ordinary wooden arrow with fine cord tied behind its nock.

## What the game does with it

Combine; Use on high fork

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (1010,610) art px / (505,305) logical; world; shot landing area.

## States, visibility and transitions

- **tied** — Arrow and short trailing cord only. When: Combination appears in inventory; flight is movement/actor reference; show at landing after shot, then recover arrow while line stays over branch..

No special head. Long hanging cord is rig-line sprite, not painted into arrow image.

Introduced at camp as an everyday line carrier. The woodland-clearing shot requires the carried bow to be unfolded and returns the ordinary shaft while leaving the cord over the fork.

## Asset contract

- Canvas: **100×24 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-line-arrow-tied.png`.

## Sources

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
