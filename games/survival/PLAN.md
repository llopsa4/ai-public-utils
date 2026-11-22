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
   tipis), warm hand-painted look; camera pan (edge/WASD) + wheel zoom. One **asset manifest** (key,
   size, anchor, frames, status placeholder|final): the game loads final art when present, else the
   placeholder, so Codex swaps art per asset. *Amended 2026-11-20 (user):* **Codex draws, Claude never
   does**; the existing code placeholders stay until replaced, new keys use grey stand-ins; art
   direction in [DESIGN-art.md](DESIGN-art.md).
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
    handoff (mode Codex + Claude from 2026-11-20, user); development/testing guides written by C1/C7; nothing pushed.

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
- Gates (the user approves): **B1 slice spec**, **C8 slice playtest**, the art style keys **AB0** and
  **AB12** (Claude approves the other art batches, [art/PIPELINE.md](art/PIPELINE.md) *Approval*).

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

## Phase D: upgrades tier 3 (spec drafted 2026-11-20)

**Saving is parked (user, 2026-11-20, until further notice):** no row below, and no new task, adds or
changes save code, `SAVE_VERSION`, save fields or save tests. New state may be left out of `serialize` /
`parseSave`; existing save code stays as it is.

Spec: [DESIGN-upgrades-3.md](DESIGN-upgrades-3.md). Common rules as in Phase C; run
`npm run typecheck && npm test` (and `npm run e2e` when a scene changes). Easiest first. Each row also reads
its spec section.

| # | Model | Reads | Writes | Done when |
|---|---|---|---|---|
| W1 | Sonnet | `## Waves 7 and 8`; `src/data/waves.json`, `src/sim/waves.ts`, `tests/sim/waves.test.ts` | the same files (waves 7-8, two-edge groups, `winAfterWave` 8), `DESIGN-slice.md` wave table | the wave tests pass; the run is won after wave 8 |
| R1 | Sonnet | `## Resource icons`; `src/scenes/Hud.ts`, `src/render/placeholders.ts`, `art/ASSETS.md`, `art/SPEC.md` | `icon_food`, `icon_wood`, `icon_hides`, `icon_pemmican`, `icon_gift` placeholders drawn before each bar number; the register | a 1280x720 screenshot shows the bar with icons; `npm run e2e` passes |
| R2 | Sonnet | `## Open store on hover`; `src/render/placeholders.ts`, `src/scenes/{Game,Select}.ts`, `src/sim/economy.ts` | `building_store_open`, `pile_<res>_<1-4>` placeholders; hover swap and piles; `art/ASSETS.md` | screenshots of a closed and an open store (empty, half, full); no sim change; e2e passes |
| W2 | Sonnet | `## Labels (Dakota)`; `CULTURE.md`, `src/data/{upgrades,buildings}.json` | `CULTURE.md` *Needs review* (one sourced candidate per label), empty `dakota` fields, `src/sim/labels.ts` (`displayLabel`) | every label has a sourced candidate or "none found"; the user is asked |
| W3 | Sonnet | `## Upgrade homes`; `src/sim/upgrades.ts`, `src/data/upgrades.json`, `src/scenes/{Hud,Select}.ts`, `tests/sim/upgrades*.test.ts`, `tests/smoke.spec.ts` | `home` and `band` per upgrade; `buyUpgrade` checks them; the building-panel Upgrades list; the U panel, key and button removed; tests | the tests pass; the e2e test buys from the hunting lodge |
| W4 | Sonnet | `## Horses and riders`; `src/data/{buildings,jobs,upgrades}.json`, `src/sim/{jobs,state,save,economy}.ts` | the corral, `tend`, `horses` (+ `icon_horses`), Breed horses, `SAVE_VERSION` 5 | tests: breeding while tended, the cap, a v4 file unreadable |
| W5 | Sonnet | `## Horses and riders`; `src/sim/{combat,orders}.ts`, `src/data/enemies.json` | mounted lancer stats, horse take/return on draft, lost on death | tests: mounted beats on foot; horse counts after draft, undraft, death |
| W6 | Sonnet | `## Spirit lodge and powers`; `src/sim/{upgrades,state,orders}.ts`, `src/data/buildings.json` | Spirit society and lodge, the four power upgrades, `powers` state, the `cast` order | tests: United and prerequisite to buy; once per wave; refused below Steady |
| W7 | Sonnet | `## Spirit lodge and powers`; `src/sim/{combat,state}.ts`, `src/render/enemies.ts` | allies (Spirit warriors, Guardian wolves); no save work (parked) | tests: allies fight wolves, never people, vanish after 600 ticks |
| W8 | Sonnet | `## Spirit lodge and powers`; `src/sim/{combat,state}.ts` | the bison lane and the storm; no save work (parked) | tests for both; people unharmed |
| W9 | Opus | `## Spike barricades`; `src/sim/{people,combat,buildings}.ts`, `src/scenes/{Build,Select}.ts` | the barricade, wolf A* (only barricades block), replan, attacking a closed line, drag placement | tests: around a gap, through a closed line by breaking it; people blocked |
| W10 | Sonnet | `## UI`, `## Tests`; `src/scenes/{Hud,Build,Select}.ts`, `src/render/placeholders.ts`, `art/ASSETS.md`, `tests/smoke.spec.ts`, `TESTING.md` | the power bar (F1-F4, aiming, Esc), Societies keys 1-7, placeholders, Dakota labels and hovers | `npm run e2e` passes (stable over 5 runs); screenshots of the power bar and a building's Upgrades list |
| W11 (user, gate) | Opus | `DESIGN-upgrades-3.md`, `WORKLOG.md` | `WORKLOG.md`, a fix list in `handoff/from-claude.md` | the user plays to wave 8, buys from building panels, casts a power, and says it is fine |

