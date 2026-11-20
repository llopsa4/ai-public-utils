# Survival task plan

Written by Claude (Opus) on 2026-11-19 from a grilling session with the user (12 questions, all
confirmed). Every task unit names its model, exact reads, exact writes and a checkable "done when",
so each session spends as little usage as possible. Commit and push only when the user asks, with
the branch confirmed (`main` deploys the whole site).

## Settled decisions (user, 2026-11-19)

The same list, worded as the design record, is in [DESIGN.md](DESIGN.md).

1. **Platform:** desktop browser only (mouse + keyboard, no touch); static files on GitHub Pages
   (which serves `main` as-is, so built output is committed like `games/adventure/build/`); 2D;
   Phaser 3 + Vite + TypeScript.
2. **Organization model replaces keep/taxes/popularity:** tiyospaye (extended families, 10-12 people
   each, start with 2-3) are the work units; the player is the camp council; societies (hunters,
   scouts/warriors, healers, builders) train roles; no gold: a **shared camp store** with
   distribution choices (even / hunters first / hold reserves); **Wotakuye** (kinship/unity) meter
   replaces popularity (high = faster work + newcomers; low = quarrels, people leave); **gift value**
   (generosity) is the currency for upgrades and allies; seasons.
3. **Combat:** real-time Stronghold-style (box-select, right-click move/attack, hotkey stances);
   fighters are drafted workers (production trade-off); no walls at start, defenses grow later
   (lookouts, spike-line barricades, dogs, traps, fire); enemies drop no loot, defeated raids restore
   stolen goods; **lose** when all people or the central fire are lost.
4. **Resources:** food (hunt, gathering, fishing, later wild rice/corn; drying racks -> pemmican),
   wood, hides, flint/stone, bone/sinew, water, medicine herbs, crafted goods (tools, bows/arrows,
   travois), gift value. Hardships: hunger/famine, sickness, pests spoiling the store, hard winters,
   drought; each has a counter.
5. **Waves (30; one per ~3 in-game days; ~30 s scout warning; call early for bonus gift value):**
   era 1 animals (1-8; starts with one wolf; stampede can be diverted); era 2 fictional rival raiders
   (9-18; steal food/horses; can be bargained with gifts); era 3 fictional US military (19-30;
   riflemen, cavalry, cannon; longer range than the player starts with). A boss ends each era; final
   boss a fictional fort commander. No real historical people. Waves scale with camp strength.
6. **Progression, three tiers**, unlocked with gift value + camp size/Wotakuye: practical (bows,
   dogs, lookouts, drying racks, hunter/healer societies) -> societies (warrior classes, scouts,
   builders, barricades/traps/fire pits) -> fantasy (invented spirit fighters/ancestors; nature
   allies such as a charging bison herd, guardian wolf pack, shaman storms). All spirits invented, no
   real sacred names. Each upgrade costs people/food/spirit; not everything unlocks in one run.
7. **Run:** one seeded river-valley map per run with fog of war; win = survive 30 waves + final boss
   (~90 min); pause + 1x/2x/4x; seasons change the map (spring newcomers/floods, summer hunt, autumn
   harvest/drying, winter hunger/cold); camp does not move in early versions (travois move later);
   autosave to localStorage, 3 slots, file export/import; difficulty Gentle/Standard/Hard.
8. **Look:** isometric 2:1, 64x32 diamond tiles, depth-sorted upright sprites (~32 px people, ~96 px
   tipis), warm hand-painted look; camera pan (edge/WASD) + wheel zoom. Claude's **placeholders are
   drawn in code**; one **asset manifest** (key, size, anchor, frames, status placeholder|final): the
   game loads an `art/` PNG when present, else the placeholder, so Codex swaps art per asset.
