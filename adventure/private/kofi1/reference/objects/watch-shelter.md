# Forest boundary watch shelter

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `watch-shelter` · object · **target**

## Description

Small open-sided post with a plain thatch roof, dry place for board and seated guard.

## What the game does with it

Look

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (570,524) art px / (285,262) logical; rear; months.

## States, visibility and transitions

- **built** — Open front; no person, board or charcoal baked in. When: Months jump onward..

Separate from tree huts. Must not block sightline to right-hand forest trail.

## Technical

- Canvas: **180×210 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-watch-shelter-built.png`.

## Prompt for Codex

Small open-sided post with a plain thatch roof, dry place for board and seated guard. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
