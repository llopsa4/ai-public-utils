# Tethered writing charcoal

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `charcoal-stub` · object · **target**

## Description

Short dark charcoal nub on thin cord.

## What the game does with it

Use through board action

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (635,450) art px / (317.5,225) logical; world; months. Attached to watch-board-woodland-clearing-0, offset (65,10).

## States, visibility and transitions

- **hanging** — Nub at end of tether. When: Always beside watch board; temporary hand movement when writing then returns..

No new satchel collection requirement. Cord stays anchored to same shelter post.

## Technical

- Canvas: **12×30 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-charcoal-stub-hanging.png`.

## Prompt for Codex

Short dark charcoal nub on thin cord. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