## Phase D: Wotakuye help (done 2026-11-20, before U6)

Spec: [DESIGN-upgrades.md](DESIGN-upgrades.md) `## Wotakuye help`.

| # | Model | Reads | Writes | Done when |
|---|---|---|---|---|
| H1 | Sonnet | `## Wotakuye help`; `src/sim/{economy,upgrades,seasons}.ts`, `src/data/resources.json` | `src/sim/help.ts`, `src/sim/economy.ts` (exports `BANDS`, `EV`), `tests/sim/help.test.ts` | the help tests pass |
| H2 | Sonnet | `## Wotakuye help`; `src/scenes/Hud.ts`, `tests/smoke.spec.ts` | `src/scenes/Hud.ts` (`?`, tooltip, `window.camp.wotakuyeTip`), `tests/smoke.spec.ts`, `TESTING.md` | `npm run e2e` passes the hover case; a screenshot shows the tooltip fits |

## Phase D: hunting and camp life (spec accepted 2026-11-20)

Saving stays parked: no row adds or changes save code. Spec: [DESIGN-hunting.md](DESIGN-hunting.md). Common rules
as in Phase C; run `npm run typecheck && npm test` (and `npm run e2e` when a scene changes). Easiest first; each
row also reads its spec section. W11 (tier 3 playtest) was closed by the user 2026-11-20.

