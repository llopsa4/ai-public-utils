# Kota third-party licences

Free/open-source software and freely licensed assets only ([DESIGN.md](DESIGN.md#delivery-and-software)).
Add a row in the same change that brings anything third-party into the game.

| Library or asset | Version | Licence | Source URL | Used for |
|---|---|---|---|---|
| Phaser (`game/vendor/phaser.min.js`, licence text in `game/vendor/PHASER-LICENSE.md`) | 3.90.0 | MIT | https://phaser.io , npm package `phaser@3.90.0` | 2D rendering and scenes |
| Pillow (Python imaging library; build tool, not shipped) | 12.2.0 (installed) | HPND | https://python-pillow.org | background removal, trimming, scaling and atlas packing of sprites (`art/tools/`) |
| Reference images made by the user in Gemini (`art/refs/<hero_id>/`) | n/a | user-made with Gemini; the user holds the rights to use them in Kota (confirm Gemini terms) | n/a | reference for the hero sprites (the 3D models they were meant for are retired) |

The Three.js, GLTFLoader and Blender rows were removed on 2026-11-18 with the old 3D game (plan task A4).
