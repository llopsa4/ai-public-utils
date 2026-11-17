# Requesting Adventure scenes, puzzles and changes

Describe the player experience; you do not need to name code files. Use one template per task
and delete fields you do not care about. The assistant infers implementation details from
the existing game and [shared guides](DEVELOPMENT.md), not by asking you to design the code.

Begin each request with its stage (DESIGN, WRITE, BUILD, CHANGE or REVIEW), so an idea does not
automatically become a large implementation. Both agents apply the stage rules, hand-over phrases
and usage tips in the shared [REQUESTS.md](../process/REQUESTS.md) automatically, so templates
contain only your fields. A one-line request such as "DESIGN a puzzle for the cold firing house" is
enough.

Examples below are hypothetical requests, not changes to the approved story or permission to
resume paused work. Artwork follows [the Adventure art procedure](art/PIPELINE.md).

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
([generation prompts](../process/ART.md#generation-prompts)) and leaves a request for Codex.
Then tell Codex: `continue` (hand-over phrases: [REQUESTS.md](../process/REQUESTS.md#hand-over-phrases)).

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