| # | Model | Reads | Writes | Done when |
|---|---|---|---|---|
| G1 | Sonnet | `## Carried goods`; `src/scenes/Select.ts` (`drawPanel`) | `carryText` (pure, in `src/sim/labels.ts` or a new helper), the panel line | unit test for `carryText`; a screenshot of the line |
| G2 | Sonnet | `## Names`; `src/scenes/Select.ts` (`drawWorld`), `src/data/map.json` (families) | pooled name + family labels under selected people | a screenshot: two selected people labelled, none for others |
| G3 | Sonnet | `## Store`, `## Start camp`; `src/data/{buildings,map}.json`, `src/sim/map.ts`, `src/render/{placeholders,stores}.ts`, `art/manifest.json`, `tests/{stores.test.ts,smoke.spec.ts}`, `tests/sim/buildings.test.ts` | store 4x4 and caps x4, the store at its new start tile, bigger store and open-store art, `ROOF_PX` / `SPOTS` / `PILE_SCALE`, tests, `art/{ASSETS,SPEC}.md` | tests and e2e pass; screenshots of the closed and open store |
| G4 | Opus | `## Council plaza` (footprint and art), `## Start camp`; `src/data/{buildings,map}.json`, `src/sim/{state,map,buildings,combat,waves}.ts`, `src/render/placeholders.ts`, `src/scenes/Game.ts`, `art/manifest.json`, `tests/sim/*` | fire 4x4 and the new start layout, the plaza art (fire, mats, seats, decoration), every use of the fire tile or centre checked | all tests pass; wolves still go for the fire, people flee to it; a screenshot of the plaza and the start camp |
| G5 | Sonnet | `## Right-click feedback`; `src/scenes/Select.ts` (`rightClick`, `drawWorld`, `update`), `src/render/enemies.ts` | pings, target pulse, grey refusal ring and toast, a `window.camp` hook for the last ping | e2e right-clicks ground, a tree and a wolf and reads the hook; screenshot |
| G6 | Sonnet | `## Work animations`; `src/render/{people,placeholders}.ts`, `src/sim/jobs.ts` (task shapes only) | hammer, axe, pick and drying overlays (the hammer only while the site has its materials) | screenshots of each; no console errors |
| G7 | Opus | `## No shared standing tile`; `src/sim/{buildings,jobs,combat,orders}.ts`, `tests/sim/*` | the occupancy rule in every spot picker, waiting when full, `spreadTargets` without duplicates | tests: 3 builders, 4 deliverers, 4 fleeing and a group move end on distinct tiles; determinism holds |
| G8 | Sonnet | `## Council plaza` (sitting); `src/sim/jobs.ts` (`wander`, `idleTask`), `src/render/people.ts` | idle people walk to a free ring tile of the plaza and sit (drawn seated), leave on work | tests: idle people sit on distinct tiles and leave on an order; screenshot |
| G9 | Opus | `## Full store`; `src/sim/{jobs,orders,buildings}.ts`, `tests/sim/*` | orders override a stuck delivery, auto-switch to free work, drop at a site that needs the goods, `Store is full` toast | tests with a forced full store |
| G10 | Opus | `## Wild game`, `## Hunting`; `src/sim/{state,tick,jobs,orders,waves,combat,help}.ts`, `src/data/{jobs,seasons,upgrades}.json`, `src/scenes/Select.ts` (effect lines), `tests/sim/{upgrades,seasons}.test.ts` | `src/data/animals.json`, `src/sim/animals.ts`, `GameState.animals`, the hunt job rewritten, the hunt and fetch orders, help and effect text, tests | the `## Tests` hunting tests pass; the rewritten upgrade and season tests pass; determinism holds |
| G11 | Sonnet | `## Arrows`; `src/sim/combat.ts` (`stepFighter`), `src/render/{enemies,people}.ts` | arrows drawn from shots (render-side, no state), a bow on hunters | screenshots: arrows at an animal and at a wolf |
| G12 | Sonnet | `## Hunting` (drawn, orders); `src/render/{enemies,placeholders}.ts`, `art/manifest.json`, `src/scenes/Select.ts` | placeholder deer, bison, carcass, a load on the back, right-click an animal or carcass, the panel for an animal | e2e: a right-click on an animal gives the hunters that order; screenshot |
| G13 | Sonnet | `## Music`; `src/scenes/{Hud,Game}.ts`, `CULTURE.md`, `DEVELOPMENT.md` | `src/audio/{music,theory}.ts`, the HUD menu toggle and volume, the browser preference, `window.camp.music()` | unit tests for the pure helpers and mode switching; e2e: toggle and mode; the user listens |
| G14 | Sonnet | `## Tests`; `tests/smoke.spec.ts`, `TESTING.md`, `src/scenes/Menu.ts` (controls text) | the remaining e2e cases, docs, WORKLOG and handoff | all unit and e2e tests pass, stable over 3 runs |
| G15 (user, gate) | Opus | `DESIGN-hunting.md`, `WORKLOG.md` | `WORKLOG.md`, a fix list in `handoff/from-claude.md` | the user plays a hunt to the store, a bison over three trips, the plaza, the feedback and the music, and says it is fine |

### G16-G19: added by the user 2026-11-20, done before G7

Spec: `DESIGN-hunting.md` `## Stock items`, `## People icon and berry patch panel`, `## Start camp`. Easiest first.

| # | Model | Reads | Writes | Done when |
|---|---|---|---|---|
| G16 | Sonnet | `## People icon and berry patch panel`; `src/scenes/Hud.ts` (`update`, `drawBar`), `src/render/placeholders.ts`, `art/manifest.json` | `icon_people`, the bar's people icon and `People` hover | e2e: `hudBar()` shows `icon_people` with the head count; screenshot |
| G17 | Sonnet | `## Start camp`; `src/data/map.json`, `tests/sim/*` that depend on distances from the store | the start store at [22, 17], behind the fire | tests and e2e pass; a screenshot shows the whole plaza uncovered |
| G18 | Sonnet | `## People icon and berry patch panel`; `src/scenes/Select.ts` (`clickSelect`, `drawPanel`) | the berry bush panel, `window.camp.panelText()` | e2e clicks a bush and reads `17 of 40 fruit left`; Esc closes it |
| G19 | Opus | `## Stock items`; `src/render/{stores,placeholders}.ts`, `art/manifest.json`, `tests/stores.test.ts`, `tests/smoke.spec.ts` | `itemCount`, `itemSlot`, four item props, the 0 / 20 / 40 e2e case, `art/{ASSETS,SPEC}.md`, `TESTING.md` | unit tests for counts and slots (on the floor, layered, distinct); e2e; zoomed screenshot |

