# Clay washing-water pot

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `wash-pot` · object · **target**

## Description

Broad ochre water pot with open top and loop handles, visually distinct from lidded drinking pot.

## What the game does with it

Take; Fill; Use on mixing hollow

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (100,550) art px / (50,275) logical; world; building at washing point.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (675,520) art px / (337.5,260) logical; world; mixing hollow during use.

## States, visibility and transitions

- **empty** — Plain empty open mouth. When: Before refill or after mixing..
- **filled** — Dark water surface inside. When: Refilled at washing point; carried/used without cost..

Repeated refills allowed. One instance moves, never both source and carried simultaneously. Retires to wash station after hut work.

## Technical

- Canvas: **58×56 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-wash-pot-empty.png`, `kofi1-wash-pot-filled.png`.

## Prompt for Codex

Broad ochre water pot with open top and loop handles, visually distinct from lidded drinking pot. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
