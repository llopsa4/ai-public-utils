# Adventure current status

Updated 2026-11-14. Shared procedure: [WORKFLOW.md](WORKFLOW.md).
Tasks: [Claude](CLAUDE-INBOX.md) and [Codex](art/CODEX.md).

## Checkout
- Current branch `dual-ownership`, HEAD `9024162`; committed Kofi/UI updates remain local. Last inspected remote
  and Pages deployment: `c14fdd4`. No commit, push or published rebuild requested in this task.
- Dirty: workflow repairs and Markdown consolidation, shared guides/entrypoints, reference
  generators/tests and generated Markdown. Runtime, installed/source artwork and other apps
  are unchanged by the consolidation.

## Working on
- None. The user-assigned Adventure request kit is complete; normal roles apply.

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

## Verification
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
- UI polish: work-glove cursor, ceramic regulator and heat warning, viewport/touch fitting,
  bell actions, battle popup footer, wax/table placement and resumable Sigrid departure.
  Descriptions and registration: `art/sources/ui-polish/BRIEF.md`.
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
- Claude resumes assigned development/integration; Codex receives assigned art or reviews.
- Verify fresh Codex Desktop recovery in the next chat; preserve existing pauses. Changes remain
  uncommitted and unpublished on `dual-ownership`.
