# Nanny’s lead rope

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `lead-rope` · object · **target**

## Description

Soft looped rope with a simple lead end.

## What the game does with it

Lead nanny after harness

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (780,530) art px / (390,265) logical; world; with Tohani and harness.

## States, visibility and transitions

- **coiled** — Loose loops. When: Before haul..
- **held** — Uncoiled segment as reference. When: Tohani hands lead to Kofi for haul; returns to Tohani after arrival..

Actor-to-actor tether is an attachment reference, not a second copy on ground. No satchel step required by script.

## Technical

- Canvas: **80×60 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-lead-rope-coiled.png`, `kofi1-lead-rope-held.png`.

## Prompt for Codex

Soft looped rope with a simple lead end. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