9. **Content rules:** fiction, free invention; own short `CULTURE.md` (a real-culture claim needs a
   sourced note, gaps go under *Needs review*); Claude's own limits stay (no real historical
   people, no hateful caricature/slurs/mock war cries, no real named sacred ceremonies/objects as
   mechanics); rival bands and military fictional and killable on screen; free software only, **no
   LICENSES.md** (user); invented names at first.
10. **First slice:** 48x48 isometric map (grass, river, forest, berry patch); central fire + 2
    families of 10; 4 buildings (tipi, gathering spot, hunting lodge, store); food/wood/hides; shared
    store with one rule (feed evenly); hunger + simple Wotakuye bar; select/assign/box-select/
    right-click; one drafted hunter society vs 3 wolf waves (1, 3, pack) with 30 s warning; lose
    condition; a few simulation unit tests + one Playwright smoke test. Out of slice: seasons,
    saves, eras 2-3, upgrade tiers, moving camp, audio. All text in English.
11. **Docs:** Kota's set adapted; folder `games/survival/`; working title "Camp Fire" (named in
    `README.md` and `DESIGN.md` only); mode Claude only (Codex paused), art requests queued in
    handoff; development/testing guides written by C1/C7; nothing pushed.

## Fixed technical shape (so C tasks never re-decide it)

- Stack versions (copy from `games/adventure/package.json`): phaser 3.90.0, vite 8.3.5, typescript
  7.0.2, tsx 4.23.15, @playwright/test 1.64.1, @types/node 26.6.6. Full Phaser (no custom build).
  Node >= 22.12. `vite.config.ts`: `root: src`, `base: './'`, `build.outDir: dist`,
  `assetsDir: 'build'`, `assetsInlineLimit: 0`.
- Publish script `scripts/publish.mjs` adapted from `games/adventure/scripts/publish.mjs` (builds,
  copies `dist/build/*` -> `build/`, writes `index.html` last). `dist/`, `node_modules/` gitignored.
- Layout under `games/survival/`: `src/index.html` (source page; publish writes the served
  `index.html`), `src/main.ts`; `src/sim/` (pure TypeScript, **no Phaser import**:
  `rng.ts`, `state.ts`, `people.ts`, `jobs.ts`, `buildings.ts`, `economy.ts`, `orders.ts`,
  `combat.ts`, `waves.ts`, `tick.ts`); `src/render/` (`iso.ts`, `camera.ts`, `placeholders.ts`,
  `manifest.ts`, `people.ts`); `src/scenes/` (`Boot.ts`, `Menu.ts`, `Game.ts`, `Hud.ts`,
  `Build.ts`, `Select.ts`); `src/data/*.json` (`resources`, `jobs`, `buildings`, `enemies`,
  `waves`, `map`); `art/manifest.json`; unit tests `tests/**/*.test.ts` (run with
  `node --import tsx --test "tests/**/*.test.ts"`); `tests/smoke.spec.ts`; `playwright.config.ts`
  (needs `npx playwright install chromium` once).
- Simulation: fixed tick of 10 per second, seeded `mulberry32` RNG, state is plain JSON-serialisable
  objects, speed 1x/2x/4x = more ticks per frame. Rendering reads sim state, never mutates it.
- Debug hook (only with `?debug` in the URL): `window.camp = { state, step(n), orders(...) }`.
- Scripts: `dev`, `typecheck` (`tsc --noEmit`), `test`, `build`, `publish`, `e2e`.

## How to run a task (saves usage)

- One task per session. Read **only** the files listed (use line ranges or the named `##` section),
  plus [WORKLOG.md](WORKLOG.md). Write only the files listed. Stop at "Done when"; list follow-ups,
  do not do them.
- End by replacing WORKLOG *Next action* (<= 3 lines) and updating
  [handoff/from-claude.md](handoff/from-claude.md).
- Link check (doc tasks): for each `](target)` in the written files, `test -e` the target relative
  to the file; report missing ones.
- Never commit or push unless asked; never add LICENSES.md.
- Gates (the user approves): **B1 slice spec**, **C8 slice playtest**, each **art batch**.

