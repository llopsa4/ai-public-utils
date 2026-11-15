# Adventure current status

Updated 2026-11-15. Shared procedure: [WORKFLOW.md](WORKFLOW.md).
Tasks: [Claude](CLAUDE-INBOX.md) and [Codex](art/CODEX.md).

## Checkout
- Current branch `dual-ownership`, HEAD `c304176` (a concurrent WIP commit appeared during verification;
  this task did not create it). Last inspected remote
  and Pages deployment: `c14fdd4`. No commit, push or published rebuild requested in this task.
- Local changes: ownership docs, gauge room/CSS/test fixes, debug helper/panel/tests/catalog,
  README, cursor runtime/metadata/PNGs/provenance, generated reference Markdown and this log.
  Pre-existing `art/PIPELINE.md` edits are preserved. Delivery originals and shared memory
  are ignored; published output is unchanged.

## Working on
- Local Ashlands Story Board completed in ignored `private/story-board/`, with the
  desktop shortcut `Ashlands Story Board.lnk`. Separate from game runtime and STORY.md;
  zoom/pan, day playback and versioned file autosave with recovery are available.
  User edits are already present in `data/board.json`: preserve them; never reseed.
  No active claims or published rebuild; the private app and data remain local only.
- Cell cage redraw r2 transparency correction delivered: `art/inbox/cell-cage-redraw/r2/review.html`.
  Neutral/warm matte fringes removed; approved roof rows 0–173 byte-identical to r1.
  Candidate and failing-baseline regression checks passed, plus 239 fast / 90 art tests.
  Temporary game previews cover dark/lit, closed/open and three desktop sizes; zero page/asset
  errors. Installed cage/gate/room unchanged. R1 preserved as superseded evidence.
  User review pending; no active claims, build, commit or push.
- Stationary pose-aware ambient text and satchel/carry cursor policy are complete;
  approved r3 hand and default arrow are installed and verified. No active claims for
  this task. Delivery/evidence: `art/inbox/done/interaction-cursors-r3/`.
- Earlier roof-only repair r1 is preserved at `art/inbox/cell-roof-bars/r1/`, uninstalled;
  superseded by the user's complete-cage redraw request.
- Regulator artwork, floating ambient phrases and desktop-only support are complete and
  verified. This task has no active file claims; preserve the other assignments below.
- Removing the kneeling human workers' bounce. Claims: human-extra atlas work tags,
  their generator definition and focused crowd contract test. Existing artwork stays unchanged.
- User-approved portrait r2 installed: sixteen final standing-based portrait identities with
  corrected speaking frames, mood metadata and independent rebuild protection. No active claims.
  Delivery/evidence: `art/inbox/done/dialogue-portraits-r2/`; thirteen paused-work briefs remain.
- Active mode: **Codex only**, selected
  by the user on 2026-11-14 until they change it; Codex owns all Adventure development.
  Existing task pauses and approval requirements remain in force.

## Local documentation cleanup
- Shared workflow, content/runtime guidance and art procedure now live in ordinary repository
  guides. Six tool discovery files contain only metadata and one link; CLAUDE.md contains imports.
- Both inboxes contain tasks only; retained Kofi source/delivery notes moved into art/REFERENCES.md.
- Duplicate memory instructions are pointers; unique decision history and private context remain
  in the existing ignored memory directory. Claude's junction is unchanged.
- Public asset contracts, the asset inventory and approved prologue references were refreshed
  through Markdown-only generation. Five unreferenced obsolete intro briefs were removed.
- Generator descriptions occur once; chapter exceptions live in the chapter rules document.
  Asset-specific dimensions, anchors, states, sources and registration remain explicit.
- Adventure request templates now live in `PROMPTING.md`, linked from README. The generic root
  version was replaced. No story, gameplay or artwork was changed; 221 fast tests passed,
  and template links, code fences and whitespace were checked.
- Restored the explicit scene-layering contract in `art/PIPELINE.md#scene-construction` after
  the user identified wording weakened by consolidation. No artwork was regenerated or installed.

## Verification

- Local story-board task on `dual-ownership`, HEAD `36b31bc`: five server persistence,
  conflict/failure/recovery/access tests passed; standalone browser checks passed for
  autosave/reload, zoomed dragging, undo, pan/fit, routes, next-morning pause, stale tabs,
  retry and corrupt-save recovery. Light/dark desktop layouts inspected; no page errors.
  Desktop shortcut starts the hidden localhost server and opens the browser. Game
  typecheck and all 239 fast tests passed. No game browser suites or build ran.

- Portrait installation: typecheck, 239 fast / 90 art / 286 all-Node tests passed. Scratch
  production dialogue verified all 16 identities / 48 frames, mood reset, mirroring and
  Silas disguises with exact installed hashes and zero page/asset errors. Palette-only
  normalization preserves frame geometry/alpha; source rigs/shared renderer are unchanged.

- Cursor r3 installation: user approval “Perfect, install” on 2026-11-15. 238 fast /
  132 art-input tests passed with typecheck; art checks,557-file Markdown freshness and
  scratch build passed. Vite and scratch checks verified image hashes/hotspots for hand,
  arrow, exit, look, talk, satchel and carried states; item image/cancel/native text inputs
  passed with no asset/page errors. No browser suites or published rebuild ran.
- Cursor-r2/ambient task: 238 fast / 283 all-Node tests passed with typecheck. Scratch
  production built to temp. Manual Vite and scratch checks: stationary text ~4px above
  working/standing stoker, kneeling hoist worker and ash collector; satchel/carry hand,
  separate item image and right-click cancellation passed. Zero asset/page errors.
  Evidence: temp `adventure-cursor-r2-visual/`. No browser suites or tracked build ran.
