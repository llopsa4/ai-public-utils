# Cut reed bundles

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `reed-bundles` · object · **target**

## Description

Pale parallel cut reeds bound with one plain tie.

## What the game does with it

Take/use through scene resource; Load; Build

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (230,580) art px / (115,290) logical; world; cut stock.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (710,530) art px / (355,265) logical; world; on sledge. Attached to goat-sledge-riverbank-0, offset (-20,-60).
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (980,500) art px / (490,250) logical; world; at hut.

## States, visibility and transitions

- **idle** — One reusable bundle design. When: Appears after mature reeds cut; move required stock onto sledge, then hut; hide when incorporated in wall..

Resource action, not mandatory extra satchel icon. Do not leave another identical full bundle at its old location after moving the last required load.

## Asset contract

- Canvas: **110×58 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-reed-bundles-idle.png`.

## Sources

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
