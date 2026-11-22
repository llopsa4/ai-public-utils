# Dead Woods task plan

Written by Claude (Opus) on 2026-11-22 from a grilling session with the user. Decisions:
[DESIGN.md](DESIGN.md). Every task unit names its model, exact reads, exact writes and a checkable
"done when", so each session spends as little usage as possible.

**To continue in a new session:** say `BUILD task Zn from PLAN.md` (or `continue` for handoff
requests). The agent reads WORKLOG.md, both handoff files, this unit's row and only the files it lists.

## Rules for every unit

- Read only the listed files (DESIGN by section). Do not widen the unit; list follow-ups instead.
- `src/sim/` never imports Phaser; numbers live in `src/data/*.json`; scenes draw and send orders.
- New sprite keys go into `art/manifest.json` with `status: "placeholder"` and a grey code drawing in
  `src/render/placeholders.ts` (Claude never draws real art).
- Finish with `npm run typecheck && npm test`, then update WORKLOG.md *Next action* (≤ 3 lines), mark
  the row `done (date)` here and update `handoff/from-claude.md`. No commit or push unless asked.

## Fixed technical shape

- `src/sim/`: pure TS, fixed 10 Hz tick, seeded RNG (`rng.ts`), JSON-serialisable state. Files:
  `grid` (tiles: floor / wall / tree / cover / bush), `path` (A* on the grid), `vision` (cone + grid
  line of sight), `noise` (rings), `ai` (zombie, human), `abilities`, `combat`, `mission` (tick,
  extract, fail), `camp` (resources, upgrades, roamers), `campaign` (story step, save).
- `src/data/`: `characters.json`, `enemies.json`, `camp.json`, `story.json`, `missions/m01.json`.
- `src/scenes/`: `Boot`, `Menu` (New / Continue), `Camp`, `Mission`, `Hud`, `Debrief`.
- `src/render/`: `iso` + `camera` (pure maths), `placeholders` (grey shapes by manifest key),
  `cones` (vision cones and noise rings).
- `?debug` sets `window.dw = { state, step(n), orders(list) }` for tests and automation.

## Slice spec (starting values; tune in the playtest)

Units: tiles, seconds. Stats live in JSON so tuning edits data only.

- **Survivors** (HP 100; movement states in DESIGN §14: run 5 / noise 6, walk 3 / 2, crouch 1.5 / 0, crawl 0.8 / 0):
  - Fighter: vision 6 / 90°; knife (adjacent, silent, 40); pistol (range 6, 25, noise 12);
    **takedown** F on an adjacent enemy that does not see him: 1 s, silent kill;
    **carry** G picks up / drops an adjacent body (speed × 0.6).
  - Scout: vision 8 / 90°, crouch 2.2; bow (range 7, 30, noise 2, reload 1.5);
    **lure** L then click: throw range 8, noise radius 6 at the target, cooldown 10.
- **Watch** (V, click facing): cone = the survivor's vision; the first enemy inside is attacked with
  the knife if adjacent, else the ranged weapon; a new order ends it.
- **Zombie** (HP 60, wander 0.8, chase 2.2, vision 4 / 90°, bite 15 per s): wanders; any noise ring
  reaching it → walks to the source; sees a survivor → chases; loses track after 5 s out of sight.
  Ignores bodies.
- **Human guard** (HP 80, patrol 1.5, vision 9 / 70°): near half of the cone sees anyone; far half
  sees only standing survivors, after 0.5 s. Sees a survivor → alert: shoots (range 8, 20 per 1 s,
  noise 12) and raises an alarm (noise 15 that wakes other humans). Sees a body → walks to it,
  then searches 10 s.
- **Bushes** hide a crouched or crawling survivor unless an enemy is adjacent. Walls and trees block sight and
  movement.
- **Gore:** a death leaves a body and a blood decal that stay for the scene.
- **Mission m01** "Ranger station": 32 × 32; start + extract zone on the south edge; a ranger hut
  (walls), fence, bushes; 2 zombies wandering, 1 human guard on a 4-waypoint patrol; 3 crates
  (2 s to open): food 3, scrap 4, food 2 + scrap 2. Success = both survivors in the extract zone with
  at least one crate opened. Any survivor death → fail → restart.
- **Camp** 32 × 32 woods clearing: tent (2 × 2), fire (1 × 1), trees around. Start food 5, scrap 2;
  returning from a mission eats 2 food (0 food → both survivors start at HP 50). Upgrade
  **Barricade**: B then click, 1 scrap per segment, segment HP 100, blocks zombies.
  4 zombies spawn at the map edges each camp visit and wander. Both survivors dead → camp restarts.

## Task units

Dependency order; within it easiest first.

