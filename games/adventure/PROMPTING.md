# Requesting and handling Adventure work

How Codex and Claude interpret every Adventure request, even without a template, followed by the
fill-in templates. Ownership, handoffs and approval are in the repository
[workflow](../WORKFLOW.md), which also holds the rules that apply to every request
(hand-over phrases, plan endings, stopping, saving usage).

Describe the player experience; you do not need to name code files. Use one template per task and
delete fields you do not care about. The assistant infers implementation details from the existing
game and [DEVELOPMENT.md](DEVELOPMENT.md), not by asking you to design the code. Examples are
hypothetical requests, not changes to the approved story or permission to resume paused work.

## Stages

Begin each request with its stage, so an idea does not automatically become a large implementation.
Identify the stage from the wording. If unclear, assume the smallest stage that answers it (an idea
→ DESIGN; "what's wrong" → REVIEW) and say which one you assumed. Never move to a later stage
(script, code, finished art) uninvited. A one-line request such as "DESIGN a puzzle for the cold
firing house" is enough.

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
  [repository instructions](../../AGENTS.md#working-with-the-user) say. Once a design is approved, refer
  to it instead of restarting the discussion.
- **Puzzle ideas:** premise, exact solution and how it follows from what the player observes,
  visible clues, wrong attempts and recovery, nudge + plain hint, no dead ends across action orders
  and revisits; recommend one. **Expanding** the chosen one: starting state, numbered steps,
  item/state changes, clue placement, wrong-action responses, recoverability, any alternative
  solution and unresolved choices; no code or art.
- **Art prompt:** write the revision's `PROMPTS.md` per
  [generation prompts](art/PIPELINE.md#generation-prompts), flag missing contract data, keep
  removable objects separate, never install; add a request for the generating agent.

## Spend less usage on each request

- Settle the **player goal and desired payoff** before asking for rooms, dialogue or asset batches.
- Ask for **two short ideas**, choose one, then expand only that one.
- Name the scene and intended difference instead of requesting an unrestricted review.
- Say what must stay unchanged; this prevents unnecessary rewrites and save/progression changes.
- Reuse approved decisions and art references. Ask for the smallest acceptable prototype before
  commissioning finished artwork or every animation/state.

## Templates

## 1. A new scene

```text
DESIGN one scene for Adventure.
Where/when: [chapter, location, and what just happened].
Viewpoint and other characters: [...].
Player goal: [...].
Story purpose: [what the player should learn, feel, decide or change].
Play: [exploration / conversation / puzzle / fight / a combination].
Length and difficulty: [approximate minutes; easy/moderate/hard].
Must include: [...]. Must preserve: [existing events, relationships or outcomes].
```

A whole chapter follows the [chapter checklist](DEVELOPMENT.md#authoring-chapter-content). An
individual scene does not need every chapter ingredient, such as fighting.

## 2. A story or character change

```text
CHANGE [specific scene, exchange or story beat].
Current version: [briefly identify it; no need to paste the entire story].
New intention: [...].
Reason: [what feels wrong or what I want the player to understand/feel].
Keep unchanged: [important facts, character traits, choices and later outcomes].
Stage: [propose the revision / write it / implement it].
```

## 3. Generate puzzle ideas

```text
DESIGN two distinct puzzle ideas for [location and situation].
Player goal: [...].
Available people, objects and carried items: [known ingredients, or use existing ones].
Preferred kind: [mechanical / environmental / social / inventory / no preference].
Difficulty and length: [...].
Desired story payoff: [...].
Avoid: [unwanted mechanics, extra rooms, new characters, arbitrary item combinations].
```

To develop the selected idea: `Expand puzzle [name] only.`

## 4. Change how the game works

```text
CHANGE the behavior of [interaction, screen, movement, inventory, dialogue or combat].
When I: [specific player action].
Currently: [what happens].
I want: [what should happen instead].
It must still: [existing behavior to preserve].
Input: [mouse, trackpad, keyboard, or all].
Done when: [2–3 concrete examples of correct behavior].
```

## 5. Dialogue, descriptions or hints

```text
WRITE/REVISE [one conversation, object description or notebook hint].
Who/what and moment: [...].
Purpose: [information, emotional change, clue or consequential choice].
Tone and approximate length: [...].
Must communicate: [...]. Must not reveal/change: [...].
[Text proposal only / implement it].
```

## 6. Artwork for a specific game use

Ask Claude for the generation prompt; Claude writes it to the revision's `PROMPTS.md`
([generation prompts](art/PIPELINE.md#generation-prompts)) and leaves a request for Codex.
Then tell Codex: `continue` (hand-over phrases: [workflow](../WORKFLOW.md#hand-over-phrases)).

```text
WRITE THE GENERATION PROMPT for [named room, character, object or state].
Used in: [scene and exact role: background, removable prop, inventory icon, pose, etc.].
Desired change: [...]. Preserve: [approved identity, composition or source pixels].
References: [approved design or existing game asset].
States/directions needed: [...]. Quantity: [one candidate / specified batch].
Approval authority: [me / Claude].
```

## 7. Review a scene or puzzle

```text
REVIEW [one scene, puzzle or recent change]. Focus on [fairness / story continuity /
clarity / pacing / controls / a specific concern].
```

## Example: a small environmental puzzle

```text
DESIGN two puzzles for a short optional visit to the firing house after the kiln
has gone cold. Mara wants to retrieve an ordinary tool from a jammed storage drawer.
Use existing room objects and at most one carried item. No new character, fight or
finished art. Aim for 2–3 minutes and gentle difficulty. The solution should make the
room feel used and repaired, rather than turn it into a sequence of arbitrary locks.
```
