# Shared drinking-water pot

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `communal-pot` · object · **target**

## Description

Lidded soot-dark clay cooking vessel, a braided handle sleeve distinguishes it from Enali’s lost pot.

## What the game does with it

Take; Fill; Use on fire

## Placement and layers

- [Trail camp at night](../rooms/trail-camp.md): anchor (320,530) art px / (160,265) logical; world; camp beside fire.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (840,500) art px / (420,250) logical; world; communal kit.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (360,480) art px / (180,240) logical; world; filling at checked seep.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (520,530) art px / (260,265) logical; world; heating on fire. Attached to cook-fire-riverbank-0, offset (0,-80).

## States, visibility and transitions

- **empty** — Lid slightly lifted, no water surface. When: Before filling..
- **filled** — Lid seated over filled vessel. When: Filled only at checked upper source..
- **heated** — Same vessel, lid seated. When: After fire sequence; runtime steam optional, no new glow..

One pot moves between source, fire and serving station. Heating is a narrative sequence, not real-world purification instructions. After convergence remain near fire for communal use.

## Asset contract

- Canvas: **72×60 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-communal-pot-empty.png`, `kofi1-communal-pot-filled.png`, `kofi1-communal-pot-heated.png`.

## Sources

[STORY.md · kofi1-scene-03](../../../../STORY.md#kofi1-scene-03) · [STORY.md · kofi1-scene-04](../../../../STORY.md#kofi1-scene-04) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
