# Net binding drawcord

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `net-drawcord` · object · **target**

## Description

Coarse binding cord with a large visible loop and loose end.

## What the game does with it

Look; Loosen after support

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (840,550) art px / (420,275) logical; world; on tangled net. Attached to drying-nets-kofi-hut-0, offset (-60,-50).
- [Kofi’s hut](../rooms/kofi-hut.md): anchor (1010,560) art px / (505,280) logical; world; on folded net. Attached to drying-nets-kofi-hut-1, offset (-60,-30).

## States, visibility and transitions

- **tied** — Distinct binding loop. When: Before beam supported; visible but action refused..
- **loose** — Opened loop with unpicked end. When: After Loosen; moves with net to folded location..

One binding, not a new rope inventory item or the arrow cord.

## Technical

- Canvas: **70×56 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-net-drawcord-tied.png`, `kofi1-net-drawcord-loose.png`.

## Prompt for Codex

Coarse binding cord with a large visible loop and loose end. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
