# Kota task plan: playable 2D milestone; review and art remain

Written by Claude (Opus) on 2026-11-18 from a grilling session with the user (18 decisions, all
confirmed). It replaces [PLAN-dakota.md](PLAN-dakota.md), [SLICE.md](SLICE.md) and the hero art
plan T1–T7. Commit and push only when the user asks, with the branch confirmed (`main` deploys the
whole site).

## Execution status — reconciled 2026-11-22

- A1–A5: recorded complete. Retired 3D files and plans are not work to repeat; retained legacy
  documents are marked historical. No LICENSES.md register is required (user, 2026-11-20).
- B1: approved on 2026-11-18 (“Continue”), as recorded by Claude; DESIGN-m1.md is the baseline.
- C1–C7: implemented. C8: bot tuning done; user phone playtest and milestone acceptance remain open.
  Historical bot results are in WORKLOG.md; they are not a fresh test of this checkout.
- D1: partial 2D notes exist, but the full style rewrite and its approval gate remain open.
- D2–D4: Ash Wolf only has generated sources and four processed walk frames. Installation awaits
  user approval. No painted sprite is loaded by BootScene or RunScene. Other batch-1 art is not
  recorded as delivered. Do not regenerate Ash Wolf merely because old handoff K1 says open.
- D5 and version 1: future scope, after the relevant approvals; not current implementation tasks.
- Active split: Claude owns design, prompts and new/tricky runtime work; Codex generates, prepares
  and installs approved art. This supersedes the older ownership labels in the task table below.

Next: user phone playtest (C8) and review of the existing Ash Wolf strip. Claude's next design
unit is D1 before expanding art production. No new generation or installation is authorized by
this documentation reconciliation. Task descriptions below retain their original IDs and scope;
use this status section and WORKLOG.md to determine what remains.

## Settled decisions (user, 2026-11-18)

1. **Brotato loop:** one arena per run, timed waves, auto-firing weapons, level-ups and a shop
   between waves, a boss at the end. No doors or room chain.
2. **Flat 2D top-down** (no 3D, no isometric view).
3. **Hand-painted, serious 2D art.** Ash Wolf keeps her warrior direction; 3D models, rigs and
   triangle budgets are retired.
4. **Controls:** floating stick, a **dash** and **one ability button**; weapons auto-aim and
   auto-fire; the left-handed swap stays.
5. **Up to 6 weapons at once**, with tiers I–IV by merging duplicates; invented weapons are allowed.
6. **CULTURE.md no longer forbids invention, and *Off-limits* is no longer binding.** The old lists
   stay as non-binding reference notes. Claude's own limits still apply: no demeaning stereotypes or
   caricature, no war-whoops, no scalping or trophies, no real sacred ceremonies as mechanics.
7. **A roster of named Dakota heroes**, each with a starting weapon, a stat twist and an ability;
   Ash Wolf is first.
8. **One dual pickup** (experience plus money), food that heals, level-up picks after each wave,
   then a 4-offer shop with lock and reroll.
9. **20 waves** (20 s growing to 60 s): **Double-Face** as an elite on wave 10, **Iya** on wave 20
   (Eya later as an unlock).
10. **A growing camp:** goods buy permanent upgrades and unlock helpers, places and heroes; elder
    stories stay.
11. **Phaser 3** (MIT), vendored; data, sound, settings, save and touch ideas carry over where they fit.
12. **Helpers present the level-up choices**, each tied to stats that fit their story; camp builds
    add helpers.
13. **The old 3D game is deleted without a snapshot** (it was never committed), after a final
    confirmation that lists the exact paths.
14. **Single painted stills animated in code** (bob, squash, flip, hit flash, orbiting weapons);
    bosses get 2–3 poses.
15. **Art production:** Claude writes the prompts, Codex generates, and
    Codex processes and installs after approval. Gameplay is built on placeholders first.
16. **Each run is in one place** picked from the unlocked ones (painted ground, props, a mild
    twist); prairie and lakeshore come first.
17. **Milestone 1:** Ash Wolf, 6 weapons, ~15 items, 5 threats, Double-Face, Iya, 2 arenas, shop,
    level-ups, a camp with 3–4 upgrades, on placeholders. **Version 1** adds more heroes, weapons,
    items, Eya, more places and the painted art.
18. **Tone:** serious with warmth; the helpers carry the light humour.

