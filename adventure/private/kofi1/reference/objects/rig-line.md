# Hanging light line / load rope

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `rig-line` · object · **target**

## Description

Two readable strands over the high fork with the joining point near hand height.

## What the game does with it

Look; Use load rope; attach to cradle

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (855,620) art px / (427.5,310) logical; overlay; rigging and lift. Attached to target-branch-woodland-clearing-0, offset (0,430).

## States, visibility and transitions

- **light** — Fine cord over branch, no cradle load. When: After successful arrow shot..
- **haul** — Strong bark rope threaded in place of fine cord. When: Load rope hauled over with light line; recover light cord..
- **loaded** — Same strong rope taut to separate cradle. When: Attached to beam cradle; persists through lift, then retired or secured out of action at montage..

All states use one 360x470 frame and anchor; padding is intentional. Must not draw target branch, beam, cradle or actor into rope image. Lower ends avoid walking lane.

## Asset contract

- Canvas: **360×470 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-rig-line-light.png`, `kofi1-rig-line-haul.png`, `kofi1-rig-line-loaded.png`.

## Sources

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