### G20-G24: added by the user 2026-11-20 (villager panel builds), after G15

Spec: `DESIGN-hunting.md` `## Villager panel and building`. Easiest first. Saving stays parked: no row adds or
changes save code.

| # | Model | Reads | Writes | Done when |
|---|---|---|---|---|
| G20 | Sonnet | `## Villager panel and building`; `src/scenes/Select.ts` (`labels`, `placeLabel`, `drawWorld`) | remove the labels under people's feet (undoes G2); rings stay | a screenshot shows no names on the map; tests pass |
| G21 | Sonnet | same; `src/scenes/Select.ts` (`create`, `drawPanel`) | title in 20 px bold serif, gold, with a rule under it; family line in the family colour; `panelText()` unchanged | screenshots of a person, a group, a building and a berry patch; e2e passes |
| G22 | Opus | same; `src/sim/{orders,buildings,jobs,state}.ts`, `tests/sim/*` | `place` takes `builders` (cap 3, skips drafted and non-workers, the others keep their jobs, a toast); `lineId` on line sites, and builders move on to the next unfinished site; no save code | tests: at most 3 assigned and the others unchanged; builders work a barricade line in order; determinism holds |
| G23 | Sonnet | same; `src/scenes/{Build,Select,Game}.ts`, `src/scenes/Hud.ts` (Build references only), `tests/smoke.spec.ts` | full-width panel with the cards on its right; corner button and standalone menu removed; cards only when someone can build; B arms, then 1-7; 1-3 set speed when not armed; placement sends the selection snapshot; `HINT` text; e2e build steps select people first | e2e passes; by hand: 5 adults place a tipi, 3 build and 2 keep working; a children-only selection shows no cards |
| G24 (user, gate) | Opus | `## Villager panel and building`, `WORKLOG.md` | `WORKLOG.md`, `TESTING.md` hand checks, a fix list in `handoff/from-claude.md` | the user builds from the panel, including a barricade line, and says it is fine |

## Phase D: bigger map and minimap (spec settled 2026-11-20)

Spec: [DESIGN-map.md](DESIGN-map.md) (grilled with the user, Q1-Q9). Saving stays parked: no row adds or
changes save code. Common rules as in Phase C; run `npm run typecheck && npm test` (and `npm run e2e` when a
scene changes). Easiest first; each row also reads its spec section.

| # | Model | Reads | Writes | Done when |
|---|---|---|---|---|
| M1 | Sonnet | `## Size`, `## Generation`, `## Start camp`; `src/data/{map,animals}.json`, `src/sim/{map,animals,people}.ts`, `tests/iso.test.ts` | the new numbers in `map.json` / `animals.json`, generation for a 4-wide river, 2 fords, 12 patches and 12 herds in two rings, the path cap, the moved camp; the map test | the `## Tests` map test passes; same seed, same map |
| M2 | Sonnet | `## Size`, `## Wolves and powers`, `## Camera`; `src/sim/{effects,waves}.ts`, `src/render/iso.ts`, `src/scenes/Game.ts` (camera), `tests/sim/*`, `tests/smoke.spec.ts` | every hard-coded 48 / 47 / 24 reads `map.size`; the 48-tile stampede; pan 900 px/s; tests made layout-proof | all unit and e2e tests pass; wolves reach the fire from an edge; a screenshot of the start camp at map centre |
| M3 | Sonnet | `## Drawing`; `src/scenes/Game.ts` (ground drawing, the felled-tree swap) | chunked ground only if the fps check fails; a note of the fps in the handoff | fps at zoom 0.5 measured and noted (>= 55, or chunking added and re-measured); no console errors |
| M4 | Sonnet | `## Minimap` (place, layers); `src/scenes/Hud.ts`, `src/render/iso.ts` | `src/render/minimap.ts` (pure tile <-> minimap maths), the minimap in the HUD with its six layers, a `window.camp.minimap()` hook | unit test for the maths; screenshot of the minimap at game start and during a wave |
| M5 | Sonnet | `## Minimap` (mouse), `## Tests`; `src/scenes/{Hud,Select,Game}.ts`, `tests/smoke.spec.ts`, `TESTING.md`, `src/scenes/Menu.ts` (controls text) | left-click / drag pans, right-click moves the selection, clicks never reach the world, works while placing or aiming; e2e case; docs | e2e passes (stable over 3 runs); controls text mentions the minimap |
| M6 (user, gate) | Opus | `DESIGN-map.md`, `WORKLOG.md` | `WORKLOG.md`, a fix list in `handoff/from-claude.md` | the user plays a run on the big map with the minimap and says it is fine (balance judged here) |

