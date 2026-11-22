# Dead Woods entrypoint

Dead Woods (working title; folder `zombie/`) is a zombie-survival game for **desktop browsers**
(mouse and keyboard, no touch) with two kinds of scenario: a **camp hub** (resources, upgrades,
defense) and **Commandos-style stealth missions** (scavenging with survivors who each have their own
abilities). It is 2D isometric with one fixed view, on Phaser 3 + Vite + TypeScript, and runs as
static files on GitHub Pages. Follow the [repository instructions](../../AGENTS.md) and the shared
Codex/Claude [workflow](../WORKFLOW.md) (modes, ownership, handoff files, approval, session handoff).

## Start of a session (keep it cheap)

1. Read [WORKLOG.md](WORKLOG.md) (mode, current state, next action), your own handoff file and the
   other agent's: [from Claude](handoff/from-claude.md), [from Codex](handoff/from-codex.md).
2. Find your task unit in [PLAN.md](PLAN.md) and read **only** the files it lists.
3. Read [DESIGN.md](DESIGN.md) only by the sections the unit names (`§n`).

## Dead Woods rules

- **DESIGN.md holds settled decisions only.** Proposals stay in the conversation or a handoff file
  until the user accepts them. New substantial ideas are grilled one question at a time.
- **Requests:** [PROMPTING.md](PROMPTING.md) (stages, standing rules, usage-saving rules, templates).
- **Plan:** [PLAN.md](PLAN.md) lists task units in order, each with a model, exact reads, writes and
  a "done when". One unit per session.
- **Art:** [art/STYLE.md](art/STYLE.md). **Codex draws, Claude never does:** Claude adds only flat
  grey geometric stand-ins (diamonds, capsules, boxes, text labels) drawn in code; Codex generates
  and installs all art, keyed by `art/manifest.json`.
- **Pages serves committed files.** The live site is the committed `index.html` and `build/`. When
  the user asks to push and the live game should change, run `npm run publish` and commit its output
  first; the push itself needs the user's explicit request and branch.
- **Free software only;** no paid tools, services or asset stores.
- **Guides:** [DEVELOPMENT.md](DEVELOPMENT.md) (commands, layout, conventions) and
  [TESTING.md](TESTING.md).
- **Skills:** Claude's is `.claude/skills/zombie-content/`; Codex's identical copy is
  `.agents/skills/zombie-content/`; keep them identical.
- **Memory:** shared memories about this game start with `zombie-`.
- Other games' rules (Survival's culture rules, Kota's touch controls, Adventure's story) do not
  apply here.
