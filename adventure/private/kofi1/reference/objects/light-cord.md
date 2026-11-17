# Light arrow cord

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `light-cord` · object · **target**

## Description

Fine pale cord hank, clearly lighter than load rope.

## What the game does with it

Take; combine with ordinary arrow

## Placement and layers

- [Trail camp at night](../rooms/trail-camp.md): anchor (100,555) art px / (50,277.5) logical; world; communal kit.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (870,510) art px / (435,255) logical; world; building bundle.

## States, visibility and transitions

- **coiled** — A small hank. When: Carried between camp and bank by communal kit; Take at bank removes visible hank..
- **tied** — Short tie at arrow nock. When: Combined into line-arrow; coil hides, no simultaneous second cord..

Hanging span is rig-line asset; after hauling the load rope, light cord is recovered to storage. Not garden hinge cord.

## Asset contract

- Canvas: **80×48 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-light-cord-coiled.png`, `kofi1-light-cord-tied.png`.

## Sources

[STORY.md · kofi1-scene-03](../../../../STORY.md#kofi1-scene-03) · [STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
