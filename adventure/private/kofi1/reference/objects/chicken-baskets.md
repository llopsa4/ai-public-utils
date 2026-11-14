# Chicken transport baskets

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `chicken-baskets` · object · **visual**

## Description

Two snug woven carrying baskets with closable wicker lids, no animals painted in.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (1140,590) art px / (570,295) logical; world; coop escape.
- [Trail camp at night](../rooms/trail-camp.md): anchor (170,610) art px / (85,305) logical; world; arrival through dawn.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1000,595) art px / (500,297.5) logical; world; arrival through months.

## States, visibility and transitions

- **closed** — Carrying lids down; birds separate if shown. When: On ground when not carried..
- **open** — One lid raised. When: Settlement/chicken care or feather request; same frame..

Same portable basket identities move with Ahyeli; original coop is not carried. Feather is separate and no chicken count is baked into lids.

## Technical

- Canvas: **120×78 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-chicken-baskets-closed.png`, `kofi1-chicken-baskets-open.png`.

## Prompt for Codex

Two snug woven carrying baskets with closable wicker lids, no animals painted in. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02) · [STORY.md · kofi1-scene-03](../../../../STORY.md#kofi1-scene-03) · [STORY.md · kofi1-scene-06](../../../../STORY.md#kofi1-scene-06) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
