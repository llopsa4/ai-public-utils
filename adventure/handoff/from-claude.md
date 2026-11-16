# Claude handoff

Written only by Claude; Codex reads it and never edits it. Procedure:
[WORKFLOW.md](../WORKFLOW.md#handoff-files).

## Working on
- Playtest fixes (user's list of 2026-11-16): code side done locally and tested (`npm test` 240 and
  `test:feature -- story saves crowd runtime` 227 pass; no browser). Claims released; art and
  placement items are request C6.

## Awaiting the user
- Nothing. Workflow audit (2026-11-15) committed in `da85ac3`, not pushed: root and FFCardGame
  `CLAUDE.md`, `AGENTS.md`, `PROMPTING.md`, `WORKFLOW.md`, `DEVELOPMENT.md`, `art/PIPELINE.md`,
  `art/REFERENCES.md`, handoff files, skill descriptions, `WORKLOG.md` and the briefs test.
  `CLAUDE-INBOX.md` and `art/CODEX.md` removed (old delivery records still mention them).
  Checked: typecheck, 239 fast and 90 art tests pass; links/anchors resolve; whitespace clean.

## Requests for Codex
- **C6 (2026-11-16) — open. Playtest fixes: art and placement** (user's list of 2026-11-16).
  Claude has done and tested the code side (gear stats layout in `src/kc/Armory.tsx`; chapter map
  after chapter 1: `src/engine/unlock.ts`, `src/chapters/ch1/progression.ts`; fights hide every
  person and the room sweeper, enemy at room size, Mara and the enemy apart with his hit landing on
  it: `src/game/room/fightBridge.ts`, `src/game/Crowd.ts`, `src/kc/kc-local.css`; walkers no longer
  freeze when blocked). Not yet seen in a browser: please check each in game. Decided with the user:
  - **Ashways sweeper:** the brown machine you see on entering (`art/src/objects/sweeper.png`) is
    the design before, during and after the fight. Both white-dome pictures are dropped
    (`art/src/kc/ash-sweeper.webp`, `art/src/props/ashways-sweeper-disabled.png`).
    (a) A fight-screen picture of the brown sweeper, same design and proportions (about 0.6 of
    Mara's height; a single trimmed frame from the idle frame, no new design): wire it in
    `src/kc/presentation.ts` with the ink ratio you measure (the fight code already sizes the
    enemy at room size, `ENEMY_HEIGHT` in `fightBridge.ts`). (b) A broken version of the same
    machine for after the fight, replacing `ashways-sweeper-disabled.png` (same footprint and
    anchor; `src/game/ashways.ts` places it, hotspot `sweeperDisabled` in `ch1/rooms.ts`).
    Prompts per [generation prompts](../art/PIPELINE.md#generation-prompts).
  - **Bryn's training rig** (chapter 2 sparring) gets its own fight picture, not the sweeper:
    brief `battle-enemy-rig` ("a caged brush drum on a sprung iron frame that swings back at whoever
    strikes it"); wire it in `presentation.ts` (`training-rig`) and drop the old placeholder.
  - **Sigrid:** recolour her existing drawing to warm light, healthy skin with a little
    cold-weather colour (rosy cheeks and lips) instead of the grey cast; rig, anchors and
    portraits otherwise unchanged. **Approval authority: user** for all art; do not install first.
  - Routine fixes (verify each in game): firing-house `stairs` hotspot (`ch1/rooms.ts`) moved
    left to sit on the painted stairs (painting unchanged); Kiln Hall name board moved off the
    moving pulley hoist (`sign` in the kiln hall room); intro cell: the tin plate lies on the
    floor by Silas's feet, not over the cage door (`intro/rooms.ts` `floorPlate`, `plate`); firing
    house regulator failure: the kids stand beside Nell instead of sitting on nothing; the
    Ashways brass pressure cell rests on its fixture instead of floating (`game/ashways.ts`, 190,237);
    gear screen: smaller tonic image and smaller HP numbers; the fight's enemy name fits its box.
  No commits unless asked.
- **C5 (2026-11-16) — done.** Bryn redrawn, approved by the user and installed by Codex; documentation reconciled with K3. Original request:
  Prompts:
  `art/inbox/bryn-redraw/r1/PROMPTS.md` (body, arm, kneel, lie; standard single-drawing set).
  User: no shield; she must look like a smith. Description updated in `art/descriptions.mjs`
  (`bryn`); regenerate her brief. Deliver in `art/inbox/bryn-redraw/r1/` with previews of her
  in the workshop, built at full detail like C4. Re-measure her rig entry on the new drawings.
  **Approval authority: user.** Do not install before approval. No commits unless asked.
- **C4 (2026-11-16) — done.** Guard and the twelve other characters installed by Codex; style rule reconciled with K3
  (`art/STYLE.md`, `art/LAYERED-RIG.md`). Original request: Give the older-style characters Mara's pixel detail. The user
  wants every character at Mara's detail. Decided with the user:
  - Rebuild from the existing drawings in `art/sources/characters/` (no new art); keep their
    body+arm rig. In `art/rig.mjs` the 2×2 grid (`GRID = 2`, ~line 545) and the colour caps
    (`writeSheet` 112 named / 64 extras, ~lines 535 and 699) become per-character (or off for
    every non-placeholder character), so one character can be rebuilt alone. Use Mara's
    layered-rig colour handling instead of the caps. Keep heights, anchors and portraits.
  - **Guard first.** Rebuild `guard` only; check stand, walk, salute, kneel, lie, sit and
    portrait; deliver a before/after in the intro next to Silas and Sigrid. Stop there.
  - After the user approves the guard: guard-nokeys, warden, Oren, Nell, Tobi and the extras
    (hauler, hoist, kid, merchant, runner, stoker, tally), each checked in game.
  - Coarse patches exposed in a drawing (e.g. the guard's sleeve in `char-guard/body.png`):
    repair that area locally and deliver it for approval. If a whole drawing or walk looks
    wrong, stop and report it; a redraw is a separate user decision.
  - Excluded: Bryn (Kiln Courier placeholder `kiln:opening/iven.png`); rooms, props,
    creatures and fight pictures keep the 2×2 grid.
  - Output: rebuilt sheets in `art/src/characters/` and `art/src/intro/characters/`, tests per
    `TESTING.md`. **Approval authority: user.** No commits unless the user asks. After the guard
    is approved, Claude updates the rule in `art/STYLE.md`.
- **C3 (2026-11-15) — done.** Cell cage r4 approved by the user and installed by Codex (`5c3593d`).
- **C2 (2026-11-15) — done.** Cell cage r3 delivered for user review (see `handoff/from-codex.md`).
- **C1 (2026-11-15) — done** (Codex confirmed the routine).

## Taken from Codex
- **K3 (2026-11-16) — done, documentation only.** `art/STYLE.md` "Character detail" rule replaces the
  Mara-only exception (all approved characters at 1 art pixel with the master palette; rooms, objects,
  props, creatures and fight pictures keep 2 px; Bryn no longer a placeholder); `art/LAYERED-RIG.md`
  intro and its Mara-only sentence reworded; generated character-brief prose fixed at its source
  (`scripts/art-briefs.ts`) and briefs regenerated with `npm run art:briefs` (other brief diffs are
  only manifest line-anchor updates). `npm test` 244 pass. Left for Codex: the stale comment at
  `art/rig.mjs` ~549 ("legacy placeholders, including Bryn"). No art, runtime, commit or push.
- None other. K1/K2 were removed at the user's request on 2026-11-15.

## Story simplification (2026-11-16)
- Phase A done in `STORY.md` only (uncommitted): six playable characters, Garran/First Hearth/valley removed, Day 4 preparation, Day 5 reveal flashback, new chapter grid. See its “Simplification decisions”.
- Story board `data/board.json` updated to match; Garran removed from board data and code; server restarted.
- Phase B step 7 done locally (uncommitted): First Hearth, valley and Garran's hut removed from the world map; Mara 1/2 lines, diaries and Bryn's map now point to Coppersong; Oren's new `dlg.oren.decideLead` line carries the gauntlet lead. Flag and node IDs (`sawValley`, `valley`) kept for save compatibility. `npm test` 239 and `test:feature -- story saves` 159 pass; no browser playback.
- Not done: Mara 2 Veyr glimpse; Bryn's gauntlet recognition; chapter map/unlocks and save migration.
