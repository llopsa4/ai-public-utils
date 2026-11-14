# Shared utility knife

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `utility-knife` · object · **target**

## Description

Small plain iron blade in worn hide sleeve, practical and unornamented.

## What the game does with it

Go hunting auto-take; Use on vine

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1140,440) art px / (570,220) logical; world; months rack.
- [Kofi’s hut](../rooms/kofi-hut.md): anchor (160,440) art px / (80,220) logical; world; hut rack.

## States, visibility and transitions

- **sheathed** — Blade in sleeve. When: Rack before travel and hut arrival..
- **bare** — Plain blade, same frame. When: Used to cut rotten vine; automatically re-sheathed afterwards..

Ordinary shared tool collected at rack, not a specialised arrowhead or new weapon card.

## Technical

- Canvas: **24×84 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-utility-knife-sheathed.png`, `kofi1-utility-knife-bare.png`.

## Prompt for Codex

Small plain iron blade in worn hide sleeve, practical and unornamented. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-08](../../../../STORY.md#kofi1-scene-08) · [STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