## Phase D: art (spec settled 2026-11-20)

Spec: [DESIGN-art.md](DESIGN-art.md) (grilled with the user, 2026-11-20); the bible
[art/STYLE.md](art/STYLE.md), numbers [art/SPEC.md](art/SPEC.md), procedure
[art/PIPELINE.md](art/PIPELINE.md), batch briefs [art/BATCHES.md](art/BATCHES.md). **Codex draws,
Claude never does:** every AC row below is code only, draws no art, and new keys use the grey
stand-ins of AC2. No row adds or changes save code (saving is parked). Common rules as in Phase C;
run `npm run typecheck && npm test` (and `npm run e2e` when a scene changes). Each AC row also reads
its SPEC.md sections and `WORKLOG.md`.

### Claude: support code first (easiest first)

| # | Model | Reads | Writes | Done when |
|---|---|---|---|---|
| AC1 | Sonnet | SPEC.md 3, 4, 5, 8, 9; `art/manifest.json`, `src/render/manifest.ts`, `src/scenes/Boot.ts` | `art/manifest.json` v2 with every key of SPEC.md (status kept), `src/render/manifest.ts` types, `scripts/art/validate.mjs` (`npm run art:validate [-- --inbox ABn]`), `tests/art/validate.test.ts` | the test passes on a good and on a broken sample inbox (size, border, count, name, layer alignment); the current manifest validates |
| AC2 | Sonnet | SPEC.md 3, 8; `scripts/publish.mjs`, `package.json` | `scripts/art/pack.mjs` (`npm run art:pack -- ABn`; maxrects-packer + pngjs, MIT), `scripts/art/standins.mjs` (`npm run art:standins`: plain grey boxes with the key and frame name, exact cells, into git-ignored `art/standins/`), `package.json` scripts and devDependencies | stand-ins for every key pack into atlases within the 16-page budget; the packed JSON is in Phaser's multiatlas format (unit test) |
| AC3 | Sonnet | SPEC.md 1, 8, 9; `src/scenes/Boot.ts`, `src/render/placeholders.ts`, `src/main.ts`, `vite.config.ts` | Boot loads `art/atlas/*.json` multiatlases for `final` keys (and `art/standins/` only with `?standins`), a loading bar, a `spriteFor(key)` helper drawing at scale 0.5 with the manifest anchor; placeholders kept as fallback | with `?standins` the game starts with grey boxes and no console errors; without it the game looks as today; e2e passes |
| AC5 | Sonnet | SPEC.md 6, 7; `src/scenes/Game.ts` (ground), `src/sim/map.ts`, `src/data/seasons.json` | seeded variant pick per tile, bank masks, spills, season swap of tiles and plants, trees and stump from `tree_*` / `stump_*` | unit test for the mask maths; with `?standins` banks and spills show their mask labels along the river |
| AC6 (done 2026-11-20) | Sonnet | SPEC.md 5; `src/scenes/Game.ts` (`syncBuildings`), `src/render/stores.ts` | stage by build progress, winter state, drying-rack loop, barricade masks from neighbours, `fx_flame` on the fire and fire pits | unit test for the stage and mask picks; stand-ins show the right state label while building |
| AC8 (done 2026-11-20) | Sonnet | SPEC.md 10; `src/scenes/{Hud,Select,Build,Menu,MinimapView}.ts`, `tests/smoke.spec.ts` | Phaser NineSlice panels and buttons with 4 states, icons by key, CSS cursors with `image-set`, Alegreya (OFL) woff2 bundled, title screen with `art/title.jpg` and a code-drawn title; smoke-test icon keys updated | e2e passes; with stand-ins the UI shows labelled boxes in every slot; no text overlaps at 1280x720 |
| AC4 | Opus | SPEC.md 4; `src/sim/{state,people,tick}.ts`, `src/render/people.ts`, `tests/sim/people.test.ts` | sex field assigned deterministically at spawn (no save code), facing from screen-space velocity (8 sectors), the state/job-to-animation map (STYLE.md section 5), stacked base + cloth sprites with the family tint, child fade on death | tests: same seed, same sexes; the facing maths; with stand-ins every job shows its animation label in both family tints |
| AC7 (done 2026-11-21) | Opus | SPEC.md 3, 4; `src/render/{enemies,arrows}.ts`, `src/scenes/Game.ts`, `src/sim/{animals,combat,effects}.ts` | wolves (pack leader and guardian by scale and tint), deer, bison, corral and herd horses, mounted riders, carcass stages, fish, arrows, spirit ally, storm, hit and foot dust, build sparkle as sprites | with stand-ins a wave, a hunt, a storm cast and a rider charge show the right labels; e2e passes |
| AC9 (done 2026-11-21; result is under the target at zoom 0.5, see the handoff) | Sonnet | `DESIGN-art.md` *Budget*; `src/scenes/Game.ts` | a note in `handoff/from-claude.md` (fps and GPU memory) | with full stand-in atlases, >= 55 fps with 200 people at zoom 0.5, or the 1.5x fallback is proposed to the user |

