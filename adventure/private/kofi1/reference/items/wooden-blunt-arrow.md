# Reusable wooden blunt arrow

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `wooden-blunt-arrow` · item · **target**

## Description

Inventory icon: ordinary wooden arrow with a simple round wooden head and modest fletching. No metal mechanism or later interchangeable attachment.

## What the game does with it

Look; Use on the camp’s caught dry stick with the bow unfolded

## Placement and layers

Inventory, character or shared reference; no freestanding room instance.

## States, visibility and transitions

- **idle** — Single carried form, unchanged after recovery. When: Already carried in the quiver when Kofi flees. Retained through camp and building, racked for village scenes, taken with hunting kit and left on the door rack before the robot puzzle..

The shot recovers this same arrow immediately; never draw duplicate arrows, an exhausted disposable head or an empty inventory frame. This icon is not an actor pose or combat-art request.

## Technical

- Canvas: **64×64 art px**. Image tile anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-item-wooden-blunt-arrow.png`.

## Prompt for Codex

Inventory icon: ordinary wooden arrow with a simple round wooden head and modest fletching. No metal mechanism or later interchangeable attachment. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-03](../../../../STORY.md#kofi1-scene-03) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
