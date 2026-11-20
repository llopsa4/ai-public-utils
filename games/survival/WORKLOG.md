# Survival current status

Updated 2026-11-19. Shared procedure: [WORKFLOW.md](../WORKFLOW.md).
Per-agent activity and requests: [from Claude](handoff/from-claude.md), [from Codex](handoff/from-codex.md).
Finished tasks and their details are in Git history (`git log -- games/survival`).

## Mode
- **Claude only (Codex paused)** since 2026-11-19. The user works only with Claude for now; Codex
  joins later to generate art. Image generation is queued as requests for Codex in
  [handoff/from-claude.md](handoff/from-claude.md).

## Current state
- **Build stage.** [DESIGN-slice.md](DESIGN-slice.md) approved by the user 2026-11-19. C1-C4 done
  2026-11-19: scaffold, map, camera; 20 people who walk, gather, chop, haul, build, hunt and
  deliver; four buildings from a build menu (B, then 1-4, left-click); hunger, two evenly shared
  meals a day, starvation, deaths, Wotakuye with its bands and day-start effects; a HUD with the
  resource bar and the Wotakuye bar. C5 done 2026-11-19: click and box select, right-click move /
  gather / chop / build / assign, draft (R), stance (Z X C), Delete, Space pause, 1-3 speed, a
  selection panel and toasts. C6 done 2026-11-19: `combat.ts` (bow/club fighters by stance, wolves,
  undrafted people flee to the fire), `waves.ts` (30 s warning, 3 waves, won/lost result), the
  `attack` order (right-click a wolf), placeholder wolves, a wave banner and an end screen in the HUD.
  C7 done 2026-11-19: `Menu.ts` (Start, Random seed, controls), pause / 1x / 2x / 4x buttons in the
  HUD, "Play again" returns to the menu, `npm run e2e` smoke test, `TESTING.md`, `npm run publish`
  writes `index.html` + `build/` (local only). 60 tests pass. C7 files are not committed; nothing pushed.

## Open items
- CULTURE.md: the user decided 2026-11-19 (keep Tiyospaye and Wotakuye, free-form camp, generic
  seasons, abstract gift value). *Akicita* approved for the scouts/warriors society (use it in C6);
  hunters, healers and builders stay in English.
- Untested by hand: mouse-edge pan and WASD pan; shift-click toggle; Delete on a site; 1-3 speed keys.
- Untested by hand: wolves, fighting, the banner and the end screen (only the sim is tested).
- Hungry-bowl icon added 2026-11-19 in `Select.ts` (`drawWorld`, shown at hunger >= 70); untested by
  hand. Toasts live in `Select.ts` for now (a later HUD task may move them).
- Untested by hand: the pause / speed buttons and Play again (e2e covers menu -> run -> wave warning).
- Decided 2026-11-19 (user delegated): map deviations are now in the spec; drafted people keep
  their worker slot; balance is left to C8.
- Balance to judge at C8: 10 unhoused people cost 10 Wotakuye a day against +4 from meals, so the
  start camp slides into Quarrelling by about day 7 unless tipis are built; people walk 1.0
  tiles/s (doubled in C8), so a tipi takes about 1 minute to supply.

## Next action
- C8 passed 2026-11-19: the user played the slice and said "all good" (no further fixes; the balance
  items above stand as they are). The root landing link is still not added: it needs a push request.
- Phase D, saves first (user, 2026-11-19). Spec settled by grilling: [DESIGN-saves.md](DESIGN-saves.md).
  DS1 done 2026-11-19 (`src/sim/save.ts`, `tests/sim/save.test.ts`; 65 tests pass, uncommitted).
  DS2 done 2026-11-19 (`src/save/slots.ts`, `tests/save/slots.test.ts`; 73 tests pass, uncommitted).
  DS3 done 2026-11-19 (`Game.ts`: create from `{ slot, seed }` or `{ slot, save }`, the 4 save
  triggers via `saveNow()`, slot cleared on a result, once-per-run toast; checked in a browser with a
  throwaway Playwright script, since the menu cannot pick a slot until DS4; uncommitted).
  DS4 done 2026-11-19 (`Menu.ts` slot cards with Continue / Export / Delete (inline Yes / No) /
  Import and Enter; `Hud.ts` Menu button and panel; `src/save/files.ts`; the smoke test has a saves
  case; 73 tests and `npm run e2e` pass; Export, Import, Delete, Save and quit and Resume checked in
  a browser with a throwaway script; uncommitted).
  DS5 passed 2026-11-19: the user played the saves ("Done", no fixes raised). DS1-DS5 are uncommitted.
  Next item chosen 2026-11-19: **seasons**. Grilled Q1-Q4 (3-day seasons, start in spring, four
  effects, painful-but-survivable winter); spec drafted in [DESIGN-seasons.md](DESIGN-seasons.md) with
  proposed numbers, plan rows S1-S7 in [PLAN.md](PLAN.md). Waiting for the user to approve the numbers
  (and to accept that v1 saves become unreadable once `SAVE_VERSION` is 2).
  Approved by the user 2026-11-19. S1-S3 done 2026-11-19 (`src/data/seasons.json`, `src/sim/seasons.ts`;
  gather and hunt rates, winter meal need and cold, spring newcomers and spoilage in `jobs.ts` and
  `economy.ts`; `tests/sim/seasons.test.ts`; 81 tests pass; uncommitted). `stepFed` in
  `tests/sim/helpers.ts` now also switches spoilage off.
  **Problem found:** the slice is won by defeating wave 3, which arrives at tick 10800 = the first
  winter day, so a player never sees winter. Waiting for the user's call on how to lengthen the run.
  S4 (pemmican, save v2) and S5 (drying rack) do not depend on it.
  2026-11-20: the user chose **wave 4** (tick 14400, 7 wolves + a pack leader; the run is won after it),
  so the first winter is played. S4-S6 done 2026-11-20: pemmican (`store.pemmican`, cap 100 a store,
  meals eat food then pemmican at 1.5, `SAVE_VERSION` 2, so old camps read as Unreadable), the drying
  rack (build menu key 5, `dry` job: 6 food -> 4 pemmican, placeholder art), the HUD text
  `Spring, day 1` + Pemmican + a season tint, and a smoke test. 85 tests and `npm run e2e` (3 tests)
  pass; all uncommitted. Checked by screenshot (HUD, tint, five-slot build menu); not checked by hand:
  placing a rack with key 5 and watching a worker dry.
  Next: S7, the user plays through the first winter (day 10 on) and judges the balance.
  Other Phase D items (seasons, eras, upgrades, moving camp, art) wait until saves are done.
