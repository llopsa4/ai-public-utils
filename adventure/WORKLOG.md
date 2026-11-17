# Adventure current status

Updated 2026-11-17. Shared procedure: [process/WORKFLOW.md](../process/WORKFLOW.md).
Per-agent activity and requests: [from Claude](handoff/from-claude.md), [from Codex](handoff/from-codex.md).
History: Git history of this file, [CHANGELOG.md](CHANGELOG.md) and [art provenance](art/PROVENANCE.md).

## Checkout
- Branch `redesign`, HEAD `c9f9711` ("Republish Adventure with the C7 room redraws"), equal to
  `origin/redesign` and `origin/main`: the C7 redraws through the gallery are committed, pushed and
  published.
- Local, uncommitted: the docs reorganization (root `process/`, `kota/`, skill rename, Adventure
  guides, handoff pruning); see `handoff/from-claude.md`.

## Working on
- **Active mode: Claude only (Codex paused)**, selected by the user on 2026-11-17 while Codex is out
  of usage; Claude does all Codex work except image generation. Returns to Codex + Claude when the
  user says so ([modes](../process/WORKFLOW.md#modes-and-ownership)).
- **Redrawing paused** by the user (2026-11-17): C7 Ashways (last room) not started, no prompts.
- Local Ashlands Story Board in ignored `private/story-board/` (desktop shortcut
  `Ashlands Story Board.lnk`). User edits in `data/board.json`: preserve them; never reseed.

## Current implementation
- Intro and Chapter 1 rooms through the gallery redrawn at Silas's detail (C7); Ashways still 2px.
  Gallery close-up brass centre still from the pre-C7 socket (follow-up art).
- Kofi prologue: six rooms, eight survivor/wildlife routes, utility arrows, folding bow,
  construction/rite/agreements/robot ending, cancellable archery and save v12. 182 geometric
  placeholder PNGs; approved character rigs remain uninstalled. The temporary runtime grid does not
  replace the approved prologue art composition.
- UI polish (cursors, ceramic regulator and heat warning, viewport fitting, bell actions, battle
  popup footer, resumable Sigrid departure): `art/sources/ui-polish/BRIEF.md`. Debug panel
  Puzzles → Regulator puzzle opens a fresh, prepared gallery replay in the active save.
- Machine workers/routines, remarks, action rings, map fitting, scene labels and stationary ambient
  phrases implemented. Font studies remain separate; game fonts unchanged.

## Latest verification
- C7 gallery r2 installation (Claude): typecheck, 251 fast / 299 art+story+saves+input+crowd+runtime
  tests, art checker and ch1 reference freshness pass; scratch production build checks with zero
  page/HTTP errors, reduced motion only. Evidence: `art/inbox/done/gallery-installation-r2/HANDOFF.md`.
- Browser suites (`test:browser`, `test:release`, `e2e`) have not been run recently.
- Fresh Codex Desktop recovery is unverified (earlier fresh processes discovered skills but file
  readers failed with "registered Core launch requires an installed app").

## Pending and paused
- C7 Ashways redraw paused (above). The discarded 2026-11-11 interaction-effects brief remains
  rejected. Cell-visual browser changes were stopped before a full run. Soft stairs light is an
  intentional placeholder. Oversized verb-icon notices are informational.
- `art/REPLACING.md` and its layout images are stale since `36b31bc` (pre-C7 geometry; found
  2026-11-17): regenerate with `npm run art:guide` when the user asks. The full-catalog
  `art:briefs --check` always lists the chapter-generated briefs as stale (they are overwritten by the
  `--chapter` runs); check those with the chapter commands instead.

## Next action
- User review of the docs reorganization; commit only on request. Codex, on return: request C8.
