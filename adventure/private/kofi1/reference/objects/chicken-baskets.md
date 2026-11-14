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

## Asset contract

- Canvas: **120×78 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-chicken-baskets-closed.png`, `kofi1-chicken-baskets-open.png`.

## Sources

[STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02) · [STORY.md · kofi1-scene-03](../../../../STORY.md#kofi1-scene-03) · [STORY.md · kofi1-scene-06](../../../../STORY.md#kofi1-scene-06) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
