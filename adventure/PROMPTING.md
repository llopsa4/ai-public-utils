# Requesting Adventure scenes, puzzles and changes

Describe the player experience; you do not need to name code files. Use one template per task
and delete fields you do not care about. The assistant should infer implementation details from
the existing game and [shared guides](DEVELOPMENT.md), not ask you to design the code.

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

For a substantial idea with unsettled decisions, ask only the most important blocking question,
one at a time. Once a design is approved, refer to it instead of restarting the discussion.

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

Use established story and character voices. Give one recommended design: entry state,
key player actions, meaningful interactions, exit state and connection to the next scene.
Separate required progression from optional discoveries. Identify new art needs without
producing art. Keep this to a short scene outline; do not write the full script yet.
```

A whole chapter should follow the game's chapter-shape checklist. An individual scene does not
need every chapter ingredient, such as fighting, unless that scene calls for it.

## 2. A story or character change

```text
CHANGE [specific scene, exchange or story beat].
Current version: [briefly identify it; no need to paste the entire story].
New intention: [...].
Reason: [what feels wrong or what I want the player to understand/feel].
Keep unchanged: [important facts, character traits, choices and later outcomes].
Stage: [propose the revision / write it / implement it].

Check the established story and immediately connected scenes. Point out contradictions
or affected puzzle dependencies before making a broad rewrite. Change only the necessary
material; summarize consequences for dialogue, clues, objectives and later references.
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

For each idea give the premise, exact solution, visible clues, plausible wrong attempts,
recovery, and two notebook hints: a nudge and a plain answer. Explain how the solution
follows from what the player can observe. Check alternate action orders and revisits
for dead ends. Recommend one; do not script both fully, implement them or generate art.
```

To develop the selected idea, follow with:

```text
Expand puzzle [name] only. Use the approved ingredients and outcome.
Give the starting state, numbered solution steps, item/state changes, clue placement,
wrong-action responses and recoverability. Include any meaningful alternative solution.
Flag unresolved design choices; no code or artwork yet.
```

## 4. Change how the game works

```text
CHANGE the behavior of [interaction, screen, movement, inventory, dialogue or combat].
When I: [specific player action].
Currently: [what happens].
I want: [what should happen instead].
It must still: [existing behavior to preserve].
Relevant device/input: [mouse, keyboard, touch, phone, or all].
Done when: [2–3 concrete examples of correct behavior].

Implement only this behavior. Inspect related code as needed, follow required tests,
and preserve existing save compatibility. Reuse existing art. Report the result and
anything that still needs visual or real-device verification; no unrelated polish.
```

## 5. Dialogue, descriptions or hints

```text
WRITE/REVISE [one conversation, object description or notebook hint].
Who/what and moment: [...].
Purpose: [information, emotional change, clue or consequential choice].
Tone and approximate length: [...].
Must communicate: [...]. Must not reveal/change: [...].

Use established voices and existing facts. Keep player-facing lines short. Preserve
choices and progression unless I ask to change them. Show the revised text only, with
one brief note if a dependency needs my decision. [Text proposal only / implement it].
```

## 6. Artwork for a specific game use

```text
DESIGN A BRIEF / PRODUCE ONE CANDIDATE for [named room, character, object or state].
Used in: [scene and exact role: background, removable prop, inventory icon, pose, etc.].
Desired change: [...]. Preserve: [approved identity, composition or source pixels].
References: [approved design or existing game asset].
States/directions needed: [...]. Quantity: [one candidate / specified batch].
Approval authority: [me / Claude].

Follow existing style, measured dimensions and registration; identify missing contract
information before production. Keep removable/changing objects separate. Deliver for
review under the shared art procedure; do not install or regenerate unrelated artwork.
```

## 7. Review a scene or puzzle

```text
REVIEW [one scene, puzzle or recent change]. Focus on [fairness / story continuity /
clarity / pacing / controls / a specific concern].

Inspect the relevant material and necessary dependencies only. Report up to three
important problems, their effect on the player and a proposed correction. If none are
found, say so. Distinguish checked behavior from assumptions. Do not implement fixes.
```

## Example: a small environmental puzzle

```text
DESIGN two puzzles for a short optional visit to the firing house after the kiln
has gone cold. Mara wants to retrieve an ordinary tool from a jammed storage drawer.
Use existing room objects and at most one carried item. No new character, fight or
finished art. Aim for 2–3 minutes and gentle difficulty. The solution should make the
room feel used and repaired, rather than turn it into a sequence of arbitrary locks.
Give each solution, observable clues, wrong-attempt recovery and two notebook hints.
Recommend one; do not write full dialogue or implement it yet.
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
  for the specific task. Keep logs and routine verification summaries short without skipping checks.
- End with: "Stop when this request is satisfied; list optional follow-ups instead of doing them."

The prompts intentionally link to shared game procedures rather than repeat their rules. They
request no publishing, commits or pushes unless those actions are explicitly added.