## Phase A: documents (done 2026-11-19)

| # | Model | Reads | Writes | Steps | Done when |
|---|---|---|---|---|---|
| A1 | Sonnet | the planning conversation; `games/AGENTS.md`, `games/kota/AGENTS.md`, `games/kota/CLAUDE.md`, `games/kota/WORKLOG.md`, `games/kota/handoff/from-claude.md` (format only) | `PLAN.md` (first), `AGENTS.md`, `CLAUDE.md`, `WORKLOG.md`, `handoff/from-claude.md`, `handoff/from-codex.md`; edit `games/AGENTS.md`, `games/WORKFLOW.md` line 3 | PLAN.md = settled decisions, technical shape, run rules and phase tables. AGENTS.md = Kota's structure (entry, start-of-session list, rules). WORKLOG: mode Claude only (Codex paused). Handoff files: four empty sections each. Games table row added. | the 6 files exist; `games/AGENTS.md` has the row; AGENTS.md/WORKLOG/handoffs each <= 60 lines |
| A2 | Sonnet | settled decisions above, `games/kota/DESIGN.md` (first 25 lines, format), `games/kota/CULTURE.md` (grep for tiyospaye, takuye, akicita, camp circle, seasons, generosity) | `DESIGN.md`, `CULTURE.md`, `README.md` | DESIGN.md: decisions 1-10 as settled entries plus the working title. CULTURE.md <= 80 lines: reuse Kota's sourced entries where one exists, otherwise *Needs review* with a question; no web research. README: what it is, desktop only, how to run (from C1 on), status. | DESIGN has 10 entries; CULTURE has *Needs review*; link check passes |
| A3 | Sonnet | `games/kota/PROMPTING.md`, `games/kota/art/PIPELINE.md`, `games/kota/.claude/skills/kota-content/SKILL.md`, `games/WORKFLOW.md` lines 70-95 | `PROMPTING.md`, `art/PIPELINE.md`, `art/SPEC.md`, `art/ASSETS.md`, `.claude/skills/survival-content/SKILL.md` | PROMPTING: stages, standing rules, usage rules, model table, RTS templates. PIPELINE: Codex generation for isometric sprites. SPEC: sizes, anchors, palette, frames, manifest fields. ASSETS: empty register. SKILL.md: metadata + link only. | all files exist; link check passes for every file in `games/survival/`; WORKLOG *Next action* = `B1` |

## Phase B: design (Opus, one pass, gate)

| # | Model | Reads | Writes | Steps | Done when |
|---|---|---|---|---|---|
| B1 | Opus | `DESIGN.md`, `CULTURE.md`, `PLAN.md` (*Fixed technical shape*) | `DESIGN-slice.md` | Sections with exactly these headings, each with numbers and the JSON shape of its data file: `## Map` (48x48, tile types, generation from seed: river path, forest/berry placement, start position), `## People` (fields, 20 start people, age/job/health/hunger), `## Jobs` (gather, hunt, chop, build, haul, fight; rate per tick), `## Buildings` (tipi, gathering spot, hunting lodge, store: footprint, cost, workers, output), `## Resources` (food, wood, hides: start amounts, caps), `## Economy` (store, feed-evenly rule, hunger per tick, starvation), `## Wotakuye` (events +/-, thresholds, effect), `## Orders` (select, box-select, move, assign job, attack, draft/undraft, stances), `## Combat` (hit, damage, range, hunter/wolf stats), `## Waves` (3 wolf waves: counts, timers, 30 s warning, spawn edges), `## UI` (HUD layout at 1280x720: resource bar, Wotakuye bar, selection panel, build menu, wave banner, pause/speed), `## Tests` (the sim tests and the smoke test, one line each). | every C task's reads name a heading that exists; **gate: user approves** |

## Phase C: build the slice (Sonnet, easiest first, one task per session)