### Codex: art batches (Codex generates and, after approval, installs)

Every row reads `art/STYLE.md`, `art/PIPELINE.md`, its SPEC.md rows and its
[BATCHES.md](art/BATCHES.md) section; writes `art/source/**` and `art/inbox/ABn/**`, then on install
`art/atlas/**`, `art/manifest.json`, `art/ASSETS.md`, `art/inbox/done/**`. Done when: the validator
passes, the batch is approved (authority below), it is installed, the tests pass and the screenshots
are in `handoff/from-codex.md`. Model: Codex (not Claude).

| # | Batch | Needs | Approval |
|---|---|---|---|
| AB0 | style keys: summer grass, tipi + `render.py`, panel and button, food icon, man concept sheet | none to generate; AC1-AC3 to install | user |
| AB1 | interface pieces, emblem | AC1-AC3, AC8 | Claude |
| AB2 | icons and cursors | AC1-AC3, AC8 | Claude |
| AB3 | ground, 5 types x 4 variants x 4 seasons | AC1-AC3, AC5 | Claude |
| AB4 | river banks and spills | AB3 | Claude |
| AB5 | plants, rocks, stump, store items | AC1-AC3, AC5 | Claude |
| AB6 | effects and flame | AC6, AC7 | Claude |
| AB7 | title picture | AC8 | Claude |
| AB8 | trap, fire pit, barricade pieces | AB0, AC6 | Claude |
| AB9 | gathering spot, hunting lodge, drying rack, corral | AB0, AC6 | Claude |
| AB10 | society lodges | AB9 | Claude |
| AB11 | fire plaza, store, open store | AB9 | Claude |
| AB12 | human rig, `render.py` for figures, man walk x 8 facings | AC4 | user |
| AB13 | man | AB12 | Claude |
| AB14 | woman | AB13 | Claude |
| AB15 | elder man | AB13 | Claude |
| AB16 | elder woman | AB14 | Claude |
| AB17 | child | AB12 | Claude |
| AB18 | wolf | AC7 | Claude |
| AB19 | deer | AC7 | Claude |
| AB20 | bison | AC7 | Claude |
| AB21 | horse | AC7 | Claude |
| AB22 | mounted rider | AB13, AB21 | Claude |
| AB23 | carcasses and fish | AB18-AB20 | Claude |

Claude's part in an AB row is only the review: check the contact sheet and screenshots against
STYLE.md and the approved keys, then write the approval or a fix list in `handoff/from-claude.md`
(Sonnet; Opus for the AB0 and AB12 reviews before the user decides).

## Phase D (remaining, each gets its own spec and rows)

Seasons and hardships; autosave (3 slots) + export/import; eras 2-3 and bosses; upgrade tiers 1-3;
moving camp (travois); fishing and dancing as activities (their art comes in AB13-AB17 and AB23); a
woman rider model (optional; riders use the man model until then). Each phase D item gets its own
B-style spec task (Opus) and C-style build rows, written into this file when D starts.
