# Dead Woods task plan

Written by Claude (Opus) on 2026-11-22 from a grilling session with the user; slimmed 2026-11-24 (K3).
Decisions: [DESIGN.md](DESIGN.md). Every open unit names its model, exact reads, exact writes and a
checkable "done when", so each session spends as little usage as possible.

**To continue in a new session:** say `BUILD task Kn from PLAN.md` (or `continue` for handoff
requests). The agent reads WORKLOG.md, both handoff files, this unit's row and only the files it lists.

## Rules for every unit

- Read only the listed files (DESIGN by section). Do not widen the unit; list follow-ups instead.
- `src/sim/` never imports Phaser; numbers live in `src/data/*.json`; scenes draw and send orders.
- New sprite keys go into `art/manifest.json` with `status: "placeholder"` and a grey stand-in
  (`npm run art:standins`); Claude never draws real art.
- Finish with `npm run typecheck && npm test`, then update WORKLOG.md *Next action* (≤ 3 lines), mark
  the row `done (date)` here and update `handoff/from-claude.md`. No commit or push unless asked.

## Fixed technical shape

- `src/sim/`: pure TS, fixed 10 Hz tick, seeded RNG (`rng.ts`), JSON-serialisable state. Files:
  `grid`, `path` (A*), `vision`, `noise`, `ai`, `abilities`, `combat`, `mission`, `traps`, `base`
  (Base 1), `tutorial` (Intro), `dialogue`, `campaign` (stage + save), `options`, `keymap`, `time`.
- `src/data/`: `characters.json`, `enemies.json`, `base1.json`, `intro.json`, `story.json`,
  `anims.json`, `keys.json`, `view.json`, `missions/m01.json`.
- `src/scenes/`: `Boot`, `Menu`, `Intro`, `Mission`, `Base`, overlays `ActionBar`, `Squad`,
  `Dialogue`, `Feel`, `Pause`; helpers `input` (shared camera/mouse controller), `actionKeys`,
  `counters`, `feelFx`, `ground`, `kit`, `optionsPage`, `uiScale`.
- `src/render/`: pure maths and lookups (`iso`, `camera`, `click`, `cues`, `figure`, `fx`, `squad`,
  `ui`, `uiview`), `atlas` (loads `art/atlas/*`), `units` (`UnitSprite`), `cones`, `placeholders`.
- `src/audio/`: all sound made in code (`events`, `space`, `sfx`, `engine`, `mood`, `ambience`).
- `scripts/`: `publish.mjs`, `balance.ts`, `art/{lib,pack,standins}.mjs`. Tests: `tests/*.test.ts`,
  `tests/e2e/*.spec.ts`.
- `?debug` sets `window.dw = { state, step(n), orders(list) }` in Intro, Mission and Base, and
  `window.dwGame` (the Phaser game) in `main.ts`, for tests and automation.

## Task units

Done rows are one-liners (what each unit did lives in the code, DESIGN and git history).

