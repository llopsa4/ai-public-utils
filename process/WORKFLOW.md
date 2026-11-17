# Working with Codex and Claude

The shared collaboration procedure for every game in this repository (Adventure, Kota). Each game's
`AGENTS.md` names its own guides; repository-wide rules (pushing, working with the user, shared
memory) are in the [repository instructions](../AGENTS.md). Requests are interpreted with
[REQUESTS.md](REQUESTS.md); artwork follows [ART.md](ART.md).

Every game folder has the same working files:

| File | Kind | Holds |
| --- | --- | --- |
| `AGENTS.md` (+ `CLAUDE.md` = `@AGENTS.md`) | rules | entry point, reading list, the game's own rules |
| guides (`DEVELOPMENT.md`, `TESTING.md`, `art/STYLE.md`, …) | rules | one topic each; each rule lives in one place, others link to it |
| `WORKLOG.md` | state | active mode, current state, pauses, next action (under about 100 lines) |
| `handoff/from-claude.md`, `handoff/from-codex.md` | state | each agent's claims, requests and deliveries |
| `CHANGELOG.md`, art provenance, `art/inbox/done/` | history | append-only; never edited afterwards, not read at session start |

## Modes and ownership

- The user selects a mode per game: **Codex + Claude** (default), **Codex only** (Codex owns
  everything below) or **Claude only (Codex paused)**. Record it in that game's `WORKLOG.md`.
  Changing mode does not approve pending artwork or resume paused work.
- **Codex + Claude.** Claude's quota is the scarcer one, so the split saves Claude for the work where
  it is clearly better:
  - **Claude:** story, scene and puzzle design; dialogue; the image-generation prompt for each art
    assignment ([generation prompts](ART.md#generation-prompts)); gameplay and runtime code that is
    new or tricky; reviews and documentation of procedures.
  - **Codex:** image generation from Claude's prompt, delivery preparation and validation, and,
    after the user's approval, installation, registration, central provenance and in-game art
    verification; routine wiring of an approved design, long test runs and user-assigned reviews.
    Reviews are read-only unless fixes are separately assigned. If a prompt cannot be followed,
    Codex reports why in the delivery instead of improvising a composition.
- **Claude only (Codex paused):** Claude also does every Codex task except image generation.
  Generation stays queued as requests for Codex in Claude's handoff file. Claude still writes only
  its own handoff file and records there any Codex claim it takes over; Codex reconciles its own
  file on return.
- The user may assign an exception. Record its exact scope under *Working on* in your handoff file;
  it does not change standing ownership.
- Rebuilding tracked published output and committing each need an explicit request; the
  repository instructions govern pushes.

## Handoff files

Each agent writes only its own file and reads the other's, so concurrent sessions never edit the
same file. Each has four sections:

- **Working on:** current task and exact claimed files; release claims when done.
- **Awaiting the user:** deliveries or changes that need approval or a decision.
- **Requests for <other agent>:** numbered items (`C1`, `K1`…) with date, paths, expected output,
  approval authority and status (`open`, `blocked`, `done`). Add a request only for work the user
  already asked for; never to approve art or resume paused work.
- **Taken from <other agent>:** request IDs you have started, finished or found blocked. The
  requester marks its item `done` once the other file reports it finished.

**Done items leave.** Once both files show an item done, delete it from your file at your next
edit (keep the latest few until the other agent has read them). A result a player would notice gets
one line in the game's `CHANGELOG.md`; art keeps its provenance record; Git history keeps the rest.

When the user says **"continue"**, read the other agent's file, take the first open request
addressed to you, record it under *Taken from…* in your own file, do it, then report. Generated
references are not assignments and do not resume paused work. Use no competing NEXT, FIXES or root
HANDOFF documents.

## Approval

Each art assignment specifies an ID, authoritative brief/revision, allowed paths, output files,
measured dimensions/anchors/states, required validation and **Approval authority: user | Claude**.
Missing approval authority blocks installation pending clarification. Passing technical checks or
approval of an older delivery is not approval of the candidate revision. Review-only notes receive
no retroactive approval. [ART.md](ART.md) defines delivery contents and installation steps.

## Shared-checkout coordination

- One shared checkout. Check both handoff files' *Working on* claims, existing diffs and the
  assignment before editing. Claim exact shared files in your own file, avoid another agent's
  edits, then release the claim. Report conflicts as a request in your own file rather than
  changing their work. Use a separate worktree only when the user asks for one.
- A handed-off delivery revision is immutable while integration is underway; make changes in a new
  revision folder. Pause edits to the revision being installed.
- Whole-tree generators need exclusive access to all affected outputs. Prefer scoped commands and
  temporary outputs; the game's testing guide defines preview and validation commands.
- Do not use destructive Git (`reset`, `checkout --`, `stash`, `clean` or branch switches) while
  another agent may have work. For a requested commit, stage only your explicit paths (never
  `git add -A` or `.`) and inspect the staged diff.
- If unrelated tests fail, inspect others' unfinished changes and report the failure to the owner;
  do not silently repair work outside your assignment.

## Session handoff

`WORKLOG.md` records slow-changing project state, not rules or per-session activity (that belongs in
your handoff file). Both agents may edit it, briefly and only at the end of a session; re-read it
immediately before editing, and replace superseded statements. Before stopping, record:

- Branch/HEAD; committed or dirty state and affected paths.
- Completed and unfinished work, active claims, pending deliveries and next action.
- Tests actually run and their scope; failures and unverified behavior. Historical checks are not
  reruns against the current tree.
- Whether published output was rebuilt, and any task-specific pauses or decisions still pending.

Private story or design files named in a game's `AGENTS.md` are read by searching for the relevant
section. If one is unavailable, acknowledge the missing context, continue independent technical work
and ask only for the information dependent decisions need; never reconstruct private narrative.
