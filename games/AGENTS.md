# Games

Rules that apply only to the games in this folder. The repository-wide rules (pushing, working with
the user, shared memory) are in the [repository instructions](../AGENTS.md).

Before working on a game, from either launch directory, follow its entry file. Each game owns its own
rules; nothing in one game's guides applies to another.

| Game | Entry | Notes |
| --- | --- | --- |
| Adventure (`adventure/`) | [adventure/AGENTS.md](adventure/AGENTS.md) | point-and-click game for desktop browsers (The Rift: Ashlands); Codex + Claude |
| Kota (`kota/`) | [kota/AGENTS.md](kota/AGENTS.md) | Brotato-style 2D top-down arena survivor for smartphones and tablets about Dakota culture (Lakota and Nakota later); Codex + Claude |
| Survival (`survival/`) | [survival/AGENTS.md](survival/AGENTS.md) | desktop Stronghold-style camp-management game about a fictional Dakota camp; Claude only for now, Codex for art later |
| FFCardGame (`FFCardGame/`) | its private, gitignored `AGENTS.md` | card-combat subgame serving Adventure |

The games are independent: nothing in one game's guides applies to the other. They share only the
Codex/Claude collaboration procedure, [WORKFLOW.md](WORKFLOW.md) (modes, ownership, handoff files,
approval); each game owns its request, design and art guides. Each game has its own skills, named
after it (`adventure-…`, `kota-…`), in `<game>/.claude/skills/` (Claude) and `<game>/.agents/skills/`
(Codex), kept identical. A skill holds discovery metadata and a link only; it owns no procedure.
There are no games-wide skills: launch from the game folder (`games/<game>/`) to use its skills.

A game's own docs reach this folder with `../` (for example `../WORKFLOW.md`) and the repository root
with `../../` (for example `../../AGENTS.md`).
