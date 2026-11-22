# Dead Woods changelog

- 2026-11-22: Campaign and save: New Game → Camp → M starts mission 1 → extraction → Debrief (loot) → Camp, which then
  shows "To be continued...". Continue on the menu resumes from `localStorage` key `deadwoods.save` (food, scrap,
  barricades, missions done); the menu's "Mission 1 (test)" still runs the mission alone.
- 2026-11-22: Mission 1 playable (grey placeholders): vision cones, noise rings, crouch / crawl, watch,
- 2026-11-22: Camp threat and building: four zombies roam the woods (the same AI as on missions), V watch and
  right-click attack kill them, B places barricade segments for scrap (zombies chew them), both
  survivors dead restarts the camp.
  takedown, carry, lure, crates, extract, restart on death, pause. Reached from the menu's
  "Mission 1 (test)" button until the campaign (Z6) wires it in.
- 2026-11-22: Stealth core sim (vision cones, line of sight, bushes, noise, zombie and guard AI,
  watch order, combat, mission fail / extract), tested headless; no mission scene yet.
- 2026-11-22: First scaffold: title menu and an empty grey isometric camp grid with pan and zoom.
