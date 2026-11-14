# Dedicated ground-door braces

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `door-braces` · object · **target**

## Description

Two plain stout timber bars, no metal hardware required.

## What the game does with it

Take; Use on marked doors

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1130,480) art px / (565,240) logical; world; months rack.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1000,460) art px / (500,230) logical; world; Oweli door installed. Attached to ground-door-riverbank-0, offset (0,-64).
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (745,460) art px / (372.5,230) logical; world; Saluna door installed. Attached to ground-door-riverbank-1, offset (0,-64).

## States, visibility and transitions

- **idle** — One bar drawing reused twice. When: Two available at rack; one hides per installation, one appears on each door when fitted..

Inventory may represent pair with count two; no infinite duplication. Both installations required; no visible double bar on same door.

## Technical

- Canvas: **74×20 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-door-braces-idle.png`.

## Prompt for Codex

Two plain stout timber bars, no metal hardware required. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
