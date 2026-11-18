# Kota

A free Brotato-style 2D top-down arena survivor for smartphones and tablets about Dakota culture
(Lakota and Nakota later). **Being rebuilt** (pivot of 2026-11-18, see [PLAN.md](PLAN.md)); the
sections below still describe the earlier isometric 3D slice (Dakota, woman hero, five rooms and the
boss Iya, the Camp-Eater, plus a camp) until the rebuild replaces it. Design decisions are in
[DESIGN.md](DESIGN.md), the cultural reference in [CULTURE.md](CULTURE.md); contributors start at
[AGENTS.md](AGENTS.md).

## Play

Runs entirely in the browser as static files: no server, no accounts, no tracking, no network calls.

- **Online:** `https://llopsa4.github.io/ai-public-utils/kota/` (once published).
- **Locally:** from this folder run `python -m http.server 8765 --directory game` and open
  `http://localhost:8765/`. On a phone on the same Wi-Fi open `http://<your PC's IP>:8765/`.
- **Phone or tablet:** hold the device sideways. Left thumb: floating stick. Right thumb: attack,
  dash, Volley and Track (drag from a button to aim it). **Settings** (top right) has left-handed play, sound, shake and quality.
- **Keyboard (testing):** WASD or arrows move, Space dashes, J attacks, 1 Volley, 2 Track.
- Add `?debug` to the address to expose `window.kota` for testing.

## Status and open items

The Dakota nation is being built out fully first; Lakota and Nakota come later. The user checked
Iya with a local community member and approved the small inventions in CULTURE.md *Needs review*
13-16 (2026-11-18).

## Made with free software

Three.js (MIT) renders the game; models are built from Blender (GPL) scripts in `art/models/`. All
third-party code is listed in [LICENSES.md](LICENSES.md). Stories are credited where they appear.
