# Survival entrypoint

Survival (working title in [README.md](README.md)) is a Stronghold-style real-time camp-management
game for **desktop browsers** (mouse and keyboard, no touch), about a **fictional Dakota camp**: a
few families grow into a strong camp, manage shared resources and fight escalating enemy waves.
It is 2D isometric on Phaser 3 + Vite + TypeScript and runs as static files on GitHub Pages. Follow
the [repository instructions](../../AGENTS.md) and the shared Codex/Claude
[workflow](../WORKFLOW.md) (modes, ownership, handoff files, approval, session handoff).

## Start of a session (keep it cheap)

1. Read [WORKLOG.md](WORKLOG.md) (active mode, current state, next action), your own handoff file and
   the other agent's: [from Claude](handoff/from-claude.md), [from Codex](handoff/from-codex.md).
2. Find your task unit in [PLAN.md](PLAN.md) and read **only** the files it lists.
3. Read [DESIGN.md](DESIGN.md) only for questions the task's files do not answer, and
   [CULTURE.md](CULTURE.md) before writing any real-culture content.

## Survival rules

- **DESIGN.md holds settled decisions only.** Proposals stay in the conversation or a handoff file
  until the user accepts them.
- **Fiction first.** Factions, spirits, allies, upgrades and enemies may be invented. Claims about
  the real culture (words, names, what Dakota people did) need a source in CULTURE.md; a gap goes
  under *Needs review* and is asked of the user. Claude's own limits always apply
  ([PROMPTING.md](PROMPTING.md) *Standing rules*).
- **Requests:** [PROMPTING.md](PROMPTING.md) defines stages, standing rules, usage-saving rules and
  templates.
- **Plan:** [PLAN.md](PLAN.md) lists the task units, easiest first, each with a model, exact reads,
  writes and a "done when".
- **Art:** [art/PIPELINE.md](art/PIPELINE.md) (procedure) and [art/SPEC.md](art/SPEC.md) (sizes,
  anchors, palette); the register is [art/ASSETS.md](art/ASSETS.md). Claude draws placeholders in
  code; Codex generates final art later.
- **Free software only;** this game keeps no LICENSES.md (user, 2026-11-19).
- **Guides:** [DEVELOPMENT.md](DEVELOPMENT.md) (commands, layout) and [TESTING.md](TESTING.md)
  (unit and smoke tests, hand checks).
- **Skills:** Claude's is `.claude/skills/survival-content/`; Codex's identical copy in
  `.agents/skills/` is created when Codex starts working here.
- Kota's and Adventure's rules (touch controls, style bibles, stories, staging) do not apply here,
  and their guides are not templates to copy unchanged.
