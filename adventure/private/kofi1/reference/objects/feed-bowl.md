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

## Technical

- Canvas: **68×30 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-feed-bowl-empty.png`, `kofi1-feed-bowl-filled.png`, `kofi1-feed-bowl-eaten.png`.

## Prompt for Codex

Low wooden feed bowl with broad stable rim. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
