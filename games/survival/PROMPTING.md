# Requesting and handling Survival work

How Codex and Claude interpret every Survival request, even without a template, followed by fill-in
templates. Ownership, handoffs, approval and hand-over phrases are in the shared
[workflow](../WORKFLOW.md). Game decisions are in [DESIGN.md](DESIGN.md) (settled decisions only);
real-culture content in [CULTURE.md](CULTURE.md).

Describe the player experience; you do not need to name code files. Use one template per task and
delete fields you do not care about. Examples are hypothetical requests, not approved content.

## Stages

Begin each request with its stage. If unclear, assume the smallest stage that answers it (an idea ->
DESIGN; "what's wrong" -> REVIEW; "find out about" -> RESEARCH) and say which one you assumed. Never
move to a later stage (spec, code, final art) uninvited.

- **RESEARCH:** gather facts for one named real-culture topic. Nation-authored sources first; one
  source link per claim. Output goes to CULTURE.md *Needs review*; nothing is used until the user
  approves it.
- **DESIGN:** propose a building, unit, society, enemy, wave, boss, resource, hardship, upgrade or
  system; no code. One recommended option (two only when asked for ideas), short outline, numbers
  where they matter, data shape if it adds JSON, art needs listed but not produced.
- **WRITE:** player-facing text (tooltips, event messages, menu and help text). English, short lines.
- **BUILD:** implement an approved design or plan task unit: only the requested behaviour,
  placeholder art unless approved art exists, save compatibility once saves exist, no unrelated
  polish. Report what still needs checking in the browser.
- **CHANGE:** revise one existing element while preserving the rest; a behaviour change follows the
  BUILD rules and names what it must keep.
- **REVIEW:** inspect only the named material: up to three problems, each with its player effect and
  a proposed fix (or say none found), plus what was checked vs assumed. No fixes.
- **ART:** write or revise the generation prompt for one named sprite or tile, following
  [art/PIPELINE.md](art/PIPELINE.md) and [art/SPEC.md](art/SPEC.md). Never install without approval.

## Standing rules

- **Fiction first.** Invention is free for game content; real words, names and practices need a
  CULTURE.md entry (DESIGN.md section 9).
- **Claude's limits always apply:** no real historical people, no hateful caricature, slurs or mock
  war cries, no real named sacred ceremonies or objects as mechanics. Past them, Claude says so and
  offers the nearest fictional version.
- **Enemies drop no loot.** A defeated pack ends the threat; a defeated raid restores what it stole.
- **Desktop mouse first.** Behaviour is specified for mouse and keyboard on a desktop browser
  (left-click select, box-select, right-click order, WASD/edge pan, wheel zoom, hotkeys).
- **Simulation apart from drawing.** Game rules live in `src/sim/` (no Phaser), numbers and content
  in `src/data/*.json`; scenes only draw and send orders (PLAN.md *Fixed technical shape*).
- **Free software only.** Open-source tools and libraries; no paid tools, services or asset stores.
  No LICENSES.md (user, 2026-11-19).
- **Missing fields:** fill them from the game and guides. Ask one blocking question only when the
  answer would change the result; otherwise state the assumption. Substantial unsettled ideas are
  grilled one question at a time ([repository instructions](../../AGENTS.md#working-with-the-user)).
- **Never commit or push** unless the user explicitly asks in that message.

## Spend less usage on each request

- **One task unit per session.** A unit names its stage, the files to read, the files to write and a
  "done when" check. Do not widen it.
- **Read only what the unit lists,** by `##` section or line range where possible. Prefer DESIGN.md
  and DESIGN-slice.md summaries over re-reading code another unit already described.
- **Data over code:** buildings, jobs, resources, enemies and waves live in JSON, so content changes
  edit data, not systems.
- **Stop at approval gates** (slice spec, playtest, art batches) instead of building ahead.
- **Leave the next session cheap:** end by updating WORKLOG.md *Next action* (three lines or fewer)
  and your handoff file.
- **Every plan names a model for each task unit** and ends with `Implement with: <model>`, using the
  cheapest that can do the work well:

  | Model | Use for |
  |---|---|
  | Haiku | Mechanical edits from a precise spec: recording settled decisions, JSON entries, WORKLOG/handoff updates, renames |
  | Sonnet | Most BUILD and CHANGE units with a clear spec, bounded RESEARCH, WRITE, routine REVIEW |
  | Opus | DESIGN of systems, specs and plans, architecture (simulation, pathing, save format), balance, hard bugs |

  Image generation stays with Codex. If a unit is harder than its model can manage, stop and say so.

## Templates

### 1. A game element

```text
DESIGN [building / unit / society / enemy / wave / boss / resource / hardship / upgrade].
Player experience: [what it feels like to build, use or face it].
When: [era or wave range / season / tier].
Costs and trade-off: [what the camp gives up].
Must include: [...]. Must preserve: [balance, existing content].
```

### 2. Change how the game works

```text
CHANGE the behaviour of [selection, orders, jobs, store, hunger, Wotakuye, waves, combat...].
When I: [mouse or key action].
Currently: [what happens].
I want: [what should happen instead].
It must still: [behaviour to preserve].
Done when: [2-3 concrete examples].
```

### 3. Player-facing text

```text
WRITE [tooltip / event message / help text] for [element].
Purpose: [explain, warn, flavour]. Approximate length: [...].
[Text proposal only / implement it].
```

### 4. Art: one sprite or tile

```text
ART [person / building / enemy / tile / prop / icon]: [key from art/manifest.json].
Used as: [...]. Approved design: [DESIGN.md section or spec heading].
Needs: [size, anchor, frames from art/SPEC.md]. Approval: [me / Claude].
```

### 5. A task unit from the plan

```text
BUILD task [id: name] from PLAN.md.
```

### 6. Review

```text
REVIEW [one element, change or text]. Focus on [balance / clarity / controls / performance /
cultural accuracy].
```
