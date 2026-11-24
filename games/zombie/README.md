# Dead Woods

An early isometric zombie-survival game for desktop browsers. Two survivors start at an improvised
camp in the woods. Between story missions you manage the camp (food, scrap, upgrades) and hold off
the dead; on missions you sneak through Commandos-style maps with vision cones, noise and character
abilities to scavenge supplies. Mature content: visible gore.

All art is currently grey placeholder shapes.

Play: <https://llopsa4.github.io/ai-public-utils/games/zombie/>. Local development:
[DEVELOPMENT.md](DEVELOPMENT.md). Rules for working on the game: [AGENTS.md](AGENTS.md).

## Controls (first slice, as planned)

| Input | Action |
|---|---|
| Left-click | with a survivor selected: on a survivor selects them, on an enemy attacks, on an object (stove, crate, broken door or window) uses it, on the ground walks |
| Double left-click on the ground | run |
| Drag | box-select |
| Right-click | cancels a pending V / L / B / T / X command (gives no orders) |
| C | crouch / stand |
| V, then click | watch: hold position facing the click; attack any enemy entering the cone |
| F / G | Fighter: silent takedown / carry body |
| L, then click | Scout: throw a noise lure |
| Space | pause (cones stay visible) |
| Esc | cancels a pending command, otherwise opens the pause menu (Resume, Restart, Options, Controls, Quit); losing window focus opens it too |
| R | asks "Restart?" (Enter or Y restarts, Esc cancels) |
| WASD / screen edge, wheel | pan, zoom |
