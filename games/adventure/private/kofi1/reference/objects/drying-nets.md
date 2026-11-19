# Kofi’s drying nets

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `drying-nets` · object · **target**

## Description

Coarse dark fishing nets, opaque folded cloth backing only where it conceals trapped creature.

## What the game does with it

Look; loosen drawcord; pull only when supported

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (900,600) art px / (450,300) logical; world; arrival through freed.
- [Kofi’s hut](../rooms/kofi-hut.md): anchor (1070,590) art px / (535,295) logical; world; folded after rescue.

## States, visibility and transitions

- **tangled** — Taut gathered loops beneath beam; no creature body or eyes painted in. When: Entry until drawcord loosened..
- **slack** — Loops relaxed with a small opening. When: Beam supported and drawcord unpicked..
- **folded** — Net folded loosely toward right edge, same 290x260 transparent frame. When: After safe removal; translate to folded placement and leave there..

One net identity. No duplicate hanging net remains at original spot after moving. Robot eyes are actor reference masked behind net; no creature sprite commissioned.

## Asset contract

- Canvas: **290×260 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-drying-nets-tangled.png`, `kofi1-drying-nets-slack.png`, `kofi1-drying-nets-folded.png`.

## Sources

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
