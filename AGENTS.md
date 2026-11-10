# Repository instructions

## Pushing to GitHub

- Push only when the user explicitly asks you to push. Requests to edit, fix, test, commit, or prepare changes do not authorize a push.
- Each explicit push instruction authorizes only that push; it does not authorize future pushes.
- Keep changes local until the user requests a push. This repository deploys GitHub Pages automatically when `main` is pushed, so never push merely to update or verify the live site.

These rules apply throughout this repository, including `calendari/`.

## Shared memory (Claude and Codex)

Both agents share one memory for this repository: `.agents/memory/` at the repository root
(`C:\Users\Nuria\source\repos\public\.agents\memory\`). It is git-ignored and lives only on this
PC: never commit or push it. Claude's own memory path links to the same folder.

- **At the start of a session,** read `MEMORY.md` there (one line per memory) and open the files
  relevant to the task.
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
