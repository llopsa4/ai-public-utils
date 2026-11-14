# Padded nanny harness

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `goat-harness` · object · **target**

## Description

Broad soft leather breast strap with woven pad and a rear trace loop.

## What the game does with it

Look; ask Tohani to fit

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (755,530) art px / (377.5,265) logical; world; beside sledge before fitting.

## States, visibility and transitions

- **laid** — Loose folded harness. When: At sledge before Tohani agrees..
- **fitted** — Harness laid out for actor attachment reference. When: Tohani fits it to nanny for haul; remove after arrival and return to storage..

No new goat body or animation. Same canvas for loose/fitted prop, actor attachment documented only.

## Technical

- Canvas: **70×66 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-goat-harness-laid.png`, `kofi1-goat-harness-fitted.png`.

## Prompt for Codex

Broad soft leather breast strap with woven pad and a rear trace loop. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
