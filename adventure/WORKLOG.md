# Adventure current status

Updated 2026-11-17. Shared procedure: [WORKFLOW.md](WORKFLOW.md).
Per-agent activity and requests: [from Claude](handoff/from-claude.md), [from Codex](handoff/from-codex.md).
Older verification history is in Git history of this file and in CHANGELOG.md.

## Checkout
- Branch `redesign`, HEAD `0c595ac` at C7 installation. Last inspected remote and Pages deployment:
  `c14fdd4`. Earlier work is committed; published output is unchanged.
- Claude's workflow audit and request-template changes are committed locally (not pushed).
  Local changes: C4 character detail plus C5 Bryn sources/sheet/portrait, measured rig, approval
  guards, briefs/provenance and tests; C6 installed art, placement/UI/contact corrections and tests;
  C7 guardroom and cell artwork/registration, approval guards, provenance/references and tests;
  concurrent Claude/story/UI changes retained.

## Working on
- **Active mode: Claude only (Codex paused)**, selected by the user on 2026-11-17 while Codex is
  out of usage; Claude does all Codex work except image generation. Returns to Codex + Claude when
  the user says so. Split and handoffs: [WORKFLOW.md](WORKFLOW.md). Pauses and approvals unchanged.
- **Redrawing paused** by the user (2026-11-17): C7 Ashways (last room) not started, no prompts.
- Current tasks, claims and deliveries awaiting the user are in the two handoff files.
- Local Ashlands Story Board in ignored `private/story-board/` (desktop shortcut
  `Ashlands Story Board.lnk`). User edits in `data/board.json`: preserve them; never reseed.

## Recently completed (installed, verified)
- C7 gallery r2 (2026-11-17): user said “install”; Codex installed the approved bytes and ran out of usage, Claude finished the mirrored wiring (stairhead (102,286)), outlines, records, golden (coordinate-only) and tests. Evidence: `art/inbox/done/gallery-installation-r2/HANDOFF.md`. Close-up brass centre still from the pre-C7 socket (follow-up art).
- C7 guardroom pilot r2 (2026-11-17): user approved with “Continue”; installed exact selected numeric-layout art and independent overlays, closed/open grate with existing save flag, smaller ledger target, final protection and provenance. Evidence: `art/inbox/done/guardroom-installation-r2/`. Cell r1 also approved, installed and verified: `art/inbox/done/cell-installation-r1/HANDOFF.md`; outer-door prompts requested as K5.
- C6 artwork (2026-11-16): explicitly approved and installed brown sweeper fight/broken states, separate training rig and Sigrid warm-skin exports. Source geometry and registration preserved; exact-byte and reproduction guards added. Evidence: `art/inbox/done/playtest-c6-installation-r1/`.
- C4 character detail (2026-11-16): guard pilot approved by “Continue”; all thirteen C4 characters installed. Existing rigs, dimensions/timing/anchors and portraits preserved. Fast / all 286 Node tests and art checker pass; all thirteen checked in scratch production rooms. Evidence: `art/inbox/done/character-detail-r1/` and `done/guard-detail-r1/`.
- Cell cage/gate r4 (user approval 2026-11-15): new clean drawing, existing registration.
  Evidence: `art/inbox/done/cell-cage-redraw-r4/`. C3 complete; r1–r3 remain uninstalled references.
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
- C7 gallery r2 installation (Claude): typecheck, 251 fast / 299 art+story+saves+input+crowd+runtime tests, art checker and ch1 reference freshness pass. Scratch production build: four body/socket states, stairhead, six pointer targets, exact loaded/bundled art, stairs both ways, rail names, hatch, Tab/Enter and resize; zero page/HTTP errors; reduced motion only. No browser suites, published output, commit or push.
- C7 cell installation: typecheck, 246 fast / 263 art+story+saves+input tests, art checker and intro-reference freshness pass. Eight production room states, real cloak/window interactions, sleeping guard, seven pointer/outline targets and exact loaded/bundled artwork verified; zero page/HTTP errors. Scratch build only; no browser suites, published output, commit or push.
- C7 installation: typecheck, 245 fast / 243 art+story+saves feature tests and art checker pass. Four production room states, actual nail interaction and both guards inspected; approved texture pixels and bundled images exact, zero page/HTTP errors. Scratch build only; no browser suites, published output changes, commit or push.
- C6 installation: typecheck, 244 fast / 94 art Node tests and art checker pass; fresh scratch production assets match all five approved images byte-for-byte. Room/fight/dialogue captures, contact, gear/map/visibility/walker checks pass with zero page/HTTP errors. Evidence: `art/inbox/done/playtest-c6-installation-r1/HANDOFF.md`. No browser suites or published build changes. Before installation, all 290 Node tests passed for routine playtest fixes.
- C5 installation: all 240 fast / 287 total Node tests and art checker pass; scratch production build, seven actual workshop/backroom/real-dialogue captures and approved-output hash checks pass. No browser suites or published build changes. Evidence: `art/inbox/done/bryn-redraw-installation-r1/`.
- Kneeling-worker status confirmed: generator and installed human atlas tags hold frame 8;
  typecheck and 38 crowd tests pass, including the stationary work contract. No code/art edits
  or fresh browser playback during this status check.
- Cell cage r4 installation: approved bytes exact; typecheck, 239 fast / 90 art tests and art
  checker pass. Four direct installed-asset scratch captures at 1280×720 inspected, zero
  page/HTTP errors. Evidence: `art/inbox/done/cell-cage-redraw-r4/HANDOFF.md`.
  Published output unchanged; no commit or push.
- Workflow audit (2026-11-15): see `handoff/from-claude.md`.
- Story board (HEAD `36b31bc`): five server persistence tests and standalone browser checks
  passed; game typecheck and 239 fast tests passed. No browser suites or build.
- Portrait installation: typecheck, 239 fast / 90 art / 286 all-Node tests; scratch
  production dialogue verified all 16 identities / 48 frames with zero page/asset errors.
- Cursor r3: 238 fast / 132 art-input tests, art checks, 557-file Markdown freshness and
  scratch build passed; hotspots and carried states verified manually.
- Browser suites (`test:browser`, `test:release`, `e2e`) have not been run recently.
- Fresh Codex Desktop recovery is unverified (earlier fresh processes discovered skills but
  file readers failed with "registered Core launch requires an installed app").

## Pending and paused
- The discarded 2026-11-11 interaction-effects brief remains rejected; the 2026-11-14 UI
  polish is a distinct implemented delivery.
- Cell-visual browser changes were previously stopped before a full run. Soft stairs light
  is an intentional placeholder. Oversized verb-icon notices are informational.

## Next action
- Branch `redesign`, HEAD `0c595ac`; all work since is uncommitted (dirty tree includes earlier Codex/Claude changes). No published output, commit or push.
- Redrawing is paused (C7 Ashways). Codex's handoff still shows its gallery claim; Codex reconciles it on return (Claude took it over, see `handoff/from-claude.md`).
