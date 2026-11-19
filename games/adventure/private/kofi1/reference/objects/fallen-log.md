# Forest fallen log

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `fallen-log` · object · **target**

## Description

Heavy moss-dark trunk with a broad near side and broken end.

## What the game does with it

Look

## Placement and layers

- [Deep forest](../rooms/deep-forest.md): anchor (800,590) art px / (400,295) logical; rear; all forest phases.

## States, visibility and transitions

- **idle** — Immovable large trunk. When: Always remains; hides final bear action behind its far side..

Not the moved side limb. Never remove the whole log when the retreat lane clears.

## Asset contract

- Canvas: **330×150 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-fallen-log-idle.png`.

## Sources

[STORY.md · kofi1-scene-08](../../../../STORY.md#kofi1-scene-08) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
