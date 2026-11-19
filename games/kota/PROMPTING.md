# Requesting and handling Kota work

How Codex and Claude interpret every Kota request, even without a template, followed by fill-in
templates. Ownership, handoffs, approval and hand-over phrases are in the shared
[workflow](../WORKFLOW.md). Cultural content is governed by [CULTURE.md](CULTURE.md), which
is reference, not binding (user, 2026-11-18); game decisions by [DESIGN.md](DESIGN.md), which holds settled decisions only.

Describe the player experience; you do not need to name code files. Use one template per task and
delete fields you do not care about. The assistant infers implementation details from the existing
game and its guides. Examples are hypothetical requests, not approved content.

## Stages

Begin each request with its stage. If unclear, assume the smallest stage that answers it (an idea →
DESIGN; "what's wrong" → REVIEW; "find out about" → RESEARCH) and say which one you assumed. Never
move to a later stage (spec, code, finished models) uninvited.

- **RESEARCH:** gather cultural facts for one named topic and one nation (Lakota, Dakota or
  Nakota). Nation-authored sources first; museum and academic sources only to corroborate. One
  source link per claim. Flag anything sacred or restricted as *do not use*. Output goes to
  `research/<nation>.md` and proposals to CULTURE.md *Needs review*; nothing is used until the user
  approves it.
- **DESIGN:** propose a room, enemy, boss, gift, item, ability, camp feature or system; no code or
  finished models. One recommended option (two only when asked for ideas), short outline, required
  vs optional content, art needs listed but not produced. Every real-culture element cites its
  CULTURE.md entry; a gap goes to *Needs review*. Game content may be invented (see Standing rules).
- **WRITE:** expand an approved design into player-facing text (elder stories, helper lines, item
  and gift descriptions). English, short lines; native words only with their CULTURE.md entry and a
  visible translation.
- **BUILD:** implement an approved design or task unit: only the requested behavior, placeholder
  (grey-box) art unless approved art exists, save compatibility, no unrelated polish. Report what
  still needs checking on a touch device.
- **CHANGE:** revise one existing element while preserving the rest. A content change checks the
  linked CULTURE.md entries and the rooms, items and stories that depend on it; a behavior change
  follows the BUILD rules.
- **REVIEW:** inspect only the named material and its dependencies: up to three problems, each with
  its player effect and a proposed fix (or say none found), plus what was checked vs assumed. No
  fixes. A cultural review checks against CULTURE.md's reference notes (*Off-limits*) and Claude's limits first.
- **ART:** write or revise the image-generation prompt for one named hand-painted 2D still (for
  example a hero, threat, item or prop), following `art/PIPELINE.md` and `art/STYLE.md`. Never
  install into the game without approval.

## Standing rules

- **Culture first.** Every DESIGN, WRITE, ART and cultural REVIEW names the CULTURE.md sections
  it relied on for any real-culture claim. Invention is allowed for game content when it is plainly
  fantasy. Real names, words and history still need a source.
- **Claude's limits always apply** (the reference notes in CULTURE.md *Off-limits*, not binding for
  design): no ceremonies or sacred objects as mechanics, no sacred beings as
  foes, no trophies, no eagle feathers or headdresses as loot or tiers, no real historical people,
  no stereotypes or war-whoops, no mixing one nation's dress with another's.
- **Rewards are never taken from the fallen.** Hoarding monsters *release* what they took; winter,
  hunger and sickness threats make the *land renew*. Helper gifts come between rooms.
- **Equipment is visible only when equipped.** An item mesh is attached to the hero when it is
  equipped and removed when it is unequipped, never shown otherwise.
- **Free software only.** Use open-source tools and libraries and CC0, CC-BY or OFL assets. Record
  each third-party library or asset (version, licence, URL) in `LICENSES.md` in the same change. No
  paid tools, services or asset stores.
- **Touch first.** Behavior is specified for the touch controls (floating left stick; attack, dash
  and abilities on the right; auto-aim; drag-aim; left-hand swap) in landscape on phones and tablets.