| ID | Model | Reads | Writes | Done when | Status |
|---|---|---|---|---|---|
| Z0 Docs | Opus | — | — | — | done (2026-11-22) |
| Z1 Scaffold | Opus | — | — | — | done (2026-11-22) |
| Z2 Camp scene | Sonnet | — | — | — | done (2026-11-22); replaced by Base 1 (Z15, Z18) |
| Z3 Stealth core sim | Opus | — | — | — | done (2026-11-22) |
| Z4 Mission scene | Sonnet | — | — | — | done (2026-11-22) |
| Z5 Camp upgrade + roamers | Sonnet | — | — | — | done (2026-11-22) |
| Z6 Campaign + save | Sonnet | — | — | — | done (2026-11-22); replaced by Z18 |
| Z7 Smoke + publish | Haiku | — | — | — | done (2026-11-22) |
| Gate | user | — | — | playtest the slice | superseded by Z8–Z19 (2026-11-23) |
| Z8 Rename Watch to Hold | Haiku | — | — | — | done (2026-11-23) |
| Z9 Script | Sonnet (WRITE) | — | — | — | done (2026-11-23, user approved) |
| Z10 Zombie senses | Sonnet | — | — | — | done |
| Z11 Weapons, ammo, action bar | Sonnet | — | — | — | done (2026-11-23) |
| Z12 Dialogue box | Sonnet | — | — | — | done (2026-11-23) |
| Z13 M1 house + roof | Sonnet | — | — | — | done (2026-11-23) |
| Z14 Intro | Sonnet | — | — | — | done (2026-11-23) |
| Z15 Base: fix, cook, hunger | Sonnet | — | — | — | done (2026-11-23) |
| Z16 Traps | Sonnet | — | — | — | done (2026-11-23) |
| Z17 Roamers + herd | Sonnet | — | — | — | done (2026-11-23) |
| Z18 Flow + save v2 | Sonnet | — | — | — | done (2026-11-23) |
| Z19 Smoke + publish | Haiku | — | — | — | done (2026-11-23) |
| Gate 2 | user | — | — | playtest Intro → M1 → Base 1 | done (2026-11-23) |
| Z20 Art spec | Opus DESIGN | — | — | — | done (2026-11-23) |
| Z21 Remove dead camp code | Haiku | — | — | — | done (2026-11-23) |
| Z22 Atlas contract | Sonnet | — | — | — | done (2026-11-23) |
| Z23 Pack + stand-in scripts | Sonnet | — | — | — | done (2026-11-23) |
| Z24 Sim action cue | Sonnet | — | — | — | done (2026-11-23) |
| Z25 Shared renderer + atlas loader | Sonnet | — | — | — | done (2026-11-23) |
| A1 Style probe | Codex | — | — | — | done (2026-11-23) |
| A2 Fighter full | Codex | — | — | — | done (2026-11-23) |
| A3 Scout full | Codex | — | — | — | done (2026-11-24) |
| A4 Zombie fresh | Codex | — | — | — | done (2026-11-24) |
| A5 Zombie decayed + rotting | Codex | — | — | — | done (2026-11-24) |
| Z49 Per-sheet resolution | Sonnet | — | — | — | done (2026-11-24) |
| A7 Cass 2× | Codex | — | — | — | done (2026-11-24) |
| A6 Cursor art | Codex | — | — | — | moved to A9 (2026-11-24) |
| Z50 Zombie crowd keys | Sonnet | — | — | — | done (2026-11-24) |
| Z51 Zombie reach | Sonnet | — | — | — | done (2026-11-24) |
| Z52 Zombie limp frames | Sonnet | — | — | — | done (2026-11-24) |
| Z53 UI art contract + stand-ins | Sonnet | — | — | — | done (2026-11-24) |
| Z54 Kit + icons in scenes | Sonnet | — | — | — | done (2026-11-24) |
| A8 UI kit | Codex | — | — | — | done (2026-11-24) |
| A9 Icons + cursors | Codex | — | — | — | done (2026-11-24) |
| Z55 Mood tags | Sonnet (WRITE) | — | — | — | done (2026-11-24) |
| Z56 Portraits in code | Sonnet | — | — | — | done (2026-11-24) |
| A10 Portraits | Codex | — | — | — | done (2026-11-24) |
| Z57 Title screen | Sonnet | — | — | — | done (2026-11-24) |
| A11 Title art | Codex | — | — | — | done (2026-11-24) |
| Z27 Run everywhere | Haiku | — | — | — | done (2026-11-23); run is double-click since Z45 |
| Z28 Dialogue skip | Haiku | — | — | — | done (2026-11-23) |
| Z29 HUD fixes | Sonnet | — | — | — | done (2026-11-23) |
| Z30 Saves: done + keep damaged slot | Sonnet | — | — | — | done (2026-11-23) |
| Z31 Base hints + objective | Sonnet | — | — | — | done (2026-11-24) |
| Z32 Hold melee + Free fire | Sonnet | — | — | — | done (2026-11-23) |
| Z33 Shared input + camera | Sonnet | — | — | — | done (2026-11-24) |
| Z34 Pause menu + options store | Sonnet | — | — | — | done (2026-11-24) |
| Z35 Squad panel + selection keys | Sonnet | — | — | — | done (2026-11-24) |
| Z36 Text size + shape cues | Sonnet | — | — | — | done (2026-11-24) |
| Z37 Key rebinding | Sonnet | — | — | — | done (2026-11-24) |
| Z38 Feel FX | Sonnet | — | — | — | done (2026-11-24) |
| Z39 Audio engine + effects | Sonnet | — | — | — | done (2026-11-24) |
| Z40 Adaptive ambience | Sonnet | — | — | — | done (2026-11-24) |
| Z41 Herd checkpoint | Sonnet | — | — | — | done (2026-11-24) |
| Z42 Performance | Sonnet | — | — | — | done (2026-11-24) |
| Z43 Balance sim + tuning | Opus | — | — | — | done (2026-11-24): careful bot 77%, passive 0% |
| Z44 E2E + publish | Sonnet | — | — | — | done (2026-11-24) |
| Z45 Commandos mouse | Sonnet | — | — | — | done (2026-11-24) |
| Z48 Cass shot stand-ins | Haiku | — | — | — | done (2026-11-23) |
| Z46 Cass gun lines | Sonnet (WRITE) | — | — | — | done (2026-11-23) |
| Z47 Cass gun unlock | Sonnet | — | — | — | done (2026-11-23) |
| Gate 3 | user | — | — | playtest the polished Intro → M1 → Base 1 | passed (2026-11-24) |
| Environment art grilling | Opus DESIGN | art/STYLE.md; placeholder inventory (ground, walls, house + roof, openings, props, traps, stove, decals) | art/STYLE.md, PLAN rows | grilled with the user, one question at a time | — |
| Z26 Smoke + publish | Haiku | `tests/e2e/smoke.spec.ts` | run `npm run publish` | e2e passes with final art; no push without the user's explicit request and branch | — |
| Cleanup | — | — | — | 2026-11-24 audit + grilling with the user: untrack `art/inbox/` (no history rewrite, keep every batch on disk); WORKLOG back to a short status file (done-log dropped, not archived); every "Assumed (change if wrong)" note in WORKLOG accepted by the user: player-facing ones go into DESIGN, implementation details are dropped (code and data hold them); PLAN slimmed; handoff briefs C1–C9 removed after their lasting rules are checked against `art/STYLE.md`; four dead exports removed, test-only hooks kept; one big local commit at the end, no push. Scene refactor (Base/Mission/Intro) out of scope. Order easiest first: K1 → K5 | — |
| K1 Untrack inbox | Haiku | `.gitignore`, `../survival/.gitignore` | `.gitignore` (add `art/inbox/`); `git rm -r --cached art/inbox` (no commit yet) | `git ls-files art/inbox` empty; all 28 batch folders still on disk | done (2026-11-24) |
| K2 Dead code + text fixes | Haiku | `src/render/atlas.ts`, `src/render/iso.ts`, `src/sim/base.ts`, `src/sim/traps.ts`; `README.md`, `DEVELOPMENT.md`, `TESTING.md` | remove four dead exports (keep test-only `uiItem`, `uiGroup`, `clearSave`, `resetOptionsCache`); fix mojibake and stale names in the three guides | typecheck, `npm test`, `npm run e2e` pass; no mojibake in any `.md` in `zombie/` | done (2026-11-24) |
| K3 Slim PLAN.md | Sonnet | this file; `src/` file list | this file: *Fixed technical shape* matches today's code; *Slice spec* removed; done rows cut to one-liners; old "Implement with" lines removed; open rows keep all columns | file under ~10 KB; every file path it names exists | done (2026-11-24) |
| K4 Trim handoffs | Sonnet | `handoff/from-claude.md`, `handoff/from-codex.md`, `art/STYLE.md` | `art/STYLE.md` gains any lasting rule from C1–C9 it lacks; both handoffs keep only their standing headings (*Working on*, *Awaiting the user*, *Requests for …*, *Taken from …*) with any still-open item; one line in *Requests for Codex* saying both files were trimmed 2026-11-24 and STYLE.md owns the art rules | no C-sections or install logs left; every C1–C9 rule found in STYLE.md | done (2026-11-24) |
| K5 WORKLOG + accepted assumptions + commit | Sonnet | `WORKLOG.md` (all, `allow_large`); `DESIGN.md` by the sections the assumptions touch | `DESIGN.md`: one short line per player-facing accepted assumption (e.g. R asks before restart, U jumps to attack, Continue resumes at the herd warning, Esc/Enter/R/Y/N and arrows not rebindable, taken key refused not swapped, Replay Base 1 overwrites the `done` save) in its section; `WORKLOG.md` rewritten: Mode, true Current state, Pending decisions, Next action (~30 lines); mark K1–K5 done here; then **one local commit** of K1–K5 on `main` (user approved 2026-11-24); no push | WORKLOG under ~3 KB; DESIGN has the rule lines; commit exists; nothing pushed | done (2026-11-24) |
| Later | Opus DESIGN | — | `DESIGN-characters.md` (7-character roster), art batches 2+ for Codex, mission 2+, camp relocation, timed waves, tactical pause | grilled with the user one question at a time | unscheduled |
