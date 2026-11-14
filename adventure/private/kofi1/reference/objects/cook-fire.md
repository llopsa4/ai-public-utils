# Communal cook fire

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `cook-fire` · object · **target**

## Description

Low ring of rough stones around charred logs, empty space above for a pot.

## What the game does with it

Look; light branch; heat communal pot

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (450,610) art px / (225,305) logical; world; evening.
- [Trail camp at night](../rooms/trail-camp.md): anchor (350,610) art px / (175,305) logical; world; all camp phases.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (520,610) art px / (260,305) logical; world; arrival through months.

## States, visibility and transitions

- **banked** — Small controlled flame and embers. When: Visible in occupied camp/settlement..
- **cold** — Same stones and charcoal without flame. When: Reference variant for future lighting; hut has separate cold hearth..

Reuse appearance, not identity: Tsalohi fire is abandoned; later fires are rebuilt. Flame overlays can be runtime effects; no glow pool painted into asset. Separate pot placement never baked in.

## Technical

- Canvas: **140×90 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-cook-fire-banked.png`, `kofi1-cook-fire-cold.png`.

## Prompt for Codex

Low ring of rough stones around charred logs, empty space above for a pot. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [STORY.md · kofi1-scene-03](../../../../STORY.md#kofi1-scene-03) · [STORY.md · kofi1-scene-04](../../../../STORY.md#kofi1-scene-04) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
