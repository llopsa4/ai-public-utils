# Kiln Courier

An original, silent, desktop-first industrial-fantasy card combat prototype. Play Mara, a ceramic-armored courier with a pressure gauntlet, against the Hollow Kiln.

The prototype uses TypeScript, React, and Vite. Its seeded combat rules run independently of the interface. This refactor preserves the existing one-battle game; campaign features are developed separately.

## Develop

Install Node.js 22.12 or newer. From this folder:

```powershell
npm ci
npm run dev
```

Open the local URL printed by Vite (normally http://127.0.0.1:5173/). Dependencies are pinned in package-lock.json. No account, API key, backend, or external runtime service is needed.

## Check and build

```powershell
npm run typecheck
npm test
npm run playtest
npm run build
```

`npm run check` runs type checking, the test suite, and the production build together. Tests run directly against the TypeScript engine using Node's test runner through tsx. The playtest compares three policies over 100 seeded battles each.

The Vite source entry is `client/index.html`. Production output is first generated in ignored `dist/`, then `scripts/build.mjs` updates the generated root `index.html` and `build/`. A build verifier checks asset parity, relative entry URLs, and exclusion of private documents.

Keep the generated `index.html` and `build/` with the source changes when preparing a release: this repository's GitHub Pages deployment serves the root of main directly. The game remains at `/ai-public-utils/FFCardGame/`; the other applications and hosting settings require no changes. Only push on an explicit user instruction.

After building, preview with `npm run preview`, or serve the existing Pages layout from the repository root:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Then open http://127.0.0.1:8765/FFCardGame/. Opening HTML through `file:` is unsupported. Editing source requires rebuilding to update this static preview; Vite's dev server reads source directly.

## Code layout

- `client/src/game/`: typed battle state, seeded rules, and pure transitions; no React, DOM, or storage dependencies.
- `client/src/content/`: card definitions and prototype encounter constants.
- `client/src/components/`: battlefield, resources, cards, previews, and native dialogs rendered by React.
- `client/src/hooks/useBattle.ts`: synchronous input guards, transient action feedback, and battle orchestration.
- `client/src/persistence/`: optional tutorial preference storage, retaining its original key.
- `client/src/App.tsx`: screen composition, focus management, and modal selection.
- `style.css`: shared visual layout and reduced-motion rules. Artwork source files and provenance remain in `assets/`; Vite bundles only imported assets.
- `tests/`: combat, preferences, and reproducible balance simulation.

Edit source files rather than generated index.html/build files. The build has no public-directory copying and no source maps; it does not copy planning notes or unrelated repository files. Private design documents and local scratch work remain ignored by Git.

## Controls and rules

- Click a card to play it; attacks automatically target the guardian. Tab and Enter/Space work too. Hover or focus a card for its effect and strain preview.
- Start with 60 HP, 3 energy, and 5 cards. Guardian starts with 72 HP.
- At 6–9 strain, attacks gain 2 damage, evaluated before adding the card's strain. At 10 strain, lose 6 unblockable HP and reset strain to 4.
- End turn discards your hand, cools 3 strain, and resolves the enemy intention. Then your block expires, energy refills, and you draw 5.
- Guardian repeats 8 attack -> 6 block and 4 attack -> 14 attack. Its block lasts through your turn, then expires before its next action.
- Empty draw piles reshuffle the discard pile. Pressure Cycle cannot draw itself while resolving.
- Complete the card and overload before checking the outcome. Simultaneous defeat is a loss.
- Inspect piles without revealing draw order; the battle log keeps the latest 30 actions. Restart asks for confirmation.
- Reloading starts a fresh battle. Only tutorial dismissal persists, using `kiln-courier.tutorial-complete.v1`. Unavailable storage does not interrupt play.

Actions preserve revision guards and ignore double clicks, repeated keydown, or input during short feedback animations. Motion follows the operating system's reduced-motion preference. Small screens receive a wrapping fallback; desktop remains the primary layout.

## Verification baseline

All 17 original tests were migrated. During refactoring, every state matched the original engine across 100 seeded battles and 3,022 actions. Balance results remained identical: aggressive play averages 4.42 turns / 40.09 HP; defensive 5.57 turns / 52.59 HP; heat-aware 4.64 turns / 46.82 HP. Each policy won 100 of 100 battles. These simulations do not establish human play time.

## Artwork

The three raster illustrations were generated for this project using the built-in OpenAI image-generation tool. Interface icons and the kiln mark are original SVG geometry. No third-party fonts or audio are bundled. See [asset provenance and prompts](assets/PROVENANCE.md).
