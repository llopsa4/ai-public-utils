# Inventory icon: Smooth river offering stone

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

## What the game does with it

[World object, source scenes and disappearance rules](../objects/rite-stone.md). The icon replaces the room instance while carried.

## Description

Round water-smoothed grey stone, distinct from flat shim and upright markers.

## Technical

64×64, transparent, same silhouette/material identity, no text or border. Draw only these carried forms:

- **kofi1-item-rite-stone**: idle: the single carried form File: `kofi1-item-rite-stone.png`.

## Prompt for Codex

Draw the named carried forms at icon scale, following the linked world brief. No installed-state, hidden-state or extra prop images. Production waits for a separate request.

## Attach / references

[STORY.md · kofi1-scene-06](../../../../STORY.md#kofi1-scene-06) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Index](../INDEX.md)
