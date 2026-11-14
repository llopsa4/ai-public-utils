# Kofi’s bedroll

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `bedroll` · object · **target**

## Description

Worn hide and woven mat, one small dry corner without a pillow.

## What the game does with it

Look; Wait back; Sit back; Lie

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (390,610) art px / (195,305) logical; ground; all hut phases.

## States, visibility and transitions

- **laid** — Mat laid flat. When: Entry onward..
- **corner-clear** — Small corner folded back, clean dry patch available. When: After arrow shelved; creature settles beside it, not painted onto it..

No Kofi or robot in bedroll frame. Same frame and anchor in both states.

## Asset contract

- Canvas: **210×65 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-bedroll-laid.png`, `kofi1-bedroll-corner-clear.png`.

## Sources

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
