# Enali’s hot pot

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `tsalohi-pot` · object · **target**

## Description

Soot-dark clay pot with lid and bare loop handle.

## What the game does with it

Look; move using pot cloth

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (475,570) art px / (237.5,285) logical; world; by cook fire.
- [Tsalohi at evening](../rooms/tsalohi.md): anchor (790,450) art px / (395,225) logical; world; on trestle after errand. Attached to tsalohi-trestle-tsalohi-0, offset (40,-124).

## States, visibility and transitions

- **lidded** — Same pot and lid. When: Move, do not duplicate, from fire to trestle after cloth use. Hides with trestle at collapse..

This pot is lost. The communal pot carried by other villagers is a separate narrative vessel, described separately.

## Technical

- Canvas: **72×60 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-tsalohi-pot-lidded.png`.

## Prompt for Codex

Soot-dark clay pot with lid and bare loop handle. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
