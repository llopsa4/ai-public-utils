# Games

Browser games hosted on GitHub Pages together with the other applications in this repository. Rules
for working on them are in [AGENTS.md](AGENTS.md).

- [The Rift: Ashlands](https://llopsa4.github.io/ai-public-utils/games/adventure/) — a point-and-click adventure for desktop browsers (Phaser). See [the adventure guide](adventure/README.md).
- [Kiln Courier](https://llopsa4.github.io/ai-public-utils/games/FFCardGame/) — an original industrial-fantasy card combat prototype. See [local play instructions](FFCardGame/README.md).
- [Kota](https://llopsa4.github.io/ai-public-utils/games/kota/) — an early top-down arena survivor about Dakota culture, made for phones and tablets. See [the Kota guide](kota/README.md).
- [Dead Woods](https://llopsa4.github.io/ai-public-utils/games/zombie/) — an early isometric zombie-survival game (camp hub + Commandos-style stealth missions) for desktop browsers. See [the Dead Woods guide](zombie/README.md).

## Publishing

GitHub Pages serves the root of the `main` branch, so each game is published from its own folder under `games/`. See the [repository README](../README.md) for the general Pages notes.

Kiln Courier uses TypeScript, React, and Vite. Run `npm ci` and `npm run build` inside `games/FFCardGame` after changing its source; include its generated `index.html` and `build/` assets with the source changes. Its build preserves this branch-based hosting layout and does not build or replace the other applications. The Cinderfold adventure works the same way: run `npm ci` and `npm run build` inside `games/adventure`, then commit its generated `index.html` and `build/` with the source.
