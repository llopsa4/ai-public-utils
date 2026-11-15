# Working on Adventure

This is the shared collaboration procedure for humans, Codex Desktop and Claude CLI.
Use the [development guide](DEVELOPMENT.md), [art pipeline](art/PIPELINE.md) and
[testing policy](TESTING.md) for their respective tasks. Repository-wide rules are in
[the parent instructions](../AGENTS.md).

## Ownership and assignments

- **Active mode: Codex + Claude**, selected by the user on 2026-11-15 until they change it.
  Existing task pauses, review-only restrictions and art approval requirements remain in force;
  changing mode does not approve pending artwork or resume paused work.
- The user can select **Codex only** (Codex owns everything below) or **Codex + Claude**.
  Record their selection here and in the work log.
- Claude's quota is the scarcer one, so in Codex + Claude mode the split saves Claude for the
  work where it is clearly better:
  - **Claude:** story, scene and puzzle design; dialogue; the image-generation prompt for each art
    assignment ([generation prompts](art/PIPELINE.md#generation-prompts)); gameplay and runtime
    code that is new or tricky; reviews and documentation of procedures.
  - **Codex:** image generation from Claude's prompt, delivery preparation and validation, and,
    after the user's approval, installation, registration, central provenance and in-game art
    verification; routine wiring of an approved design, long test runs and user-assigned
    reviews. Reviews are read-only unless fixes are separately assigned. If a prompt cannot
    be followed, Codex reports why in the delivery instead of improvising a composition.
- The user may assign an exception. Record its exact scope under Working on in your handoff
  file; it does not change standing ownership.
- Rebuilding tracked published output requires an explicit publishing request. Commits require
  an explicit request too; the parent instructions govern pushes.

## Handoff files

Each agent writes only its own file and reads the other's, so concurrent sessions never edit
the same file: [handoff/from-claude.md](handoff/from-claude.md) and
[handoff/from-codex.md](handoff/from-codex.md). Each has four sections:

- **Working on:** current task and exact claimed files; release claims when done.
- **Awaiting the user:** deliveries or changes that need approval or a decision.
- **Requests for <other agent>:** numbered items (`C1`, `K1`…) with date, paths, expected output,
  approval authority and status (`open`, `blocked`, `done`). Add a request only for work the
  user already asked for in that request; never to approve art or resume paused work.
- **Taken from <other agent>:** request IDs you have started, finished or found blocked.
  The requester marks its item `done` once the other file reports it finished.

When the user says **"continue"**, read the other agent's file, take the first open request
addressed to you, then report. Generated references are not assignments and do not resume
paused work. Use no competing NEXT, FIXES or root HANDOFF documents.

## Approval

Each art assignment specifies an ID, authoritative brief/revision, allowed paths, output files,
measured dimensions/anchors/states, required validation and **Approval authority: user | Claude**.
Missing approval authority blocks installation pending clarification. Passing technical checks or
approval of an older delivery is not approval of the candidate revision. Existing review-only
notes receive no retroactive approval. The [art pipeline](art/PIPELINE.md) defines delivery contents
and installation steps.

## Shared-checkout coordination

- One shared checkout. Check both handoff files' *Working on* claims, existing diffs and the
  assignment before editing. Claim exact shared files in your own file, avoid another agent's
  edits, then release the claim. Report conflicts as a request in your own file rather than
  changing their work. Use a separate worktree only when the user asks for one.
- A handed-off delivery revision is immutable while integration is underway; make changes in a
  new revision folder. Pause edits to the revision being installed.
- Whole-tree generators need exclusive access to all affected outputs. Prefer scoped commands
  and temporary outputs. Preview and validation commands are defined in [TESTING.md](TESTING.md).
- Do not use destructive Git (`reset`, `checkout --`, `stash`, `clean` or branch switches) while
  another agent may have work. For a requested commit, stage only your explicit paths (never
  `git add -A` or `.`) and inspect the staged diff.
- If unrelated tests fail, inspect others' unfinished changes and report the failure to the owner;
  do not silently repair work outside your assignment.

## Session handoff

[WORKLOG.md](WORKLOG.md) records slow-changing project state, not another set of rules or
per-session activity (that belongs in your handoff file). Both agents may edit it, briefly and
only at the end of a session; re-read it immediately before editing. Keep it under about
100 lines and replace superseded statements. Before stopping, record:

- Branch/HEAD; committed or dirty state and affected paths.
- Completed and unfinished work, active claims, pending deliveries and next action.
- Tests actually run and their scope; failures and unverified behavior. Historical checks are
  not reruns against the current tree.
- Whether published output was rebuilt, and any task-specific pauses or decisions still pending.

For story decisions, read local `STORY.md`. If unavailable, acknowledge the missing context,
continue independent technical work and request only the information needed for dependent
story decisions. Do not reconstruct private narrative. The [reference map](art/REFERENCES.md)
identifies the approved prologue tracking exception and visual authorities.