Common: read only the listed `DESIGN-slice.md` headings; write only the listed files; data in JSON,
logic in `src/sim`, drawing in `src/render`/`src/scenes`; run `npm run typecheck && npm test`.
Each task ends with the line `Implement with: Sonnet` in its report if it needed nothing more.

| # | Reads | Writes | Done when |
|---|---|---|---|
| C1 | `PLAN.md` (*Fixed technical shape*), `DESIGN-slice.md` `## Map`, `games/adventure/package.json`, `games/adventure/scripts/publish.mjs` | `package.json`, `tsconfig.json`, `vite.config.ts`, `src/index.html`, `src/main.ts`, `tests/iso.test.ts`, `src/sim/{rng,map}.ts`, `src/render/{iso,camera,placeholders,manifest}.ts`, `src/scenes/{Boot,Game}.ts`, `src/data/map.json`, `art/manifest.json`, `scripts/publish.mjs`, `.gitignore`, `DEVELOPMENT.md` | `npm run dev`: a 48x48 isometric map draws, WASD/edge pan and wheel zoom work, no console errors; `tests/iso.test.ts` round-trips tile<->screen; `npm run typecheck && npm test` pass |
| C2 | `## People`, `## Jobs` | `src/sim/{rng,state,people,jobs,tick}.ts`, `src/data/jobs.json`, `src/render/people.ts`, `tests/sim/people.test.ts` | 20 people appear as placeholder figures, walk to a job target, and `window.camp.step(100)` is deterministic for a fixed seed (test) |
| C3 | `## Buildings` | `src/sim/buildings.ts`, `src/data/buildings.json`, `src/scenes/Build.ts` (build menu + ghost placement), `tests/sim/buildings.test.ts` | the 4 buildings can be placed on valid tiles only, cost is deducted, workers can be assigned (test) |
| C4 | `## Resources`, `## Economy`, `## Wotakuye` | `src/sim/economy.ts`, `src/data/resources.json`, `src/scenes/Hud.ts` (resource bar + Wotakuye bar), `tests/sim/economy.test.ts` | gathering fills the store, hunger drains it each tick, starving lowers Wotakuye, low Wotakuye makes people leave (tests) |
| C5 | `## Orders`, `## UI` (selection panel) | `src/sim/orders.ts`, `src/scenes/Select.ts`, `tests/sim/orders.test.ts` | click and box-select highlight people, right-click moves or assigns, draft/undraft works (test + manual) |
| C6 | `## Combat`, `## Waves` | `src/sim/{combat,waves}.ts`, `src/data/{enemies,waves}.json`, `tests/sim/{combat,waves}.test.ts` | the 30 s warning banner, 3 wolf waves, drafted hunters fight, a full loss of people or fire ends the run (tests) |
| C7 | `## UI`, `## Tests` | `src/scenes/Menu.ts`, `src/scenes/Hud.ts` (pause / 1x / 2x / 4x buttons, sending the `pause` and `speed` orders), `tests/smoke.spec.ts`, `playwright.config.ts`, `TESTING.md` | `npm run e2e` loads the game, starts a run and reaches wave 1 with no console errors; `npm run publish` writes `index.html` + `build/` |
| C8 (Opus + user, gate) | `DESIGN-slice.md`, `WORKLOG.md` | `WORKLOG.md`, a fix list in `handoff/from-claude.md` | the user plays the slice and says it feels right; the root landing link is added only after this and a push request |

## Phase D: saves (spec settled 2026-11-19, build next)

Spec: [DESIGN-saves.md](DESIGN-saves.md). Common rules as in Phase C; run
`npm run typecheck && npm test` (and `npm run e2e` in DS4). Storage access stays out of `src/sim`.

