# Lost communal axe

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `axe` · object · **target**

## Description

Plain iron chopping head on a worn wood handle, mud on one side.

## What the game does with it

Take after search; Use on reeds and loose bark

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (240,560) art px / (120,280) logical; world; revealed in trampled reeds.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1150,480) art px / (575,240) logical; world; months communal rack.

## States, visibility and transitions

- **muddy** — One edge shows above mud. When: Hidden under reed overlay until Huska searches; Take hides revealed sprite..
- **clean** — Same sound axe without mud. When: After recovery, available for reeds and bark. Stored at communal rack after building..

No axe visible before Huska search. Preserve carried axe between bank and clearing. It is not a combat weapon or special arrowhead.

## Asset contract

- Canvas: **84×70 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-axe-muddy.png`, `kofi1-axe-clean.png`.

## Sources

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
