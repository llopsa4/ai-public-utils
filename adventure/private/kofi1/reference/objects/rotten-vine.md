# Vine tying the limb

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `rotten-vine` · object · **target**

## Description

Dry fibrous loop around dead limb, one loose end.

## What the game does with it

Look; Use utility knife

## Placement and layers

- [Deep forest](../rooms/deep-forest.md): anchor (570,650) art px / (285,325) logical; world; before move.
- [Deep forest](../rooms/deep-forest.md): anchor (685,585) art px / (342.5,292.5) logical; world; after move.

## States, visibility and transitions

- **intact** — Taut complete loop. When: Initially revealed as hotspot by limb inspection; sprite may already be visible..
- **cut** — Two short slack ends. When: After knife action; moves with limb or drops beside it, never becomes satchel reward..

Hotspot reveal is knowledge, not magical appearance; binding visible from start at sufficient scale.

## Asset contract

- Canvas: **44×60 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-rotten-vine-intact.png`, `kofi1-rotten-vine-cut.png`.

## Sources

[STORY.md · kofi1-scene-08](../../../../STORY.md#kofi1-scene-08) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
