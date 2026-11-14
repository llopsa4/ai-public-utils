# Clay bank dug face

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `clay-face` · object · **target**

## Description

Ochre bank cut with clear hand/tool grooves and fresh dark clay.

## What the game does with it

Look; collect clay to sledge

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (610,510) art px / (305,255) logical; rear; arrival and building.

## States, visibility and transitions

- **untouched** — Firm ochre bank face. When: Before clay collected..
- **dug** — Small shallow dug recess. When: After loading clay; remains cut without removing whole bank..



## Technical

- Canvas: **160×110 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-clay-face-untouched.png`, `kofi1-clay-face-dug.png`.

## Prompt for Codex

Ochre bank cut with clear hand/tool grooves and fresh dark clay. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
