# Nanny’s feed bowl

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `feed-bowl` · object · **target**

## Description

Low wooden feed bowl with broad stable rim.

## What the game does with it

Look; Use browse

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1050,610) art px / (525,305) logical; world; building hut footprint.

## States, visibility and transitions

- **empty** — Inside visibly empty. When: Before browse placed..
- **filled** — Leafy browse sits inside rim. When: Browse added, attracts willing haul..
- **eaten** — A few stems remain. When: Haul complete; remove bowl to storage at time jump..

The empty bowl does not physically rattle forever; any sound is runtime feedback.

## Asset contract

- Canvas: **68×30 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-feed-bowl-empty.png`, `kofi1-feed-bowl-filled.png`, `kofi1-feed-bowl-eaten.png`.

## Sources

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
