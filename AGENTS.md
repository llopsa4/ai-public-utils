# Repository instructions

## Pushing to GitHub

- Push only when the user explicitly asks you to push. Requests to edit, fix, test, commit, or prepare changes do not authorize a push.
- Each explicit push instruction authorizes only that push; it does not authorize future pushes.
- Establish the destination branch before pushing; ask if the user has not specified it.
- Keep changes local until the user requests a push. This repository deploys GitHub Pages automatically when `main` is pushed, so never push merely to update or verify the live site.

These rules apply throughout this repository, including `calendari/`.

## Working with the user

For substantial new requests, grill first unless the decisions are already settled. In any
grilling/interview workflow, ask exactly one question and wait for the answer before the next.
Order implementation plans easiest first. Refer to the user with they/them pronouns.

## Adventure routing

Before Adventure work from either launch directory, follow [adventure/AGENTS.md](adventure/AGENTS.md).
It routes both tools to ordinary repository guides, current status and handoff files. Tool-specific
skill files contain discovery metadata and a link only; they own no project procedure.

## Shared memory (Claude and Codex)

Both agents share `.agents/memory/` relative to this checkout's repository root. It is
git-ignored and lives only on this PC: never commit or push it. Claude's existing memory
junction links to that folder. Do not substitute a different checkout's memory when it is absent.

- **At the start of a session,** read `MEMORY.md` there (one line per memory) and open the files
  relevant to the task. If local memory is absent, use tracked instructions and acknowledge
  unavailable context; do not invent past decisions.
- **When you learn something lasting,** write it there and nowhere else: a user preference, a
  correction, a decision, a project constraint not visible in the code, or a pointer to an
  outside resource. Don't save code facts the repo already records.
- **Format:** one fact per file, with this frontmatter (`type` is `user`, `feedback`, `project` or
  `reference`), then the fact, then a **Why:** line and a **How to apply:** line. Add a one-line
  pointer to `MEMORY.md`.

  ```
  ---
  name: <kebab-case-slug>
  description: <one line, used to decide relevance>
  metadata:
    type: feedback
  ---
  ```

- **Keeping it clean:** update an existing file instead of adding a duplicate, delete memories
  that turn out to be wrong, and convert relative dates to absolute ones.
- **Global Codex preferences:** if one changes in `C:\Users\Nuria\.codex\AGENTS.md`, mirror the
  change here as well.
