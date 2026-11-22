# Kota entrypoint

Kota is a Brotato-style 2D top-down arena survivor for smartphones and tablets (touch controls),
about Dakota culture first (Lakota and Nakota later). It was pivoted on 2026-11-18 and has a playable
Phaser 3 milestone per [PLAN.md](PLAN.md); the old 3D game is retired. Follow the
[repository instructions](../../AGENTS.md) and the shared Codex/Claude
[workflow](../WORKFLOW.md) (modes, ownership, handoff files, approval, session handoff).

## Start of a session (keep it cheap)

1. Read [WORKLOG.md](WORKLOG.md) (active mode, current state), your own handoff file and the other
   agent's: [from Claude](handoff/from-claude.md), [from Codex](handoff/from-codex.md).
2. Read [DESIGN.md](DESIGN.md) for anything about the game, and [CULTURE.md](CULTURE.md) before any
   design, writing or art.

## Kota rules

- **CULTURE.md is reference, not binding** (user, 2026-11-18). Game content may be invented when it
  is plainly fantasy (weapons, items, spirit enemies, arenas, props, upgrades). Claims about the real
  culture (named beings, history, words, what Dakota people did) still need a source in CULTURE.md;
  add a gap under *Needs review* and ask the user. Claude's own limits always apply (PROMPTING.md
  *Standing rules*).
- **DESIGN.md holds settled decisions only.** Proposals stay in the conversation or a handoff file
  until the user accepts them.
- **Requests:** [PROMPTING.md](PROMPTING.md) defines stages, standing rules, usage-saving rules and
  templates for every Kota request.
- **Plan:** [PLAN.md](PLAN.md) lists the task units, easiest first, each with a recommended model.
- **Art:** [art/PIPELINE.md](art/PIPELINE.md) is the 2D painted-still procedure. [art/STYLE.md](art/STYLE.md)
  still describes the 3D era until plan task D1 rewrites it; follow PIPELINE.md and PLAN.md where they disagree.
- **Development and testing guides:** not yet written. Current local run instructions are in
  [README.md](README.md); the task recipe is in [PLAN.md](PLAN.md). Dedicated guides, when requested,
  must describe this Phaser 2D touch game.
- Adventure's rules (its style bible, story, flat-2D point-and-click staging, desktop scope and
  characters) do not apply here, and Adventure's guides are not templates to copy unchanged.