| # | Model | Reads | Writes | Done when |
|---|---|---|---|---|
| DS1 | Sonnet | `DESIGN-saves.md` `## Save file`, `## Reading a save`, `## Continue (loading)`, `## Tests`; `src/sim/state.ts` | `src/sim/save.ts` (`SAVE_VERSION`, `serialize`, `parseSave`, `loadState`), `tests/sim/save.test.ts` | the save tests in `## Tests` pass, including the 2500 + 1000 = 3500 determinism check |
| DS2 | Sonnet | `## Slots`, `## Storage failure`, `## Tests`; `src/sim/save.ts` | `src/save/slots.ts` (read / write / clear / list / import over an injectable `Storage`, `probe`), `tests/save/slots.test.ts` | the slots tests pass with an in-memory storage and a throwing one |
| DS3 | Sonnet | `## When it saves`, `## Continue (loading)`, `## Storage failure`; `src/scenes/Game.ts`, `src/scenes/Hud.ts` (end screen), `src/save/slots.ts` | `src/scenes/Game.ts` (create from `{ slot, seed }` or `{ slot, save }`, the 4 save triggers, clear on result, the once-per-run toast) | by hand: a run in slot 1 writes `campfire.slot.1` at day start, on pause and on tab hide; winning or losing removes it; typecheck and tests pass |
| DS4 | Sonnet | `## Menu`, `## HUD menu`, `## Storage failure`, `## Tests`; `src/scenes/{Menu,Hud}.ts`, `tests/smoke.spec.ts`, `TESTING.md` | `src/scenes/Menu.ts` (slot cards, inline delete, export, import, Enter), `src/scenes/Hud.ts` (Menu button + panel), `tests/smoke.spec.ts`, `TESTING.md` | `npm run e2e` passes the new smoke test (new camp -> day 2 save -> reload -> Continue, paused) with no console errors |
| DS5 (user, gate) | Opus | `DESIGN-saves.md`, `WORKLOG.md` | `WORKLOG.md`, a fix list in `handoff/from-claude.md` | the user plays: starts camps in two slots, quits, continues, exports, imports, deletes, and says it works |

## Phase D: seasons (spec approved 2026-11-19; S1-S7 done 2026-11-20, S7 passed by the user's playtest)

Spec: [DESIGN-seasons.md](DESIGN-seasons.md). Common rules as in Phase C; run
`npm run typecheck && npm test` (and `npm run e2e` when a scene changes). Easiest first.

| # | Model | Reads | Writes | Done when |
|---|---|---|---|---|
| S1 | Sonnet | `DESIGN-seasons.md` `## Calendar`, `## Seasonal numbers`, `## Text`; `src/sim/tick.ts` | `src/data/seasons.json`, `src/sim/seasons.ts` (`season`, `seasonLabel`, the day-start season toast), `tests/sim/seasons.test.ts` | the calendar and toast tests pass |
| S2 | Sonnet | `## Seasonal numbers` (gather, hunt, meals, cold, spring newcomers); `src/sim/{jobs,economy}.ts`, `src/data/{jobs,resources}.json` | `src/sim/{jobs,economy}.ts` (multipliers from `seasons.ts`), tests in `tests/sim/seasons.test.ts` | the rate, hunt-chance, meal-need, cold and spring-newcomer tests pass; the other 73 tests still pass |
| S3 | Sonnet | `## Seasonal numbers` (spoilage); `src/sim/economy.ts` | `src/sim/economy.ts` (day-start spoilage and its toast), tests | the spoilage tests pass |
| S4 | Sonnet | `## Pemmican and the drying rack` (resource and meals), `## Save format`; `src/sim/{state,economy,buildings,save}.ts`, `src/data/{resources,buildings}.json`, `tests/sim/save.test.ts` | the same files (`store.pemmican`, caps, meals eat food then pemmican, `SAVE_VERSION = 2`), `src/scenes/Hud.ts` (Pemmican in the bar) | the pemmican and save tests pass; a v1 file is unreadable |
| S5 | Sonnet | `## Pemmican and the drying rack` (rack and job), `## UI` (Build menu); `src/sim/{jobs,buildings,tick}.ts`, `src/scenes/Build.ts`, `src/render/placeholders.ts`, `art/manifest.json`, `art/ASSETS.md` | the same files (`drying_rack`, the `dry` job, a Build menu entry on key 5, placeholder art) | the drying test passes; by hand: a rack is built, a worker dries 6 food into 4 pemmican |
| S6 | Sonnet | `## UI` (resource bar, tint), `## Tests` (smoke); `src/scenes/Hud.ts`, `tests/smoke.spec.ts` | `src/scenes/Hud.ts` (`Spring, day 2` text, tint rectangle), `tests/smoke.spec.ts`, `TESTING.md` | `npm run e2e` passes the winter check with no console errors |
| S7 (user, gate) | Opus | `DESIGN-seasons.md`, `WORKLOG.md` | `WORKLOG.md`, a fix list in `handoff/from-claude.md` | the user plays through the first winter (day 10+) and says it is painful but survivable |

