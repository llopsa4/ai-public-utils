# Adventure entrypoint

Follow the [parent repository instructions](../AGENTS.md).

## Start of a session (keep it cheap)

1. Read [WORKLOG.md](WORKLOG.md) sections *Checkout*, *Working on* and *Pending and paused*,
   your own handoff file and the other agent's: [from Claude](handoff/from-claude.md),
   [from Codex](handoff/from-codex.md).
2. Read [WORKFLOW.md](WORKFLOW.md) when the task involves ownership, another agent's work,
   art approval/installation, commits or the end-of-session handoff.
3. Read only the guide the task needs: [DEVELOPMENT.md](DEVELOPMENT.md) for game content and
   runtime, [art/PIPELINE.md](art/PIPELINE.md) for artwork, [TESTING.md](TESTING.md) before
   running checks. Read `STORY.md` (large, private) by searching for the relevant section,
   never in full.

**"continue"** means: read the other agent's handoff file, take the first open request
addressed to you, record it under *Taken from…* in your own file, do it, then report.
Write only your own handoff file ([rules](WORKFLOW.md#handoff-files)).

## Handling requests

Every request is interpreted with [PROMPTING.md](PROMPTING.md), even when the user does not
use a template. Do not re-read that file for each request; these are its standing rules:

- **Stage.** Identify DESIGN, WRITE, BUILD, CHANGE or REVIEW from the wording. If unclear,
  assume the smallest stage that answers it (an idea → DESIGN; "what's wrong" → REVIEW) and say
  which one you assumed. Never move to a later stage (script, code, finished art) uninvited.
- **DESIGN:** one recommended option (two only for puzzle ideas), short outline, required vs
  optional content, art needs listed but not produced. **WRITE:** text only, established voices,
  short player-facing lines. **BUILD/CHANGE:** only the requested behavior, existing art or
  placeholders as allowed, required tests, save compatibility. **REVIEW:** up to three problems
  with player effect and proposed fix; checked vs assumed; no fixes.
- **Missing fields.** Fill them from the existing game and guides. Ask only one blocking question
  when the answer would change the result; otherwise state the assumption and proceed.
- **Puzzles:** exact solution, visible clues, wrong attempts and recovery, nudge + plain hint,
  no dead ends across action orders and revisits.
- **Right agent.** If the task belongs to the other agent under [WORKFLOW.md](WORKFLOW.md), say
  so in one line and, if the user agrees, write it as a request in your handoff file.
- **Plans** end with one line, `Implement with: Sonnet` or `Implement with: Opus — <reason>`
  (Claude) / `Implement with: Codex`. The user's default Claude model is `opusplan` (Opus while
  planning, Sonnet when executing); flag only when Sonnet is not enough.
- **Stop** when the request is satisfied; list optional follow-ups instead of doing them. No
  publishing, commits or pushes unless asked. Keep reports and logs short.
