# Working on Adventure

This is the shared collaboration procedure for humans, Codex Desktop and Claude CLI.
Use the [development guide](DEVELOPMENT.md), [art pipeline](art/PIPELINE.md) and
[testing policy](TESTING.md) for their respective tasks. Repository-wide rules are in
[the parent instructions](../AGENTS.md).

## Ownership and assignments

- Claude leads gameplay, runtime, tests, tooling, configuration, documentation, asset installation,
  registration, central provenance and in-game verification.
- Codex produces assigned, validated art deliveries and performs reviews when the user assigns
  them. Reviews are read-only unless fixes are separately assigned.
- The user may assign an exception, including implementation by Codex. Record its exact scope
  under Working on in the work log; it does not change standing ownership.
- Rebuilding tracked published output requires an explicit publishing request. Commits require
  an explicit request too; the parent instructions govern pushes.

## Queues and approval

[Codex's inbox](art/CODEX.md) and [Claude's inbox](CLAUDE-INBOX.md) contain tasks only.
The sender adds tasks; the recipient removes completed tasks and preserves unfinished ones.
An empty task list means nothing is queued. Generated references are not assignments and do not
resume paused work. Use no competing NEXT, FIXES or root HANDOFF documents.

Each art assignment specifies an ID, authoritative brief/revision, allowed paths, output files,
measured dimensions/anchors/states, required validation and **Approval authority: user | Claude**.
Missing approval authority blocks installation pending clarification. Passing technical checks or
approval of an older delivery is not approval of the candidate revision. Existing review-only
notes receive no retroactive approval. The [art pipeline](art/PIPELINE.md) defines delivery contents
and installation steps.

## Shared-checkout coordination

- Check [Working on](WORKLOG.md#working-on), existing diffs and the assignment before editing.
  Claim exact shared files for exceptions, avoid another agent's edits, then release the claim.
  Send conflicts to the owner's inbox rather than changing their work.
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

[WORKLOG.md](WORKLOG.md) records current state, not another set of rules. Keep it under about
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
