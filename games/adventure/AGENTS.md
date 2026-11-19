# Adventure entrypoint

Adventure (The Rift: Ashlands) is a point-and-click game for desktop browsers. Follow the
[repository instructions](../../AGENTS.md) and the shared Codex/Claude
[workflow](../WORKFLOW.md) (modes, ownership, handoff files, approval, session handoff).
Adventure's own guides: [PROMPTING.md](PROMPTING.md) (request stages and templates),
[art/PIPELINE.md](art/PIPELINE.md) (art procedure), [DEVELOPMENT.md](DEVELOPMENT.md) and
[TESTING.md](TESTING.md).

## Start of a session (keep it cheap)

1. Read [WORKLOG.md](WORKLOG.md) sections *Checkout*, *Working on* and *Pending and paused*, your own
   handoff file and the other agent's: [from Claude](handoff/from-claude.md),
   [from Codex](handoff/from-codex.md).
2. Read the [shared workflow](../WORKFLOW.md) when the task involves ownership, another
   agent's work, art approval/installation, commits or the end-of-session handoff.
3. Read only the guide the task needs: [DEVELOPMENT.md](DEVELOPMENT.md) for game content and runtime
   (including desktop-only scope and the FFCardGame relationship), [art/PIPELINE.md](art/PIPELINE.md)
   and [art/STYLE.md](art/STYLE.md) for artwork, [TESTING.md](TESTING.md) before running checks,
   [PROMPTING.md](PROMPTING.md) for how requests and their stages are handled and the templates.

## Adventure rules

- **Story:** `STORY.md` is large, private and local; read it by searching for the relevant section,
  never in full. If it is unavailable, follow the shared
  [session-handoff rule](../WORKFLOW.md#session-handoff) for private files.
- **Visual authorities:** the [reference map](art/REFERENCES.md) identifies them, including the
  approved Kofi prologue tracking exception.
- **Scale:** scenes are sized against Silas (intro), Mara (his chapters) or Kofi (his chapter), with
  the heights in [STYLE.md](art/STYLE.md#proportions).
- **Requests:** every Adventure request follows the stages and standing rules in
  [PROMPTING.md](PROMPTING.md).
