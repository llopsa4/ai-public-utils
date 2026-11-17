# Kota entrypoint

Kota is an isometric roguelike about Lakota tribal culture. It is at the design stage: there is no
code or art yet. Follow the [repository instructions](../AGENTS.md) and the shared process:
[workflow](../process/WORKFLOW.md), [requests](../process/REQUESTS.md) and [art](../process/ART.md).

## Start of a session (keep it cheap)

1. Read [WORKLOG.md](WORKLOG.md) (active mode, current state), your own handoff file and the other
   agent's: [from Claude](handoff/from-claude.md), [from Codex](handoff/from-codex.md).
2. Read [DESIGN.md](DESIGN.md) for anything about the game, and [CULTURE.md](CULTURE.md) before any
   design, writing or art.

## Kota rules

- **CULTURE.md is binding.** Every DESIGN, WRITE and art-prompt request checks it and names the
  sections it relied on. Never invent cultural detail it does not source (ceremonies, sacred objects,
  regalia, symbols, names, Lakota words, history): add the gap under *Needs review* and ask the user.
- **DESIGN.md holds settled decisions only.** Proposals stay in the conversation or a handoff file
  until the user accepts them.
- **Guides not written yet:** art style (`art/STYLE.md`), request templates (`PROMPTING.md`),
  development and testing guides. Create each when that work starts, from the user's decisions;
  until then the shared process documents apply on their own.
- Adventure's rules (its style bible, story, flat-2D staging and characters) do not apply here.