## How to run a task (saves usage)

- One task per session. Read only the files listed, plus [WORKLOG.md](WORKLOG.md). At the end,
  update WORKLOG *Next action* (≤ 3 lines) and your handoff file.
- **Test recipe:** serve `game/` on port 8765 (`python -m http.server 8765 --directory game`); open
  `index.html?debug` in Chrome at 844 × 390. Earlier automation ran at about 2 fps; if that recurs,
  step the game through the `?debug` hook rather than waiting, and clear `kota.*` localStorage keys
  afterwards. Real feel and fps are checked on the phone (`http://<your PC's current LAN IP>:8765/` on the home
  wifi).
- Gates (the user approves): **B1 spec**, **D1 art style**, each **art batch**, **C8 milestone 1**.

## Phase A: documents and clean-up (cheap, do first)

| # | Model | Task | Reads → writes | Done when |
|---|---|---|---|---|
| A1 | Haiku | **Invention allowed.** In CULTURE.md, replace the "binding / only what is sourced" intro with: invention is allowed; the file records sourced facts and past decisions as reference. Rename *Off-limits* to *Reference: what sources call sacred or sensitive (not binding)*, unchanged otherwise. Make the same change to the matching rules in `kota/AGENTS.md` (*Kota rules*), PROMPTING.md (*Standing rules*: Culture first, Off-limits, Rewards) and art/STYLE.md (*Never*). | those 4 files | no rule in them forbids invention or calls Off-limits binding; the lists are still there as reference |
| A2 | Haiku | **Work log:** add the pivot to WORKLOG *State* and *Next action*; mark PLAN-dakota.md, SLICE.md and the hero art plan as superseded by PLAN.md; update the Claude handoff. | WORKLOG.md, handoff/from-claude.md | WORKLOG points to PLAN.md |
| A3 | Sonnet | **DESIGN.md rewrite** from the 18 decisions above (settled decisions only). Delete SLICE.md and PLAN-dakota.md. Keep DESIGN-dakota-content.md until B1 has taken its threats, bosses, helpers and places, then delete it in B1. | DESIGN.md, this plan | DESIGN.md describes the Brotato-style game, with no doors, rooms or 3D left |
| A4 | Haiku | **Delete the old 3D game.** First show the user the exact list and get a yes (and offer the Recycle Bin instead of permanent deletion). Delete: `game/src/` **except** `audio/audio.js`, `settings.js`, `input/touch.js`, `ui/hints.js` (moved to `game/carry/`); `game/src/vendor/` (Three.js, GLTFLoader); `game/assets/models/`; `art/models/`; 3D briefs in `art/briefs/`; the Three.js and Blender rows in LICENSES.md. Keep `game/data/*.json` for B1 to read. | the paths above | `git status` and a directory listing show only the kept files |
| A5 | Sonnet | **2D art pipeline:** rewrite art/PIPELINE.md for painted stills: prompt template, sizes (heroes about 256 px tall source, threats 128–512 px, weapons 128 px), transparent PNG, free background-removal tool (choose one and document it in PIPELINE.md), naming `game/assets/sprites/<id>.png`, atlas packing (free tool or a Phaser-friendly script), approval steps; rewrite art/ASSETS.md as an empty 2D register. | art/PIPELINE.md, art/ASSETS.md | the pipeline names every step and tool, all free |

## Phase B: design (Opus, one pass)

| # | Model | Task | Writes | Done when |
|---|---|---|---|---|
| B1 | Opus | **Milestone 1 spec**, reusing what fits from DESIGN-dakota-content.md: Ash Wolf (starting weapon, stat twist, ability, dash numbers); 6 weapons (melee and ranged, tiers I–IV, stats per tier, price); ~15 items (stat stacks, price, rarity); the stat list and the formulas for damage, armour, dodge and speed; the helpers and the stats each one offers on level-ups; 5 threats (frost wisp, hunger shade, blight swarm, plus 2 new, behaviours and stats); Double-Face as the wave 10 elite and Iya as the wave 20 boss, adapted to an open arena; the wave table for 1–20 (length, spawn rate, mix, scaling); the pickup's name and the experience curve; shop rules (prices by wave, reroll cost, lock); 3–4 camp upgrades and their costs; 2 arenas with their twists; game-over and win screens; hint texts. Data shapes for every JSON file. Then delete DESIGN-dakota-content.md. | `DESIGN-m1.md` | every C task can start without questions [gate: the user approves] |

