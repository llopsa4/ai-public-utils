# Dead bough catching the fire stick

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `camp-dead-bough` · object · **target**

## Description

A short forked dead bough with a clear notch for the separate loose fire stick. No people, animal, caught stick or arrow is baked into it.

## What the game does with it

Look; Use wooden blunt arrow to knock the loose stick down

## Placement and layers

- [Trail camp at night](../rooms/trail-camp.md): anchor (980,350) art px / (490,175) logical; rear; Above a clear landing patch. The fire stick is a separate removable child; leave clean background beneath both..

## States, visibility and transitions

- **idle** — Bare dead wood with the same visible notch before and after the stick falls. When: Present throughout the camp; knocking the separate stick away does not alter this sprite..

Not a living branch to cut and not the rite offering. No new actor or animal art.

## Technical

- Canvas: **164×96 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-camp-dead-bough-idle.png`.

## Prompt for Codex

A short forked dead bough with a clear notch for the separate loose fire stick. No people, animal, caught stick or arrow is baked into it. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-03](../../../../STORY.md#kofi1-scene-03) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
