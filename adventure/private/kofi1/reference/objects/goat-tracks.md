# Uphill goat tracks

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `goat-tracks` · object · **target**

## Description

Several paired hoof marks leading from mud toward upper bank.

## What the game does with it

Look; Follow hotspot

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (235,580) art px / (117.5,290) logical; ground; water-b.

## States, visibility and transitions

- **idle** — Readable small hoof impressions. When: Deyu route before source check; remain as scene detail after discovery..

Route A may omit tracks as unnecessary discovery cue; Deyu route must show them without waiting for a hidden dialogue flag.

## Technical

- Canvas: **170×58 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-goat-tracks-idle.png`.

## Prompt for Codex

Several paired hoof marks leading from mud toward upper bank. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-04](../../../../STORY.md#kofi1-scene-04) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
