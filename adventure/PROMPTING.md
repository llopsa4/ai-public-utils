# Requesting Adventure scenes, puzzles and changes

Describe the player experience; you do not need to name code files. Use one template per task
and delete fields you do not care about. The assistant infers implementation details from
the existing game and [shared guides](DEVELOPMENT.md), not by asking you to design the code.

Both agents apply the rules for each stage automatically through
[AGENTS.md](AGENTS.md#handling-requests), so templates contain only your fields. A one-line
request such as "DESIGN a puzzle for the cold firing house" is enough.

Examples below are hypothetical requests, not changes to the approved story or permission to
resume paused work. Story decisions follow [WORKFLOW.md](WORKFLOW.md); artwork follows
[PIPELINE.md](art/PIPELINE.md).

## Choose the stage

Begin with one of these, so an idea does not automatically become a large implementation:

- **DESIGN:** propose the scene or mechanics; no code, finished artwork or full dialogue script.
- **WRITE:** expand an approved design into dialogue, descriptions, clues and story consequences.
- **BUILD:** implement the approved design; state whether existing art or simple placeholders may be used.
- **CHANGE:** revise one existing scene, interaction or behavior while preserving the rest.
- **REVIEW:** inspect a specific scene/puzzle/change and report findings; do not implement fixes.

For a substantial idea with unsettled decisions, the agent asks only the most important blocking
question, one at a time. Once a design is approved, refer to it instead of restarting the discussion.

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
Then tell Codex: `continue`.

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

## 8. Continue or hand over

- `continue`: the agent takes the first open request the other agent left for it in `handoff/`.
- `Ask Codex to [task]` / `Ask Claude to [task]`: the agent writes the request in its own
  handoff file; then tell the other agent `continue`.

## Example: a small environmental puzzle

```text
DESIGN two puzzles for a short optional visit to the firing house after the kiln
has gone cold. Mara wants to retrieve an ordinary tool from a jammed storage drawer.
Use existing room objects and at most one carried item. No new character, fight or
finished art. Aim for 2–3 minutes and gentle difficulty. The solution should make the
room feel used and repaired, rather than turn it into a sequence of arbitrary locks.
```

## Spend less usage on each request

- Settle the **player goal and desired payoff** before asking for rooms, dialogue or asset batches.
- Ask for **two short ideas**, choose one, then expand only that one. Request more only if neither fits.
- Name the scene and intended difference instead of requesting an unrestricted review of the game.
- Say what must stay unchanged; this prevents unnecessary rewrites and save/progression changes.
- Reuse approved decisions and art references. Ask for the smallest acceptable prototype before
  commissioning finished artwork or every animation/state.
- Keep related iterations together. At a natural task boundary, start a fresh chat with the
  selected design, current state and next action; do not paste the entire previous conversation.
- Use one implementing agent by default. Avoid additional AI review/startup sessions unless useful
  for the specific task. Agents stop when the request is satisfied and list optional follow-ups.
- Use the right agent: Claude for design, writing, tricky code and art prompts; Codex for image
  generation, art delivery/installation, routine wiring and long test runs.
- Use `/model opusplan` in Claude: Opus plans, Sonnet implements. Each plan ends with an
  "Implement with:" line; switch to Opus manually only when it says so. Plan mode is not
  available over Remote Control, so there use `/model opus` for DESIGN and REVIEW requests.

Agents never publish, commit or push unless the request explicitly asks for it.
