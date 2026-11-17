# Camp fire-brand branch

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `camp-branch` · object · **target**

## Description

Loose dry fire stick with one broad broken end, initially caught in the separate dead bough, then dislodged onto clean ground by a wooden blunt arrow.

## What the game does with it

Take; Use on fire; Fire brand combat reference

## Placement and layers

- [Trail camp at night](../rooms/trail-camp.md): anchor (540,610) art px / (270,305) logical; world; After the wooden blunt arrow dislodges it; hide this ground instance when collected..
- [Trail camp at night](../rooms/trail-camp.md): anchor (980,326) art px / (490,163) logical; world; Before the blunt-arrow shot; hide when the stick moves to its ground instance.. Attached to camp-dead-bough-trail-camp-0, offset (0,-24).

## States, visibility and transitions

- **unlit** — Plain dry wood. When: Caught above the empty patch at arrival; after the blunt shot, on the ground until taken. The same unlit sprite moves; no empty frame..
- **lit** — Charred tip with small flame, same canvas. When: Only after fire use; held prop during combat; retire at dawn..

Light effect runtime only. This is not the later tall-tree offering branch or bank twig.

## Asset contract

- Canvas: **86×20 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-camp-branch-unlit.png`, `kofi1-camp-branch-lit.png`.

## Sources

[STORY.md · kofi1-scene-03](../../../../STORY.md#kofi1-scene-03) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
