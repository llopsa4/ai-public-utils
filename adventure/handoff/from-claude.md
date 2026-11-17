# Claude handoff

Written only by Claude; Codex reads it and never edits it. Procedure:
[WORKFLOW.md](../WORKFLOW.md#handoff-files).

## Working on
- **Claude only (Codex paused), from 2026-11-17** (user: Codex is out of usage; WORKFLOW.md). Claude
  does Codex's work except image generation; generation requests stay below for Codex.
- **Taken over from Codex: C7 gallery r2 installation, complete (2026-11-17).** Codex's claim in its
  own file is stale; Codex reconciles it on return. Codex had installed the approved bytes only;
  Claude did the mirrored wiring (stairhead (102,286), user decision), outlines, manifest/status,
  provenance, golden (coordinate-only), tests and scratch production verification. Evidence:
  `art/inbox/done/gallery-installation-r2/HANDOFF.md`; deliveries archived to
  `art/inbox/done/scene-redraw-gallery-r{1,2}/`. Claims released.
- Leftover from K3 done: stale Bryn comment in `art/rig.mjs` removed.

## Awaiting the user
- Nothing. Workflow audit (2026-11-15) committed in `da85ac3`, not pushed: root and FFCardGame
  `CLAUDE.md`, `AGENTS.md`, `PROMPTING.md`, `WORKFLOW.md`, `DEVELOPMENT.md`, `art/PIPELINE.md`,
  `art/REFERENCES.md`, handoff files, skill descriptions, `WORKLOG.md` and the briefs test.
  `CLAUDE-INBOX.md` and `art/CODEX.md` removed (old delivery records still mention them).
  Checked: typecheck, 239 fast and 90 art tests pass; links/anchors resolve; whitespace clean.

## Requests for Codex
- **C7 (2026-11-16) — open. Redraw the intro and Chapter 1 scene art at Silas's detail and true
  proportions; pilot = the guardroom.** Guardroom, cell, outer door, tent, kiln hall, firing house
  and gallery are installed (gallery r2 finished by Claude, 2026-11-17). **Ashways (last room)
  is paused by the user (2026-11-17: "any redrawing needs pause")**: no prompts written; do not
  start it until the user resumes it. Open question for then: whether the 2px valve and pressure
  cell are redrawn too (sweeper stays as approved in C6). Decided with the user: (1) pilot first, one room per
  delivery after the user approves it; (2) the redraw also fixes separation (clean background, every
  interactable and state-changing thing an overlay); (3) same layout and places, only size and
  detail change; (4) Claude writes the pilot prompts now and each later room's prompts after the pilot
  is approved. Basis: `art/audits/scene-audit-2026-11-16.md`; rules in `art/STYLE.md` and
  `art/PIPELINE.md` (scene construction, generation prompts item 3 Scale and item 6 pixel definition).
  **Now:** `art/inbox/scene-redraw-guardroom/r1/PROMPTS.md` (background, ledger, grate leaf closed and
  open, stove, torch; contract, sizes against Silas and required checks inside). Deliver in
  `art/inbox/scene-redraw-guardroom/r1/` with previews and `HANDOFF.md`. **Approval authority: user.**
  Do not install before approval; after approval, routine wiring (hotspots, anchors, manifest,
  `intro/rooms.ts`: grate gets a `flag: 'grateOpen'` closed/open state) is yours. This supersedes
  the earlier decision to leave the oversized ledger as it is. No commits unless asked.
  **Later rooms (prompts follow after the pilot is approved; size fixes from the audit):** cell (cot
  about 2.5× too big, tin plate and candle about 2×, cloak almost Silas's height; cloak as an overlay
  instead of the `cell-bare` background swap; cot, blanket, bucket, roster, candle, table overlays),
  outer door (lanterns about 2×), tent (stool about 1.7×, boots about 1.5×, hanging lantern about 2×;
  workbench, jar, chest, drum, stove overlays), kiln hall (jars about 1.7×; kiln fires as lit/cold
  overlays, tally pillar, hoist frame, cart overlays), firing house (shoes about 1.6×; hearth fire,
  soup pot, bread basket, bell, chalk overlays), gallery (wall lantern about 3×, logbook and quill about
  2×; regulator body, gauge ring, rail names overlays), ashways (crate about 1.9×, jar about 1.5×;
  pipes overlay). Fixed exits (arches, doorways, stairs) may stay in the background.
- **C6 (2026-11-16) — done** (installed by Codex 2026-11-16, `art/inbox/done/playtest-c6-installation-r1/`). **Playtest fixes: art and placement** (user's list of 2026-11-16).
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
- **K9 (2026-11-17) — done, prompts only.** Gallery prompt set at
  `art/inbox/scene-redraw-gallery/r1/PROMPTS.md`: clean 1px background (pipes, bracket, desk raised to
  104 per the audit's low-desk note, plain railing; stairs stay background) plus overlays regulator body
  with valves (cracked / ringCracked on `patchFailed`, from `line.regulatorLookRing`: an assumption),
  socket redraw (installed / removed, ring centre (480,376), hollow 96 = the hatch), gauge ring+face
  replacing `gauge-face.png` (tick angles kept for the needle; also used by the close-up), lantern
  18×32 (was ≈90), logbook 40 wide and quill 22 (were ≈93 / ≈50), scratched names (no readable letters).
  Wiring notes: hatch centred on the hollow (world (240,188)), lantern flame to world (28,165).
  Revised with the user the same day (grilling): **room mirrored** around x 640 (all numbers
  reflected; regulator ring now art (800,376), gauge (804,86)); **stairs go down** at the left (newel
  post x 136–152, top flight of the firing-house staircase dropping down-left out of the bottom-left
  corner, rise 26 / run 18), plain exit (no walk-down movement), game-added warm glow from the
  stairwell; no pipe ends in mid-air (ceiling pipes off the top edge, horizontal pipes through wall
  sleeves at x 457–473 and 1117–1133). Wiring list mirrors every gallery position in `rooms.ts`.
  **r2 (user review of r1, same day): background stairwell only** at
  `art/inbox/scene-redraw-gallery/r2/PROMPTS.md`. The r1 side-view flight cut through the floor band
  made the floor read as a raised slab with Mara floating at the stairhead (cause: Claude's r1
  prompt). Now an opening in the floor along the back wall (x 0–170, y 522–620), steps going down-left
  inside it, floor unbroken in front; edit of the r1 room candidate inside x 0–220 / y 380–720 only;
  r1 overlays kept. Stairhead walk-to/entry world (95,286). Request for Codex: generate r2 (C7 entry).
  Approval authority user; no generation, wiring or commit.
- **K8 (2026-11-17) — done, prompts only.** Firing-house prompt set at
  `art/inbox/scene-redraw-firing-house/r1/PROMPTS.md`: clean 1px background (empty rails, bracket,
  sooted hearth with crane hook at (230,364); stairs, kiln gate and left doorway stay background) plus
  overlays shoes (warm/cold: cold has a third of the pairs taken down, from `line.shoesLookCold`;
  children's shoes 18–24, adult 30, were ≈50–70), bell, chalk, hearth fire (lit/cold), soup pot
  (warm/cold: cold wrapped in blankets, from `line.soupLookCold`), bread basket and a 1px redraw of the
  pantry door (stuck/fixed). Background size fixes: mantel lantern 60→32, floor jar 67→56.
  **Decided with the user (2026-11-17): chalk drawings redesigned from `line.secretChalk`** (smiling
  kiln, Nell with a huge ladle, figure with a giant glove) and moved low between the hearth and the
  pillar (art 342–378 × 406–462, Tobi's reach); the old sun-and-house drawing is dropped. Approval
  authority user; no generation, wiring or commit.
- **K7 (2026-11-17) — done, prompts only.** Kiln hall prompt set at
  `art/inbox/scene-redraw-kiln-hall/r1/PROMPTS.md`: clean 1px background (empty firebrick hearths,
  curtain doorway stays background) plus overlays tally pillar, hoist frame (iron eye at the existing
  pulley pivot art (200,120)), redrawn swinging pulley (98×216, rope end at y 336), jars (56/44/38,
  were ≈100), ash cart with shovel, one kiln-fire sheet lit/cold placed at the three mouths
  (centres x 680/805/930, sill y 442), and 1px redraws of the three foreground cut-outs (same canvases;
  Ansel's crate stays 68×58). **Decided with the user (2026-11-17): walk-in tent**, ridge 272, entrance
  228 (was ≈160 / ≈90; not in the audit), centre moved 4 px left to x 496. Approval authority user; no
  generation, wiring or commit.
- **K6 (2026-11-17) — done, prompts only.** Tent prompt set at `art/inbox/scene-redraw-tent/r1/PROMPTS.md`: clean 1px background (lantern 18×32, boots 30 tall resized in place) plus overlays workbench (with its loose items), jar, crate, drum on trestle, clay stove and a single stool (seat 50, was ≈86; replaces both the painted copy and the foreground cut-out). Floor line y504, bench top y394; rack and notebook unchanged. Assumptions: lantern, boots, coat, tool board and cot stay background (not interactive); the drum's chalked PARTS dropped (no text in art). Revised with the user (grilling, 2026-11-17): the workbench group is a new design from the dialogue lines — bench top lowered to 104 (y416), three repairs (latch, kettle, Tobi's toy cart in a vise), candle, apricots, gloves, new shelf contents; notebook, cradle (36×48, red-glass cell, full/empty) and jug redrawn; courier's crate and tool board redesigned; stool gets its mismatched fourth leg. Approval authority user; no generation, wiring or commit.
- **K5 (2026-11-17) — done, prompts only.** Outer-door prompt set at `art/inbox/scene-redraw-outer-door/r1/PROMPTS.md`: clean 1px background plate plus one 40×44 lantern overlay reused at both places (left lantern no longer painted), lantern 18×32 (was ≈60), glass centres on the existing flames at art (284,244)/(660,244); door and layout unchanged. Approval authority user; no generation, wiring or commit.
- **K4 (2026-11-17) — done, prompts only.** Cell prompt set written at `art/inbox/scene-redraw-cell/r1/PROMPTS.md` (11 overlays + clean background; one numeric contract: floor seam y477, tabletop band 552–566, anchors/canvases; cloak becomes an overlay and `cell-bare` retires). Assumptions to confirm in review: bucket resized to 48×56 (audit did not size it), candle stub resized to 8×8, cup folded into the table overlay, window stays background, no blanket torn-state. Approval authority user; no generation, wiring or commit.
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