- Desktop/art/chatter task: 234 fast / 279 all-Node tests passed, including typecheck.
  Art checks and 556-file Markdown catalog/guide freshness passed; existing verb-icon notices only.
  Inventory lists 49 desktop browser cases; no browser suites ran.
- Manual Vite (5173) and scratch production (4177) checks passed at 1280×720, 1920×1080
  and 1024×768: painted gauge, opaque center through unlock, keyboard screw, cancel/replay,
  lift-out/reward/hatch fight, floating ambient text, reduced motion, normal scripted dialogue
  and Space labels. Zero asset/page errors. Evidence: temp `adventure-desktop-visual/`.
- Gauge/debug task: 228 fast and 273 all-Node tests passed. After final error-path hardening,
  typecheck and all 10 focused gauge/debug tests passed, including valid save round-trip.
  Full public Markdown reference freshness passed (554 files); only the gallery brief regenerated.
- Scratch production preview: both gauges visually checked at 1280×900, 390×844 and 915×412;
  high/safe dial alignment, reduced motion, title/intro debug jumps, partial cancellation/fresh
  replay, and release into the hatch fight passed with no page errors. No browser suites run.
  Evidence: local temp `adventure-regulator-visual/`.
- Cursor integration: user approved r1 on 2026-11-14. 229 fast / 124 art-input feature tests,
  typecheck and art checks passed; scratch production built. Manual browser checks verified
  approved image hashes, hotspots, object/exit clicks, eye/speech and carried-item behavior,
  with no page errors. Delivery/evidence: `art/inbox/done/interaction-cursors-r1/`.
- Ownership-mode update: reviewed the scoped documentation diff and ran `git diff --check`;
  no runtime tests or published rebuild were needed or run. Current local changes are
  `WORKFLOW.md` and this log, plus ignored shared memory.
- Prior workflow repair: 221 fast / 79 art-feature / 263 all-Node tests passed (before this cleanup).
- Cleanup: typecheck, 221 fast / 82 art-feature / 266 all-Node tests passed; 23 targeted
  generator tests also passed. Art checks passed with only the existing verb-icon notices.
- Full public (554 Markdown / 561 mixed files), intro, approved Kofi and guide Markdown
  freshness checks passed. Approved Kofi mixed-output checking also passed. No catalog drift remains.
- All 1,363 protected non-Markdown files outside scripts/tests matched the pre-cleanup baseline.
  Links and Markdown anchors resolved; no stale tool-owned procedure links or duplicated long
  manual policy paragraphs remained. Six entrypoints validated; whitespace check passed.
- Independent read-only forward review recovered procedures, roles, approval and pauses correctly.
  It identified unique preference/stale README details that were corrected before final checks.
- Fresh Claude checks from root and Adventure discovered both skills and recovered the shared
  guides, roles and approval rules. Isolated recovery with memory disabled acknowledged missing
  story/local memory and refused unapproved Kofi installation; every read stayed in that checkout.
- Earlier fresh Codex processes discovered both skills but their file readers failed with
  "registered Core launch requires an installed app". Full fresh Codex Desktop recovery remains
  unverified; current skill discovery is confirmed.

## Current implementation (local, not published)
- Kofi prologue: six rooms, eight survivor/wildlife routes, utility arrows, folding bow,
  construction/rite/agreements/robot ending, cancellable archery and save v12.
  182 geometric placeholder PNGs; approved character rigs remain uninstalled. The temporary
  runtime grid does not replace the approved prologue art composition.
- UI polish: custom cursors, ceramic regulator and heat warning, desktop viewport fitting,
  bell actions, battle popup footer, wax/table placement and resumable Sigrid departure.
  Descriptions and registration: `art/sources/ui-polish/BRIEF.md`.
- Gallery gauge/socket/hotspot alignment and close-up needle pivot corrected. Debug panel
  Puzzles → Regulator puzzle opens a fresh, prepared gallery replay in the active save.
- Approved r3 bare pointing hand is used for objects, satchel and carried items; the refinery
  arrow is the default pointer. The earlier approved doorway/arrow exit is unchanged.
- Regulator uses the existing painted gauge and source-pixel brass cap, with separate controls.
  Ambient phrases use stationary outlined text four screen pixels above the current painted
  head/task silhouette and fade; scripted speech anchors and snores are unchanged.
  Adventure is desktop-only; dedicated phone/tablet controls/layouts/test targets are removed.
- Machine workers/routines, remarks, action rings, map fitting and scene labels are implemented.
  Font studies remain separate; game fonts are unchanged. See README for player behavior.

## Pending and paused
- Kofi's 45–60-minute target needs a timed human playthrough; visual checks from earlier
  sessions have not been rerun by this documentation task. No browser/release suite was run.
- Finished Kofi art and rig installation remain on hold; source alternatives are review-only.
  See Claude's task queue for the uninstalled deliveries and missing approval authority.
- Mara's left-facing artwork and Chapter 2 remain paused until the user resumes them.
- The discarded 2026-11-11 interaction-effects brief remains rejected; separately approved
  2026-11-14 UI polish is a distinct implemented delivery.
- Existing cell-visual browser changes were previously stopped before a full run. Soft stairs
  light is an intentional placeholder. Existing oversized verb-icon notices are informational.

## Next action
- Codex handles the user's next assignment; desktop/art/chatter work is complete locally.
- Verify fresh Codex Desktop recovery in the next chat; preserve existing pauses. Changes remain
  unpublished on `dual-ownership`; this task made no commit or push.