## Phase C: build milestone 1 on placeholders (Sonnet, easiest first)

| # | Model | Task | Reads → writes | Done when |
|---|---|---|---|---|
| C1 | Sonnet | **Phaser skeleton:** vendor Phaser 3 (an exact version, ESM build) in `game/vendor/`, with its vendored licence text; `index.html`; scenes Boot, Camp, Run, Between (level-up and shop); bounded top-down arena with camera follow; the touch stick plus dash and ability buttons (ported from `carry/touch.js`, left-handed swap); settings, sound and hints ported from `carry/`. | DESIGN-m1 (controls), `carry/*` → `game/src/*` | the hero moves and dashes in an empty arena with no console errors; fps shown in debug |
| C2 | Sonnet | **Waves, threats, pickups:** wave timer and spawner from the wave table; the 5 threat behaviours; dual pickups (magnet radius), food; HUD (health, experience bar, money, wave and timer). | DESIGN-m1 → `game/data/waves.json`, `threats.json`, `src/run/*` | a scripted run reaches wave 5 with the right counts |
| C3 | Sonnet | **Weapons:** 6 slots orbiting the hero, auto-aim at the nearest threat, the 6 weapons, tier merging, damage numbers and hit flash. | DESIGN-m1 → `data/weapons.json`, `src/combat/*` | every weapon fires and merges; stats match the data |
| C4 | Sonnet | **Between waves:** helper level-up picks, then the shop (4 offers, lock, reroll, sell), items stacking stats. | DESIGN-m1 → `data/items.json`, `data/helpers.json`, `src/between/*` | buying, locking, rerolling and stacking all work across waves |
| C5 | Sonnet | **Bosses:** Double-Face (wave 10 elite) and Iya (wave 20); boss bar; win and fall screens. | DESIGN-m1 → `threats.json`, `src/combat/bosses.js` | both can be beaten in a scripted run; win after wave 20 |
| C6 | Sonnet | **Camp and save:** hub screen (hero, unlocks, elder stories), 3–4 permanent upgrades, goods from runs, saved under a new `kota.v2.*` key. | DESIGN-m1 → `data/camp.json`, `src/camp/*` | upgrades change the next run; save survives a reload |
| C7 | Sonnet | **Arenas:** prairie and lakeshore with placeholder ground and props and their twists; the place is chosen at the start of a run. | DESIGN-m1 → `data/arenas.json`, `src/run/arena.js` | both arenas play, and the twist is noticeable |
| C8 | Opus + user | **Milestone 1 review and tuning:** a balance pass from the data, a bug review, the phone playtest with the user; a fix list for Sonnet if it's long. | all of milestone 1 | the user says milestone 1 feels right [gate] |

## Phase D: painted art (alongside C, after B1)

| # | Model | Task | Writes | Done when |
|---|---|---|---|---|
| D1 | Opus | **2D style guide:** rewrite art/STYLE.md for hand-painted top-down stills (view angle, light direction, palette, readability at phone size (retain Ash Wolf's thin-outline choice; settle other families), serious-warm tone); rewrite Ash Wolf's brief for a 2D still. | art/STYLE.md, art/briefs/hero_dakota_woman.md | [gate: the user approves the style] |
| D2 | Sonnet | **Prompt batch 1:** Ash Wolf, the 5 threats, Double-Face (3 poses), Iya (3 poses). | `art/refs/<id>/README.md` prompts | the prompts follow STYLE.md |
| D3 | Codex | **Generate batch 1** from the prompts. | `art/refs/<id>/` images | the images are saved |
| D4 | Codex | **Process and install batch 1:** remove backgrounds, crop, scale, pack, swap out the placeholders. | `game/assets/sprites/`, ASSETS.md | they show in the game [gate: the user approves the batch] |
| D5 | Claude → Codex → user | **Batches 2 and 3:** weapons and items, then arenas and props, using the same steps D2–D4. | as D2–D4 | all milestone 1 art is painted |

## Afterwards: version 1 (planned once milestone 1 is approved)

4–5 more heroes, about 15 weapons, about 40 items, Eya as a boss unlock, more places (from the
camp), more camp upgrades, the phone install (manifest plus an offline service worker), and testing
away from the home wifi (Tailscale recommended). Lakota and Nakota stay out of scope.
