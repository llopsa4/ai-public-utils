# Hauling sledge

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `goat-sledge` · object · **target**

## Description

Two smooth runners and a low woven bed, traces attached but no goat painted in.

## What the game does with it

Look; Load; Lead with nanny; Unload

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (730,590) art px / (365,295) logical; world; loading near clay.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1000,590) art px / (500,295) logical; world; unloaded at hut.

## States, visibility and transitions

- **empty** — Bare load bed. When: Starts empty; bundles and clay separate..
- **ready** — Trace connector drawn taut, same bed. When: Harness fitted and goat ready; runtime movement to hut..

Goat, harness, lead, reeds and clay are independent. Loaded appearance is composition of these assets, not one sprite with goat. Hide source placement during movement; retire after building.

## Asset contract

- Canvas: **180×70 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-goat-sledge-empty.png`, `kofi1-goat-sledge-ready.png`.

## Sources

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
