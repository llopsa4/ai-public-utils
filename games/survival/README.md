# Camp Fire (working title)

A Stronghold-style real-time camp-management game for **desktop browsers** about a **fictional
Dakota camp**. A few families with no fences or walls grow into a strong camp: assign families to
work, share food from a common store, keep the camp's kinship high, survive hunger and pests, and
fight waves of enemies that grow from wolves to rival raiders to the US military, with spirit fighters
and nature allies unlocked along the way. Made for local play.

Design decisions are in [DESIGN.md](DESIGN.md), the plan in [PLAN.md](PLAN.md) and the current state
in [WORKLOG.md](WORKLOG.md); contributors start at [AGENTS.md](AGENTS.md).

## Play

- **Status:** docs stage; there is no game to run yet. The first playable slice is built in
  PLAN.md Phase C.
- **Locally (from plan task C1 on):** from this folder run `npm install`, then `npm run dev`, and open
  the address it prints in a desktop browser.
- **Online (once published):** `/games/survival/` on the repository's GitHub Pages site.
- **Controls (planned):** left-click or drag a box to select, right-click to move, assign or attack,
  WASD or the screen edge to pan, the mouse wheel to zoom, Space to pause.

Runs entirely in the browser as static files: no server, no accounts, no network calls.