- **Missing fields.** Fill them from the existing game and guides. Ask only one blocking question
  when the answer would change the result; otherwise state the assumption and proceed. Substantial
  unsettled ideas are grilled one question at a time, as the
  [repository instructions](../../AGENTS.md#working-with-the-user) say.
- **Never push** unless the user explicitly asks in that message.

## Spend less usage on each request

- **One task unit per session.** A unit names its stage, the files to read, the files to write and
  a "done when" check. Do not widen it.
- **Read only what the unit lists.** Prefer the summaries in DESIGN.md, CULTURE.md and
  `research/<nation>.md` over re-reading sources or code another unit already summarised.
- **Bound research:** one nation and one topic per request, about ten searches at most, with
  standard-mode web search unless the results are thin.
- **Data over code:** gifts, items, enemies and rooms live in JSON files under `game/data/`, so
  content changes edit data, not systems.
- **Stop at approval gates** (research entries, slice spec, art look) instead of building ahead.
- **Leave the next session cheap:** finish by updating WORKLOG.md's *Next action* in three lines or
  fewer, and your handoff file.
- Ask for **two short ideas**, choose one, then expand only that one; say what must stay unchanged.
- **Every plan names a recommended Claude model for each task unit,** using the cheapest model
  that can do the work well:

  | Model | Use for |
  |---|---|
  | Haiku | Mechanical edits from a precise spec: recording settled decisions, JSON data entries, licence rows, WORKLOG/handoff updates, renames |
  | Sonnet | Most BUILD and CHANGE units with a clear spec, bounded RESEARCH, WRITE, routine REVIEW |
  | Opus | DESIGN of systems, cultural REVIEW against CULTURE.md, architecture (renderer, input, save format), hard bugs, plans and specs |

  Image generation stays with Codex. If a unit turns out harder than its model can manage, stop and
  say so rather than continuing at low quality.

## Templates

## 1. Research a topic

```text
RESEARCH [topic: homeland / stories with defeatable monsters / helper figures / clothing /
tools and weapons / fighting traditions / words] for [Lakota / Dakota / Nakota].
For use in: [rooms, enemies, items, hero, text...].
Sources I already trust: [optional].
```

## 2. A game element

```text
DESIGN [room / enemy / boss / gift / item / ability / camp feature] for [nation or shared].
Player experience: [what it feels like to meet or use it].
Run position: [early rooms / late rooms / boss / camp].
Reward framing: [released / land renews / helper gift / none].
Must include: [...]. Must preserve: [existing balance, items, stories].
```

## 3. Change how the game works

```text
CHANGE the behavior of [movement, attack, dash, ability, equipment, gifts, camp, saving...].
When I: [touch action].
Currently: [what happens].
I want: [what should happen instead].
It must still: [behavior to preserve].
Device: [phone / tablet / both].
Done when: [2–3 concrete examples].
```

## 4. Player-facing text

```text
WRITE/REVISE [elder story / helper line / item or gift description] for [element].
Purpose: [lore, hint, feeling].
Approximate length: [...].
CULTURE.md entries to use: [or "find them"].
[Text proposal only / implement it].
```

## 5. Art: one painted still

```text
ART [hero / threat / item / prop] for [nation].
Used as: [player hero / enemy / weapon / garment / prop].
Approved design and CULTURE.md entries: [...].
Needs: [size and facing from art/PIPELINE.md, palette, any new pose].
Approval: [me / Claude].
```

## 6. A task unit from the plan

```text
BUILD task [T-id: name].
Read: [files]. Write: [files].
Done when: [checks, e.g. passes in Chrome mobile emulation at 844×390 with no console errors].
```

## 7. Review

```text
REVIEW [one element, room, change or text]. Focus on [cultural accuracy / off-limits /
touch controls / balance / clarity / performance on phones].
```

## Example: a hoarding monster

```text
DESIGN one enemy for the Dakota late rooms: a monster from an approved story that
hoards what it took from the people. When it is defeated, what it held is released and
returned to the camp. Use only CULTURE.md entries; list any gaps under Needs review.
Grey-box art only. No new systems.
```
