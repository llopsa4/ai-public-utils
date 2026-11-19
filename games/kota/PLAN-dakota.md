> **SUPERSEDED 2026-11-18 by [PLAN.md](PLAN.md)** (Brotato-style pivot). Kept as history only.

# Dakota full build: plan (APPROVED by the user 2026-11-18; Phase A done; B1 pack written 2026-11-18, awaiting review)

Written 2026-11-18, re-evaluated by Opus the same day. The user asked to build the Dakota nation
fully before Lakota and Nakota, with **man hero + hero choice; more enemies, rooms and bosses; more
gifts, items and camp growth; polish and phone install**. Sound: effects and natural ambience made in
code, no music (user, 2026-11-18). Culture: [CULTURE.md](CULTURE.md); a little invention is allowed
in gaps and slightly exaggerated features are welcome; *Off-limits* always applies.

## How the plan saves usage

- **Grouped by model, so the model is switched only 3 times:** Sonnet (phase A) → Opus (B) →
  Sonnet (C) → Opus (D). Each phase is a few sessions; each task is one session or less.
- **One Opus design pass (B)** writes every spec, brief and text up front, so the Sonnet builders in
  phase C never need to stop for design or cultural decisions.
- **Each task names what to read and write and how it is checked.** Read only those files plus
  [WORKLOG.md](WORKLOG.md); update WORKLOG *Next action* (≤3 lines) at the end.
- **Test recipe (no extra tools):** the game server runs on port 8765 (`python -m http.server 8765
  --directory game`). Open `index.html?debug`; the automation browser renders only ~2 fps, so step
  the game with `kota.combat.update(0.05)` in a loop instead of waiting; clear `kota.*` keys from
  localStorage afterwards. Blender builds: see [art/PIPELINE.md](art/PIPELINE.md).

## Phase 0: phone check (the user, no model)

| # | Task | Done when |
|---|---|---|
| P0 | Play the current build on the phone (`http://192.168.4.92:8765/`) and report fps and touch feel | the user reports; if fps < 45 or controls feel wrong, A1 fixes it first |

## Phase A: Sonnet, engine work that needs no new design

| # | Task | Reads → writes | Done when |
|---|---|---|---|
| A1 | **Performance and settings**: settings menu (sound on/off, left-handed, reduce shake, quality: shadows and pixel ratio), saved in the browser; apply P0 findings | `main.js`, `ui/screens.js`, `index.html` | settings survive reload; low quality visibly lighter |
| A2 | **Obstacle collision** for hero and enemies (the room boxes block movement) | `main.js`, `combat/combat.js` | nobody walks through a box |
| A3 | **Door choice** (DESIGN.md core loop): after the gift, 2 doors showing the next place and its reward kind (gift helper or goods) | `run/run.js`, `run/rooms.js`, `data/rooms.json` | each door leads where it says |
| A4 | **Hit feedback**: damage numbers, short hit pause, screen shake (respects the setting), defeat puffs | `combat.js`, `main.js` | visible in a fight; shake off when set |
| A5 | **Sound**: WebAudio effects (axe, arrows, dash, hits, hurt, UI) and per-place ambience (wind, water, insects); mute from settings | new `game/src/audio/audio.js`, `main.js` | every action audible; mute works |
| A6 | **Research round 3** (Dakota; nation-authored first): men's everyday clothing, more stories with defeatable monsters, helper animals, games and tools; ≤12 searches | `research/dakota.md`, CULTURE.md *Needs review* | new candidates listed with sources [gate: the user picks] |

## Phase B: Opus, one design pass (after A6 is approved)

| # | Task | Writes | Done when |
|---|---|---|---|
| B1 | **Design pack**: sacred check of A6; man hero brief; 3 new threats; a mini-boss and a second boss with phases (story monsters, e.g. Double-Face, Iya's lake telling, softened); per-place room layouts; 6 gifts (approved helpers); 2 items per slot; camp unlocks for helpers and room types; elder stories; tutorial hints; Dakota place names in the UI; difficulty curve | `DESIGN-dakota-content.md`, `art/briefs/*`, CULTURE.md entries | every Phase C task can start from it without questions [gate: the user approves the pack in one review] |

## Phase C: Sonnet, content builds from the pack (easiest first)

| # | Task | Reads → writes | Done when |
|---|---|---|---|
| C1 | **Tutorial** hints on the first run, skippable; place names shown on room entry | pack, `ui/`, `run.js` | shows once; names from CULTURE.md |
| C2 | **Gifts and items**: data, then models (Blender scripts) for the new items | pack, `data/`, `art/models/` | all equip, show only when equipped, apply; budgets met |
| C3 | **New threats**: models and behaviours; per-place room layouts | pack, `data/`, `combat.js`, `art/models/` | each place plays differently |
| C4 | **Man hero** model (same rig and animation names) and **hero choice** screen | pack, `art/models/`, `main.js`, `run.js` | both heroes playable end to end, gear fits both [gate: the user approves the look] |
| C5 | **Mini-boss and second boss** | pack, `data/enemies.json`, `combat.js`, `art/models/` | both beatable; phases work |
| C6 | **Camp growth**: helper and room-type unlocks, elder stories | pack, `camp.json`, `camp.js` | unlocks change the next run |
| C7 | **Phone install**: manifest, versioned service worker (offline), icon from a Blender render | `game/` | installs on the phone, plays offline, updates after a new version |

## Phase D: Opus, review and tuning

| # | Task | Done when |
|---|---|---|
| D1 | Full review (culture, bugs, balance from data) and phone playtest with the user; fix list for Sonnet if large | runs feel fair, nothing blocking; the user approves the Dakota release |

## Notes

- Approval stops (gates): A6 research picks, B1 design pack, C4 man hero look, D1 release.
- Lakota and Nakota, store release and multiplayer are out of scope.
- Commit and push only when the user asks, branch confirmed (`main` deploys the whole site).
