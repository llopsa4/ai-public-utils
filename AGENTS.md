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

## Projects

Before working on a project, from either launch directory, follow its entry file. Each project owns
its own rules; nothing in one project's guides applies to another.

| Project | Entry | Notes |
| --- | --- | --- |
| Adventure (`adventure/`) | [adventure/AGENTS.md](adventure/AGENTS.md) | point-and-click game for desktop browsers (The Rift: Ashlands); Codex + Claude |
| Kota (`kota/`) | [kota/AGENTS.md](kota/AGENTS.md) | Brotato-style 2D top-down arena survivor for smartphones and tablets about Dakota culture (Lakota and Nakota later); Codex + Claude |
| FFCardGame (`FFCardGame/`) | its private, gitignored `AGENTS.md` | card-combat subgame serving Adventure |
| Calendar (`calendari/`) | [calendari/AGENTS.md](calendari/AGENTS.md) | scheduling app with privacy rules |

The games are independent: nothing in one game's guides applies to the other. They share only the
Codex/Claude collaboration procedure, [process/WORKFLOW.md](process/WORKFLOW.md) (modes, ownership,
handoff files, approval); each game owns its request, design and art guides. Each game has its own
skills, named after it (`adventure-…`, `kota-…`), in `<game>/.claude/skills/` (Claude) and
`<game>/.agents/skills/` (Codex), kept identical. A skill holds discovery metadata and a link only;
it owns no procedure. There are no repository-wide game skills: launch from the game folder to use
its skills.

## Shared memory (Claude and Codex)

Both agents share `.agents/memory/` relative to this checkout's repository root. It is
git-ignored and lives only on this PC: never commit or push it. Claude's existing memory
junction links to that folder. Do not substitute a different checkout's memory when it is absent.

- **At the start of a session,** read `MEMORY.md` there (one line per memory) and open the files
  relevant to the task. If local memory is absent, use tracked instructions and acknowledge
  unavailable context; do not invent past decisions.
- **When you learn something lasting that no guide owns,** write it there: a user preference, a
  correction, a decision, a project constraint not visible in the code, or a pointer to an outside
  resource. A rule that belongs in a project guide (a style, workflow or content rule) goes into that
  guide instead, once, and not into memory. Don't save code facts the repo already records.
- **Project scope:** a memory about one project starts its name with that project
  (`adventure-…`, `kota-…`) and says so in its description; it never applies to another project.
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
