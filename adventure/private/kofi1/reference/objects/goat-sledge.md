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

## Technical

- Canvas: **180×70 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-goat-sledge-empty.png`, `kofi1-goat-sledge-ready.png`.

## Prompt for Codex

Two smooth runners and a low woven bed, traces attached but no goat painted in. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
