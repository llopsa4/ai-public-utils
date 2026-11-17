# Handling requests

How Codex and Claude interpret every request in any game here, even when the user does not use a
template. Each game's `PROMPTING.md`, where it exists, holds only its fill-in templates. Ownership
and handoff rules are in [WORKFLOW.md](WORKFLOW.md).

## Stages

Identify the stage from the wording. If unclear, assume the smallest stage that answers it (an idea
→ DESIGN; "what's wrong" → REVIEW) and say which one you assumed. Never move to a later stage
(script, code, finished art) uninvited.

- **DESIGN:** propose the scene, mechanic or system; no code, finished artwork or full script. One
  recommended option (two only for puzzle ideas), short outline, required vs optional content, art
  needs listed but not produced. A scene gives entry state, key player actions, meaningful
  interactions, exit state and link to the next scene.
- **WRITE:** expand an approved design into dialogue, descriptions, clues and consequences, in
  established voices with short player-facing lines; show the revised text only, plus one note if a
  dependency needs a decision.
- **BUILD:** implement the approved design; only the requested behavior, existing art or
  placeholders as allowed, required tests, save compatibility, no unrelated polish; report what
  still needs visual verification.
- **CHANGE:** revise one existing scene, interaction or behavior while preserving the rest. A
  **story** change checks connected scenes, flags contradictions and puzzle dependencies before a
  broad rewrite, and summarizes consequences for dialogue, clues, objectives and later references.
  A **behavior** change follows the BUILD rules.
- **REVIEW:** inspect only the named material and its dependencies; up to three problems with
  player effect and proposed fix (or say none found); what was checked vs assumed; no fixes.

## Standing rules

- **Missing fields.** Fill them from the existing game and its guides. Ask only one blocking
  question when the answer would change the result; otherwise state the assumption and proceed.
  Substantial ideas with unsettled decisions are grilled as the
  [repository instructions](../AGENTS.md#working-with-the-user) say. Once a design is approved, refer
  to it instead of restarting the discussion.
- **Puzzle ideas:** premise, exact solution and how it follows from what the player observes,
  visible clues, wrong attempts and recovery, nudge + plain hint, no dead ends across action orders
  and revisits; recommend one. **Expanding** the chosen one: starting state, numbered steps,
  item/state changes, clue placement, wrong-action responses, recoverability, any alternative
  solution and unresolved choices; no code or art.
- **Art prompt:** write the revision's `PROMPTS.md` per [generation prompts](ART.md#generation-prompts),
  flag missing contract data, keep removable objects separate, never install; add a request for the
  generating agent.
- **Right agent.** If the task belongs to the other agent under [WORKFLOW.md](WORKFLOW.md), say so in
  one line and, if the user agrees, write it as a request in your handoff file.
- **Plans** end with one line, `Implement with: Sonnet` or `Implement with: Opus — <reason>` (Claude)
  / `Implement with: Codex`. The user's default Claude model is `opusplan` (Opus while planning,
  Sonnet when executing); flag only when Sonnet is not enough.
- **Stop** when the request is satisfied; list optional follow-ups instead of doing them. No
  publishing, commits or pushes unless asked. Keep reports and logs short.

## Hand-over phrases

- `continue`: the agent takes the first open request the other agent left for it
  ([WORKFLOW.md](WORKFLOW.md#handoff-files)).
- `Ask Codex to [task]` / `Ask Claude to [task]`: the agent writes the request in its own handoff
  file; then tell the other agent `continue`.

## Spend less usage on each request

- Settle the **player goal and desired payoff** before asking for rooms, dialogue or asset batches.
- Ask for **two short ideas**, choose one, then expand only that one.
- Name the scene and intended difference instead of requesting an unrestricted review.
- Say what must stay unchanged; this prevents unnecessary rewrites and save/progression changes.
- Reuse approved decisions and art references. Ask for the smallest acceptable prototype before
  commissioning finished artwork or every animation/state.
- Keep related iterations together. At a natural task boundary, start a fresh chat with the selected
  design, current state and next action.
- Use one implementing agent by default, and the right one for the task
  ([modes and ownership](WORKFLOW.md#modes-and-ownership)).
- Use `/model opusplan` in Claude. Plan mode is not available over Remote Control, so there use
  `/model opus` for DESIGN and REVIEW requests.
