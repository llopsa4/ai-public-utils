# Adventure current status

Updated 2026-11-15. Shared procedure: [WORKFLOW.md](WORKFLOW.md).
Per-agent activity and requests: [from Claude](handoff/from-claude.md), [from Codex](handoff/from-codex.md).
Older verification history is in Git history of this file and in CHANGELOG.md.

## Checkout
- Branch `dual-ownership`, HEAD `da85ac3`. Last inspected remote and Pages deployment:
  `c14fdd4`. Earlier work is committed; published output is unchanged.
- Claude's 2026-11-15 workflow audit is committed in `da85ac3` (not pushed); no local changes.

## Working on
- **Active mode: Codex + Claude**, selected by the user on 2026-11-15. Split, handoff files
  and model guidance: [WORKFLOW.md](WORKFLOW.md). Pauses and approvals unchanged.
- Current tasks, claims and deliveries awaiting the user are in the two handoff files
  (cell cage r2 review; unconfirmed kneeling-worker bounce work).
- R1 and the earlier roof-only `art/inbox/cell-roof-bars/r1/` are superseded cell-cage evidence.
- Local Ashlands Story Board in ignored `private/story-board/` (desktop shortcut
  `Ashlands Story Board.lnk`). User edits in `data/board.json`: preserve them; never reseed.

## Recently completed (installed, verified)
- Portrait r2: sixteen standing-based identities with speaking frames and mood metadata.
  Evidence: `art/inbox/done/dialogue-portraits-r2/`; thirteen paused-work briefs remain.
- Cursor r3 (user approval 2026-11-15): pointing hand for objects/satchel/carried items,
  refinery arrow default. Evidence: `art/inbox/done/interaction-cursors-r3/`.
- Stationary pose-aware ambient text, regulator artwork, desktop-only support.
- Documentation consolidation: procedures live in shared guides; tool skill files are
  metadata plus one link; request templates in `PROMPTING.md`.

## Current implementation (local, not published)
- Kofi prologue: six rooms, eight survivor/wildlife routes, utility arrows, folding bow,
  construction/rite/agreements/robot ending, cancellable archery and save v12.
  182 geometric placeholder PNGs; approved character rigs remain uninstalled. The temporary
  runtime grid does not replace the approved prologue art composition.
- UI polish: custom cursors, ceramic regulator and heat warning, desktop viewport fitting,
  bell actions, battle popup footer, wax/table placement and resumable Sigrid departure.
  Descriptions and registration: `art/sources/ui-polish/BRIEF.md`.
- Gallery gauge/socket/hotspot alignment and needle pivot corrected. Debug panel
  Puzzles → Regulator puzzle opens a fresh, prepared gallery replay in the active save.
- Ambient phrases: stationary outlined text four screen pixels above the painted head/task
  silhouette; scripted speech anchors and snores unchanged.
- Machine workers/routines, remarks, action rings, map fitting and scene labels implemented.
  Font studies remain separate; game fonts unchanged. See README for player behavior.

## Latest verification
- Workflow audit (2026-11-15): see `handoff/from-claude.md`.
- Story board (HEAD `36b31bc`): five server persistence tests and standalone browser checks
  passed; game typecheck and 239 fast tests passed. No browser suites or build.
- Cell cage r2: candidate and failing-baseline regression checks, 239 fast / 90 art tests;
  temporary previews dark/lit, closed/open, three desktop sizes, zero page/asset errors.
- Portrait installation: typecheck, 239 fast / 90 art / 286 all-Node tests; scratch
  production dialogue verified all 16 identities / 48 frames with zero page/asset errors.
- Cursor r3: 238 fast / 132 art-input tests, art checks, 557-file Markdown freshness and
  scratch build passed; hotspots and carried states verified manually.
- Browser suites (`test:browser`, `test:release`, `e2e`) have not been run recently.
- Fresh Codex Desktop recovery is unverified (earlier fresh processes discovered skills but
  file readers failed with "registered Core launch requires an installed app").

## Pending and paused
- Kofi's 45–60-minute target needs a timed human playthrough.
- Finished Kofi art and rig installation on hold; source alternatives are review-only.
  Two Kofi review requests (K1, K2 in `handoff/from-codex.md`) lack an approval authority.
- Mara's left-facing artwork and Chapter 2 paused until the user resumes them.
- The discarded 2026-11-11 interaction-effects brief remains rejected; the 2026-11-14 UI
  polish is a distinct implemented delivery.
- Cell-visual browser changes were previously stopped before a full run. Soft stairs light
  is an intentional placeholder. Oversized verb-icon notices are informational.

## Next action
- User reviews cell cage r2 and names the approval authority for Kofi reviews K1/K2.
- Codex request C1: confirm the new routine is recovered in a fresh Codex session.
