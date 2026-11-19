# Kota

A free Brotato-style 2D top-down arena survivor for smartphones and tablets about Dakota culture
(Lakota and Nakota later). It is an early build of the Phaser 3 rebuild of 2026-11-18 (see
[PLAN.md](PLAN.md)); [WORKLOG.md](WORKLOG.md) has the current state and open items. Design decisions
are in [DESIGN.md](DESIGN.md), the cultural reference in [CULTURE.md](CULTURE.md); contributors start
at [AGENTS.md](AGENTS.md).

## Play

Runs entirely in the browser as static files: no server, no accounts, no tracking, no network calls.

- **Online:** `https://llopsa4.github.io/ai-public-utils/games/kota/`.
- **Locally:** from this folder run `python -m http.server 8765 --directory game` and open
  `http://localhost:8765/`. On a phone on the same Wi-Fi, open `http://<your PC's IP>:8765/`.
- **Phone or tablet:** hold the device sideways. A floating stick on the left moves; the dash and
  ability buttons are on the right. Settings include left-handed play, sound, music, reduced shake,
  quality, hints and fullscreen.
- **Keyboard (testing):** WASD or arrows move, Space dashes, E uses the ability.
- Add `?debug` to the address to show fps and expose `window.kota` for testing.

## Status and open items

The Dakota nation is being built out first; Lakota and Nakota come later. The user checked the
Iya material with a local community member and approved the small inventions in CULTURE.md
*Needs review* 13-16 (2026-11-18). Open items are listed in [WORKLOG.md](WORKLOG.md).

## Made with free software

Phaser 3 (MIT) renders the game and is vendored in `game/vendor/`. All third-party code and assets are
listed in [LICENSES.md](LICENSES.md), and stories are credited where they appear.
