# Beam support wedge

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `wooden-wedge` · object · **target**

## Description

Stout triangular wooden wedge with broad struck end.

## What the game does with it

Take; Use while pole lifts beam

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (570,610) art px / (285,305) logical; world; before Take.
- [Kofi’s hut](../rooms/kofi-hut.md): anchor (800,450) art px / (400,225) logical; world; installed support. Attached to beam-sill-kofi-hut-0, offset (-100,-76).

## States, visibility and transitions

- **idle** — Single wood wedge. When: On floor until taken; hidden in inventory; show under beam after Set wedge; remains installed at ending..

Never return wedge to loose floor after rescue; beam would otherwise be unsupported. End tools-return applies to pole only; installed support stays.

## Technical

- Canvas: **42×30 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-wooden-wedge-idle.png`.

## Prompt for Codex

Stout triangular wooden wedge with broad struck end. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