## Phase D: upgrades (tier 1; spec approved 2026-11-20)

Spec: [DESIGN-upgrades.md](DESIGN-upgrades.md). Common rules as in Phase C; run
`npm run typecheck && npm test` (and `npm run e2e` when a scene changes). Easiest first.

| # | Model | Reads | Writes | Done when |
|---|---|---|---|---|
| U1 | Sonnet | `## Gift value`, `## Upgrades` (table), `## Data`, `## Save format`; `src/sim/{state,economy,save}.ts`, `src/data/resources.json` | `src/data/upgrades.json`, `src/sim/upgrades.ts` (`buyUpgrade`, `hasUpgrade`), `src/sim/{state,economy,save}.ts` (`gift`, `upgrades`, daily gift, `SAVE_VERSION = 3`), `tests/sim/{upgrades,save}.test.ts` | the gift, buying and save tests pass; a v2 file is unreadable |
| U2 | Sonnet | `## Upgrades` (dogs, bows); `src/sim/{jobs,combat}.ts`, `src/data/enemies.json` | `src/sim/{jobs,combat}.ts`, tests in `tests/sim/upgrades.test.ts` | the dogs and bows tests pass; the other tests still pass |
| U3 | Sonnet | `## Upgrades` (healers' lodge, `heal`, cold), `## Data`; `src/sim/{jobs,buildings,economy}.ts`, `src/data/{buildings,jobs}.json` | the same files (`healers_lodge` with `requires`, the `heal` job, the cold ease), tests | the lodge, heal and cold tests pass |
| U4 | Sonnet | `## UI`; `src/scenes/{Hud,Build}.ts`, `src/render/placeholders.ts`, `art/manifest.json`, `art/ASSETS.md` | the same files (Gift in the bar, Upgrades panel and key U, Build entry on key 6, placeholder art, toasts) | by hand: a panel buy takes gift and goods; the lodge appears in the Build menu only after `healers` |
| U5 | Sonnet | `## Tests` (smoke); `tests/smoke.spec.ts`, `TESTING.md` | `tests/smoke.spec.ts`, `TESTING.md` | `npm run e2e` passes the upgrades case with no console errors |
| U6 (user, gate) | Opus | `DESIGN-upgrades.md`, `WORKLOG.md` | `WORKLOG.md`, a fix list in `handoff/from-claude.md` | the user plays a run, buys at least one upgrade, and says the gift pacing feels right |

## Phase D: upgrades tier 2 (spec approved 2026-11-20)

Spec: [DESIGN-upgrades-2.md](DESIGN-upgrades-2.md). Common rules as in Phase C; run
`npm run typecheck && npm test` (and `npm run e2e` when a scene changes). Easiest first.

| # | Model | Reads | Writes | Done when |
|---|---|---|---|---|
| V1 | Sonnet | `## Waves 5 and 6`; `src/data/waves.json`, `src/sim/waves.ts`, `tests/sim/waves.test.ts` | `src/data/waves.json` (waves 5-6, `winAfterWave` 6), `DESIGN-slice.md` wave table, tests | the wave tests pass; the run is won after wave 6 |
| V2 | Sonnet | `## Upgrades`, `## Tools`, `## Data`; `src/sim/{upgrades,jobs}.ts`, `src/data/upgrades.json` | the same files (`requires` check in `buyUpgrade`, four new upgrades, `buildSpeed`), `tests/sim/upgrades2.test.ts` | the requirement and tools tests pass |
| V3 | Sonnet | `## Scouts' lodge`; `src/sim/{waves,jobs,buildings}.ts`, `src/data/{buildings,jobs}.json` | the same files (`scouts_lodge`, `scout` job, early warning, `scouted`) | the scout tests pass |
| V4 | Sonnet | `## Builders: traps and fire pits`; `src/sim/{buildings,combat}.ts`, `src/data/{buildings,enemies}.json` | the same files (`trap`, `fire_pit`, wolf slowing and trap damage) | the trap and fire pit tests pass |
| V5 | Sonnet | `## Warriors' lodges`; `src/sim/{buildings,combat,jobs}.ts`, `src/data/{buildings,enemies,jobs}.json` | the same files (`lancers_lodge`, `archers_lodge`, `drill` job, `fighterOf`) | the lancer and archer tests pass |
| V6 | Sonnet | `## Save format`; `src/sim/save.ts`, `tests/sim/save.test.ts` | `SAVE_VERSION = 4`, tests | a v3 file is unreadable; a v4 round trip keeps `scouted` |
| V7 | Sonnet | `## UI`; `src/scenes/{Hud,Build}.ts`, `src/render/placeholders.ts`, `art/manifest.json`, `art/ASSETS.md` | the same files (seven-card panel, Build pages on Tab, banner count, toasts, placeholder art) | by hand: a tier 2 buy needs its tier 1 upgrade; the Societies page shows only unlocked entries |
| V8 | Sonnet | `## Tests` (smoke); `tests/smoke.spec.ts`, `TESTING.md` | `tests/smoke.spec.ts`, `TESTING.md` | `npm run e2e` passes the tier 2 case with no console errors |
| V9 (user, gate) | Opus | `DESIGN-upgrades-2.md`, `WORKLOG.md` | `WORKLOG.md`, a fix list in `handoff/from-claude.md` | the user plays to wave 6, buys at least one tier 2 upgrade, and says the pacing feels right |

## Phase D: Wotakuye help (done 2026-11-20, before U6)

Spec: [DESIGN-upgrades.md](DESIGN-upgrades.md) `## Wotakuye help`.

| # | Model | Reads | Writes | Done when |
|---|---|---|---|---|
| H1 | Sonnet | `## Wotakuye help`; `src/sim/{economy,upgrades,seasons}.ts`, `src/data/resources.json` | `src/sim/help.ts`, `src/sim/economy.ts` (exports `BANDS`, `EV`), `tests/sim/help.test.ts` | the help tests pass |
| H2 | Sonnet | `## Wotakuye help`; `src/scenes/Hud.ts`, `tests/smoke.spec.ts` | `src/scenes/Hud.ts` (`?`, tooltip, `window.camp.wotakuyeTip`), `tests/smoke.spec.ts`, `TESTING.md` | `npm run e2e` passes the hover case; a screenshot shows the tooltip fits |

## Phase D (remaining, each gets its own spec and rows)

Seasons and hardships; autosave (3 slots) + export/import; eras 2-3 and bosses; upgrade tiers 1-3;
moving camp (travois); art batches (Claude writes prompts per [art/PIPELINE.md](art/PIPELINE.md),
Codex generates, the user approves, the manifest flips placeholder -> final). Each phase D item gets
its own B-style spec task (Opus) and C-style build rows, written into this file when D starts.
