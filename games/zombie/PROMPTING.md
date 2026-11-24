# Requesting and handling Dead Woods work

How Codex and Claude interpret every Dead Woods request, followed by fill-in templates. Ownership,
handoffs, approval and hand-over phrases are in the shared [workflow](../WORKFLOW.md). Game decisions
are in [DESIGN.md](DESIGN.md) (settled decisions only).

## Stages

Begin each request with its stage. If unclear, assume the smallest stage that answers it and say
which one you assumed. Never move to a later stage (spec, code, final art) uninvited.

- **DESIGN:** propose a survivor, ability, enemy, mission, upgrade, camp or story step; no code. One
  recommended option, short outline, numbers where they matter, data shape if it adds JSON, art needs
  listed but not produced. Settled results go to DESIGN.md and new rows to PLAN.md, nothing else.
- **WRITE:** player-facing text (mission briefings, tooltips, menu and help text). English, short.
  Dialogue lines go in `data/story.json` (DESIGN §6) and need the user's approval.
- **BUILD:** implement an approved design or PLAN.md unit: only the requested behaviour, grey
  placeholders unless approved art exists, save compatibility once saves exist, no unrelated polish.
  Report what still needs checking in the browser.
- **CHANGE:** revise one existing element while preserving the rest; names what it must keep.
- **REVIEW:** inspect only the named material: up to three problems, each with its player effect and
  a proposed fix (or none found), plus what was checked vs assumed. No fixes.
- **ART:** Claude writes the generation prompt for one manifest key; Codex generates and installs.

## Standing rules

- **Mature, not gratuitous:** visible gore is allowed (DESIGN §6). Human enemies are fictional
  groups; no real people, brands, places presented as real, or hateful caricature.
- **Desktop mouse first** (DESIGN §1).
- **Simulation apart from drawing:** rules in `src/sim/` (no Phaser), numbers in `src/data/*.json`;
  scenes only draw and send orders.
- **Free software only.**
- **Missing fields:** fill them from the game and guides. Ask one blocking question only when the
  answer would change the result; otherwise state the assumption. Substantial unsettled ideas are
  grilled one question at a time ([repository instructions](../../AGENTS.md#working-with-the-user)).
- **Never commit or push** unless the user explicitly asks in that message.

## Spend less usage on each request

- **One task unit per session.** A unit names its stage, files to read, files to write and a "done
  when" check. Do not widen it.
- **Read only what the unit lists,** DESIGN.md by `§n`, other units' code by exported signatures.
- **Data over code:** stats, enemies, missions and upgrades live in JSON.
- **Stop at approval gates** (playtest, art batches) instead of building ahead.
- **Leave the next session cheap:** end by updating WORKLOG.md *Next action* (three lines or fewer),
  the PLAN.md row status and your handoff file.
- **Every plan names a model for each unit** and ends with `Implement with: <model>`, using the
  cheapest that can do the work well:

  | Model | Use for |
  |---|---|
  | Haiku | Mechanical edits from a precise spec: recording decisions, JSON entries, WORKLOG/handoff updates, renames, running publish/tests |
  | Sonnet | Most BUILD and CHANGE units with a clear spec, WRITE, routine REVIEW |
  | Opus | DESIGN of systems and plans, stealth AI, line of sight, pathing, save format, balance, hard bugs |

  Image generation stays with Codex. If a unit is harder than its model can manage, stop and say so.

## Templates

```text
BUILD task Zn from PLAN.md.
```

```text
DESIGN [survivor / ability / enemy / mission / upgrade / story step].
Player experience: [...]. When: [story point]. Must include: [...]. Must preserve: [...].
```

```text
CHANGE the behaviour of [selection, orders, vision, noise, abilities, camp...].
When I: [input]. Currently: [...]. I want: [...]. It must still: [...].
Done when: [2-3 concrete examples].
```

```text
REVIEW [one element or change]. Focus on [stealth fairness / controls / balance / performance].
```
