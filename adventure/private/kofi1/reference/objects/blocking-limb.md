# Dead side limb

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `blocking-limb` · object · **target**

## Description

Dead narrow branch without leaves, broad enough to obstruct a retreat step.

## What the game does with it

Look; Pull after vine cut

## Placement and layers

- [Deep forest](../rooms/deep-forest.md): anchor (535,675) art px / (267.5,337.5) logical; world; before vine cut.
- [Deep forest](../rooms/deep-forest.md): anchor (650,610) art px / (325,305) logical; world; after moved.

## States, visibility and transitions

- **bound** — Limb lies across lane. When: Before cutting vine..
- **freed** — Same limb, detached vine ends remain separate. When: Vine cut; then translate to rear placement when pulled aside..

Move, do not delete or duplicate. Cleared lane must show underlying ground with no residual painted branch.

## Asset contract

- Canvas: **210×70 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-blocking-limb-bound.png`, `kofi1-blocking-limb-freed.png`.

## Sources

[STORY.md · kofi1-scene-08](../../../../STORY.md#kofi1-scene-08) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
