# Lost communal axe

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `axe` · object · **target**

## Description

Plain iron chopping head on a worn wood handle, mud on one side.

## What the game does with it

Take after search; Use on reeds and loose bark

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (240,560) art px / (120,280) logical; world; revealed in trampled reeds.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1150,480) art px / (575,240) logical; world; months communal rack.

## States, visibility and transitions

- **muddy** — One edge shows above mud. When: Hidden under reed overlay until Huska searches; Take hides revealed sprite..
- **clean** — Same sound axe without mud. When: After recovery, available for reeds and bark. Stored at communal rack after building..

No axe visible before Huska search. Preserve carried axe between bank and clearing. It is not a combat weapon or special arrowhead.

## Technical

- Canvas: **84×70 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-axe-muddy.png`, `kofi1-axe-clean.png`.

## Prompt for Codex

Plain iron chopping head on a worn wood handle, mud on one side. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