| ID | Model | Reads | Writes | Done when | Status |
|---|---|---|---|---|---|
| Z0 Docs | Opus | the setup plan | `AGENTS.md`, `CLAUDE.md`, `README.md`, `DESIGN.md`, `PLAN.md`, `PROMPTING.md`, `DEVELOPMENT.md`, `TESTING.md`, `WORKLOG.md`, `CHANGELOG.md`, `handoff/*.md`, `art/STYLE.md`, `.claude/skills/zombie-content/` + `.agents` copy; `games/AGENTS.md`, `games/README.md`, `games/index.html` | links resolve; skill copies identical | done 2026-11-22 |
| Z1 Scaffold | Opus | Survival's configs, `iso.ts`, `camera.ts`, `rng.ts` | `package.json`, `vite.config.ts`, `tsconfig.json`, `scripts/publish.mjs`, `.gitignore`, `src/index.html`, `src/main.ts`, `scenes/Boot.ts`, `scenes/Menu.ts`, `scenes/Camp.ts` (empty grid), `render/iso.ts`, `render/camera.ts`, `render/placeholders.ts`, `sim/rng.ts`, `art/manifest.json`, `tests/iso.test.ts` | menu → grey iso grid with pan/zoom; `npm run publish` writes `index.html` + `build/`; tests pass | done 2026-11-22 |
| Z2 Camp scene | Sonnet | DESIGN §2, §10; *Slice spec* Camp; `scenes/Camp.ts`, `render/placeholders.ts`, `art/manifest.json` | `data/camp.json`, `sim/grid.ts`, `sim/path.ts`, `sim/camp.ts`, `scenes/Camp.ts`, `scenes/Hud.ts`, `tests/path.test.ts` | woods clearing with tent + fire + trees; 2 survivors: click / box-select, right-click move along A*; HUD food / scrap | done 2026-11-22 |
| Z3 Stealth core sim | **Opus** — line of sight, AI state machines and noise are tricky | DESIGN §3, §5, §7, §8, §13, §14; *Slice spec*; `sim/grid.ts`, `sim/path.ts` | `sim/vision.ts`, `sim/noise.ts`, `sim/ai.ts`, `sim/combat.ts`, `sim/mission.ts`, `data/enemies.json`, `data/characters.json`, `tests/vision.test.ts`, `tests/ai.test.ts` | unit tests: cone + wall LOS; far-cone ignores crouched; bush hides; lure pulls a zombie; human alarm wakes another human; body found → search; watch cone attacks first enemy and ends on a new order; survivor death → `failed` | done 2026-11-22 |
| Z4 Mission scene | Sonnet | Z3 exports (signatures only); DESIGN §3, §6, §8, §14; *Slice spec* m01 | `data/missions/m01.json`, `sim/abilities.ts`, `scenes/Mission.ts`, `render/cones.ts`, `tests/abilities.test.ts` | m01 playable: cones (enemy red near / yellow far, own watch cone green), noise rings, C crouch, V watch, F takedown, G carry, L lure, crates, extract, death → restart, Space pause; blood decal + body stay | done 2026-11-22 |
| Z5 Camp upgrade + roamers | Sonnet | Z2 files; Z3 exports; DESIGN §12, §13; *Slice spec* Camp | `data/camp.json`, `sim/camp.ts`, `scenes/Camp.ts`, `tests/camp.test.ts` | B places barricade segments for scrap; 4 zombies roam with Z3 zombie AI; V watch and right-click attack kill them; both dead → camp restarts | done 2026-11-22 |
| Z6 Campaign + save | Sonnet | entry points of Camp, Mission; DESIGN §2, §11 | `data/story.json`, `sim/campaign.ts`, `scenes/Menu.ts`, `scenes/Debrief.ts`, `tests/campaign.test.ts` | New Game → Camp → m01 → Debrief (loot) → Camp → "To be continued"; Continue resumes from `localStorage` key `deadwoods.save` | done 2026-11-22 |
| Z7 Smoke + publish | Haiku | `TESTING.md`, `playwright.config.ts` | `tests/e2e/smoke.spec.ts`; run `npm run publish` | e2e: menu loads, New Game reaches Camp, `dw.step(50)` advances without errors; published `index.html` opens | done 2026-11-22 |
| Gate | user | — | — | **playtest the slice** before more content | — |
| Later | Opus DESIGN | — | `DESIGN-characters.md` (7-character roster), art spec + batches for Codex, mission 2+, camp relocation, timed waves, tactical pause | grilled with the user one question at a time | unscheduled |

Implement with: Sonnet for Z2, Z4, Z5, Z6; Opus — Z3 (stealth AI and line of sight); Haiku for Z7.
