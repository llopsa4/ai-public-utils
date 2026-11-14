# Ground-home doors

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `ground-door` · object · **target**

## Description

Simple slatted wooden door with an inside bar loop; front-on.

## What the game does with it

Look; Use brace; test with resident

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1000,524) art px / (500,262) logical; world; finished primary home.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (745,524) art px / (372.5,262) logical; world; months second home.

## States, visibility and transitions

- **unbraced** — Closed plain door with empty interior bar loops. When: Before household safety improvements..
- **open** — Door ajar toward rear, same frame. When: Occupant tests from inside; brace attachment can remain local overlay..

Two instances, for Oweli and Saluna. Their bars and braces are separate; open-state schematic interior reference shows empty hinge clearance, not a third room.

## Technical

- Canvas: **66×132 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-ground-door-unbraced.png`, `kofi1-ground-door-open.png`.

## Prompt for Codex

Simple slatted wooden door with an inside bar loop; front-on. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
